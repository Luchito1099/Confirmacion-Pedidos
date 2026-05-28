// server.js — Servidor local para recibir pedidos de N8N y servirlos al panel.
//
// Arrancar: node server.js
// Panel:    http://localhost:3000
//
// N8N envía pedidos a:  POST http://localhost:3000/api/pedidos   (JSON array o objeto)
// El panel lee de:      GET  http://localhost:3000/api/pedidos
// Confirmación:         PATCH http://localhost:3000/api/pedidos/:id  { "es_confirmado": true }

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const https   = require('https');
const http    = require('http');

const app       = express();
const PORT      = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'pedidos-data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));   // sirve Pedidos.html y los .jsx

// ── Persistencia ──────────────────────────────────────────────────────────────
let store = [];

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log(`[store] ${store.length} pedidos cargados desde ${DATA_FILE}`);
    }
  } catch (e) {
    console.error('[store] Error al leer archivo:', e.message);
  }
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('[store] Error al guardar archivo:', e.message);
  }
}

loadStore();

// ── GET /api/pedidos ──────────────────────────────────────────────────────────
// El panel React hace fetch a esta URL para obtener los pedidos.
app.get('/api/pedidos', (_req, res) => {
  res.json(store);
});

// ── POST /api/pedidos ─────────────────────────────────────────────────────────
// N8N envía pedidos aquí. Acepta array o objeto único.
// Upsert por campo "id" (o "order_code" como fallback).
// El campo "es_confirmado" existente se preserva si el nuevo no lo trae.
app.post('/api/pedidos', (req, res) => {
  const body     = req.body;
  const incoming = Array.isArray(body) ? body : [body];

  let updated = 0;
  let created = 0;

  for (const order of incoming) {
    const key = order.id ?? order.order_code;
    if (!key) continue;

    const idx = store.findIndex(p =>
      String(p.id) === String(key) ||
      String(p.order_code) === String(key)
    );

    if (idx >= 0) {
      const prev = store[idx];
      store[idx] = {
        ...order,
        es_confirmado: order.es_confirmado !== undefined
          ? order.es_confirmado
          : prev.es_confirmado,
      };
      updated++;
    } else {
      store.push({ es_confirmado: false, ...order });
      created++;
    }
  }

  saveStore();
  console.log(`[POST /api/pedidos] +${created} nuevos, ~${updated} actualizados`);
  res.json({ ok: true, created, updated, total: store.length });
});

// ── PATCH /api/pedidos/:id ────────────────────────────────────────────────────
// El panel actualiza es_confirmado de un pedido.
app.patch('/api/pedidos/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.findIndex(p => String(p.id) === String(id));
  if (idx < 0) return res.status(404).json({ ok: false, error: 'Pedido no encontrado' });

  store[idx] = { ...store[idx], ...req.body };
  saveStore();
  res.json({ ok: true });
});

// ── DELETE /api/pedidos ───────────────────────────────────────────────────────
// Limpia todos los pedidos (útil para testing).
app.delete('/api/pedidos', (_req, res) => {
  store = [];
  saveStore();
  console.log('[DELETE /api/pedidos] Store vaciado');
  res.json({ ok: true });
});

// ── POST /api/sync ────────────────────────────────────────────────────────────
// Activa el webhook de N8N para que actualice los pedidos.
// El panel llama a este endpoint cuando el usuario pulsa "Sincronizar".
app.post('/api/sync', async (req, res) => {
  const webhookUrl = req.body?.webhookUrl || process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(400).json({ ok: false, error: 'No se configuró una URL de webhook de N8N' });
  }

  try {
    const result = await callWebhook(webhookUrl, { source: 'pedidos-panel', ts: Date.now() });
    console.log(`[/api/sync] Webhook activado → ${result.status}`);

    // Si N8N responde con un array de pedidos, los cargamos directamente
    if (Array.isArray(result.body)) {
      const incoming = result.body;
      let updated = 0, created = 0;
      for (const order of incoming) {
        const key = order.id ?? order.order_code;
        if (!key) continue;
        const idx = store.findIndex(p =>
          String(p.id) === String(key) ||
          String(p.order_code) === String(key)
        );
        if (idx >= 0) {
          store[idx] = { ...order, es_confirmado: order.es_confirmado !== undefined ? order.es_confirmado : store[idx].es_confirmado };
          updated++;
        } else {
          store.push({ es_confirmado: false, ...order });
          created++;
        }
      }
      saveStore();
      return res.json({ ok: true, source: 'webhook-response', created, updated, total: store.length });
    }

    res.json({ ok: true, source: 'webhook-triggered', status: result.status });
  } catch (e) {
    console.error('[/api/sync] Error al llamar webhook:', e.message);
    res.status(502).json({ ok: false, error: e.message });
  }
});

// ── Helper: llama a una URL y devuelve { status, body } ──────────────────────
function callWebhook(url, payload) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const data    = JSON.stringify(payload);

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (isHttps ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = (isHttps ? https : http).request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        let body;
        try { body = JSON.parse(raw); } catch { body = raw; }
        resolve({ status: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout al llamar webhook')); });
    req.write(data);
    req.end();
  });
}

// ── Inicio ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  Panel de Pedidos corriendo en http://localhost:' + PORT);
  console.log('');
  console.log('  N8N → POST  http://localhost:' + PORT + '/api/pedidos   (enviar pedidos)');
  console.log('  Panel← GET  http://localhost:' + PORT + '/api/pedidos   (leer pedidos)');
  console.log('  Sync → POST http://localhost:' + PORT + '/api/sync      (activar webhook N8N)');
  console.log('');
});
