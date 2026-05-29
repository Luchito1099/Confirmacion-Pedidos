// connection.jsx — Conexión con N8N via dos webhooks separados.
//
// Modos:
//   "demo"      : datos locales (window.PEDIDOS_DATA)
//   "n8n"       : dos webhooks de N8N (GET para leer, POST para escribir)
//   "rest"      : endpoint REST propio
//   "supabase"  : Supabase REST
//   "postgrest" : PostgREST estándar

const CONNECTION_DEFAULTS = {
  mode: "demo",
  // N8N: dos webhooks separados
  n8nGetUrl:  "",   // GET → devuelve array de pedidos
  n8nPostUrl: "",   // POST → recibe cambios (confirmar / clave)
  // Otros modos
  url:        "",
  apiKey:     "",
  table:      "pedidos",
  refreshSec: 30,
  mapping: {
    id:                "id",
    created_at:        "created_at",
    nombre:            "nombre",
    telefono:          "telefono",
    producto:          "producto",
    cantidad:          "cantidad",
    precio:            "precio",
    metodo_pago:       "metodo_pago",
    distrito:          "distrito",
    provincia:         "provincia",
    estado:            "estado",
    financial_status:  "financial_status",
    fulfillment_status:"fulfillment_status",
    es_confirmado:     "es_confirmado",
    notas:             "notas",
    clave:             "clave",
    courier:           "courier",
  }
};

const CONFIG_KEY    = "pedidos.connection.v3";
const OLD_KEYS      = ["pedidos.connection.v2", "pedidos.connection.v1"];
const COURIERS_KEY  = "couriers_config";
const DEFAULT_COURIERS_STR = "Shalom, Olva, JExpress, Otro";

function loadCouriers() {
  try {
    const raw = localStorage.getItem(COURIERS_KEY);
    const str = raw && raw.trim() ? raw : DEFAULT_COURIERS_STR;
    return str.split(",").map(s => s.trim()).filter(Boolean);
  } catch {
    return DEFAULT_COURIERS_STR.split(",").map(s => s.trim());
  }
}

function saveCouriers(str) {
  try { localStorage.setItem(COURIERS_KEY, str || ""); } catch {}
}

function loadConfig() {
  try {
    // Lee clave actual; si no existe migra desde versiones anteriores
    let raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) {
      for (const oldKey of OLD_KEYS) {
        const oldRaw = localStorage.getItem(oldKey);
        if (oldRaw) {
          raw = oldRaw;
          localStorage.setItem(CONFIG_KEY, oldRaw);   // migra
          console.log("[loadConfig] Migrado desde", oldKey, "→", CONFIG_KEY);
          break;
        }
      }
    }
    if (!raw) return CONNECTION_DEFAULTS;
    const parsed = JSON.parse(raw);
    const cfg = {
      ...CONNECTION_DEFAULTS,
      ...parsed,
      mapping: { ...CONNECTION_DEFAULTS.mapping, ...(parsed.mapping || {}) }
    };
    console.log("[loadConfig] mode:", cfg.mode, "| n8nGetUrl:", cfg.n8nGetUrl, "| n8nPostUrl:", cfg.n8nPostUrl);
    return cfg;
  } catch (e) {
    console.error("[loadConfig] error:", e.message);
    return CONNECTION_DEFAULTS;
  }
}

function saveConfig(cfg) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); } catch {}
}

function mapRow(row, mapping) {
  const out = {};
  for (const k of Object.keys(CONNECTION_DEFAULTS.mapping)) {
    const src = mapping[k] || k;
    out[k] = row[src] !== undefined ? row[src] : row[k];
  }
  out.cantidad      = Number(out.cantidad) || 0;
  out.precio        = Number(out.precio)   || 0;
  out.es_confirmado = out.es_confirmado === true || out.es_confirmado === "true" || out.es_confirmado === 1;
  if (!out.notas)    out.notas    = "";
  if (!out.provincia) out.provincia = "";
  if (!out.clave)    out.clave    = "";
  return out;
}

function buildHeaders(cfg) {
  const h = { "Accept": "application/json" };
  if (cfg.mode === "supabase" && cfg.apiKey) {
    h["apikey"]        = cfg.apiKey;
    h["Authorization"] = `Bearer ${cfg.apiKey}`;
  } else if (cfg.apiKey) {
    h["Authorization"] = `Bearer ${cfg.apiKey}`;
  }
  return h;
}

// ── fetchPedidos ──────────────────────────────────────────
// GET al webhook de N8N o al endpoint REST configurado.
// Devuelve { ok, data, source } | { ok: false, error }.
async function fetchPedidos(cfg) {
  if (cfg.mode === "demo") {
    return { ok: true, data: window.PEDIDOS_DATA, source: "demo" };
  }

  if (cfg.mode === "n8n") {
    const url = cfg.n8nGetUrl;
    if (!url) return { ok: true, data: window.PEDIDOS_DATA, source: "demo" };
    try {
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!res.ok) return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
      const body = await res.json();
      const rows = Array.isArray(body) ? body : (body.data || body.rows || []);
      // Normalizar tipos
      const data = rows.map(r => ({
        ...r,
        cantidad:      Number(r.cantidad) || 0,
        precio:        Number(r.precio)   || 0,
        es_confirmado: r.es_confirmado === true || r.es_confirmado === "true" || r.es_confirmado === 1,
        notas:         r.notas    || "",
        provincia:     r.provincia || "",
        // Acepta clave_shalom (nombre real en Postgres) o clave como fallback
        clave:         r.clave_shalom || r.clave || "",
        clave_shalom:  r.clave_shalom || r.clave || "",
        courier:       r.courier || "",
      }));
      console.log("PRIMER PEDIDO RAW:", JSON.stringify(rows[0]));   // DEBUG — comentar tras verificar
      console.log("PRIMER PEDIDO NORM:", JSON.stringify(data[0]));  // DEBUG
      return { ok: true, data, source: "n8n" };
    } catch (e) {
      return { ok: false, error: e.message || String(e) };
    }
  }

  // REST / Supabase / PostgREST
  if (!cfg.url) return { ok: true, data: window.PEDIDOS_DATA, source: "demo" };
  try {
    const base = cfg.url.replace(/\/+$/, "");
    let url;
    switch (cfg.mode) {
      case "supabase":  url = `${base}/rest/v1/${cfg.table}?select=*&order=created_at.desc`; break;
      case "postgrest": url = `${base}/${cfg.table}?order=created_at.desc`; break;
      default:          url = base;
    }
    const res = await fetch(url, { headers: buildHeaders(cfg) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status} ${res.statusText}` };
    const body = await res.json();
    const rows = Array.isArray(body) ? body : (body.data || body.rows || []);
    return { ok: true, data: rows.map(r => mapRow(r, cfg.mapping)), source: cfg.mode };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

// ── postN8N ───────────────────────────────────────────────
// Envía un cambio al webhook POST de N8N.
// Formato: { id, accion, ...campos }
async function postN8N(cfg, payload) {
  const url = cfg.n8nPostUrl;
  if (!url) {
    console.warn("[postN8N] ✗ n8nPostUrl está vacío. Ve a Conexión y configura el Webhook POST.");
    return { ok: false, error: "No configuraste la URL del webhook POST de N8N" };
  }
  console.log("[postN8N] → POST", url, JSON.stringify(payload));
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    let respBody = null;
    try { respBody = await res.clone().json(); } catch {}
    console.log("[postN8N] ← status", res.status, respBody);
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    console.error("[postN8N] error de red:", e.message);
    return { ok: false, error: e.message || String(e) };
  }
}

// ── patchConfirmacion ─────────────────────────────────────
// Confirma o desconfirma un pedido.
async function patchConfirmacion(cfg, id, value) {
  if (cfg.mode === "demo") return { ok: true };

  if (cfg.mode === "n8n") {
    return postN8N(cfg, {
      id,
      accion:        value ? "confirmar" : "desconfirmar",
      es_confirmado: value,
    });
  }

  // REST / Supabase / PostgREST
  if (!cfg.url) return { ok: true };
  try {
    const base       = cfg.url.replace(/\/+$/, "");
    const headers    = { ...buildHeaders(cfg), "Content-Type": "application/json" };
    const idCol      = cfg.mapping.id || "id";
    const confirmCol = cfg.mapping.es_confirmado || "es_confirmado";
    let url;
    if (cfg.mode === "supabase") {
      url = `${base}/rest/v1/${cfg.table}?${idCol}=eq.${encodeURIComponent(id)}`;
      headers["Prefer"] = "return=minimal";
    } else if (cfg.mode === "postgrest") {
      url = `${base}/${cfg.table}?${idCol}=eq.${encodeURIComponent(id)}`;
      headers["Prefer"] = "return=minimal";
    } else {
      url = `${base}/${encodeURIComponent(id)}`;
    }
    const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify({ [confirmCol]: value }) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

// ── patchCourier ──────────────────────────────────────────
async function patchCourier(cfg, id, courier) {
  if (cfg.mode === "demo") return { ok: true };
  if (cfg.mode === "n8n") return postN8N(cfg, { id, accion: "courier", courier });
  if (!cfg.url) return { ok: true };
  try {
    const base = cfg.url.replace(/\/+$/, "");
    const headers = { ...buildHeaders(cfg), "Content-Type": "application/json" };
    const idCol = cfg.mapping.id || "id";
    let url;
    if (cfg.mode === "supabase") {
      url = `${base}/rest/v1/${cfg.table}?${idCol}=eq.${encodeURIComponent(id)}`;
      headers["Prefer"] = "return=minimal";
    } else if (cfg.mode === "postgrest") {
      url = `${base}/${cfg.table}?${idCol}=eq.${encodeURIComponent(id)}`;
      headers["Prefer"] = "return=minimal";
    } else {
      url = `${base}/${encodeURIComponent(id)}`;
    }
    const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify({ courier }) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

// ── patchNotas ────────────────────────────────────────────
// Actualiza las notas de un pedido.
async function patchNotas(cfg, id, notas) {
  if (cfg.mode === "demo") return { ok: true };
  if (cfg.mode === "n8n") {
    return postN8N(cfg, { id, accion: "notas", notas });
  }
  if (!cfg.url) return { ok: true };
  try {
    const base    = cfg.url.replace(/\/+$/, "");
    const headers = { ...buildHeaders(cfg), "Content-Type": "application/json" };
    const idCol   = cfg.mapping.id || "id";
    let url;
    if (cfg.mode === "supabase") {
      url = `${base}/rest/v1/${cfg.table}?${idCol}=eq.${encodeURIComponent(id)}`;
      headers["Prefer"] = "return=minimal";
    } else if (cfg.mode === "postgrest") {
      url = `${base}/${cfg.table}?${idCol}=eq.${encodeURIComponent(id)}`;
      headers["Prefer"] = "return=minimal";
    } else {
      url = `${base}/${encodeURIComponent(id)}`;
    }
    const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify({ notas }) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

// ── patchClave ────────────────────────────────────────────
// Actualiza la clave (código de seguimiento) de un pedido.
async function patchClave(cfg, id, clave) {
  if (cfg.mode === "demo") return { ok: true };

  if (cfg.mode === "n8n") {
    return postN8N(cfg, { id, accion: "clave", clave });
  }

  // REST / Supabase / PostgREST — PATCH campo clave
  if (!cfg.url) return { ok: true };
  try {
    const base    = cfg.url.replace(/\/+$/, "");
    const headers = { ...buildHeaders(cfg), "Content-Type": "application/json" };
    const idCol   = cfg.mapping.id || "id";
    let url;
    if (cfg.mode === "supabase") {
      url = `${base}/rest/v1/${cfg.table}?${idCol}=eq.${encodeURIComponent(id)}`;
      headers["Prefer"] = "return=minimal";
    } else if (cfg.mode === "postgrest") {
      url = `${base}/${cfg.table}?${idCol}=eq.${encodeURIComponent(id)}`;
      headers["Prefer"] = "return=minimal";
    } else {
      url = `${base}/${encodeURIComponent(id)}`;
    }
    const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify({ clave }) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

// ── ConnectionBadge ───────────────────────────────────────
function ConnectionBadge({ status, mode, onClick }) {
  const labels = {
    demo:      "Demo",
    n8n:       "N8N Webhook",
    rest:      "REST",
    supabase:  "Supabase",
    postgrest: "PostgREST",
  };
  const dotColor = {
    ok:      "var(--c-green-mid)",
    loading: "var(--c-amber-mid)",
    error:   "#E05040",
    demo:    "var(--c-text-muted)",
  }[status] || "var(--c-text-muted)";

  return (
    <button className="conn-badge" onClick={onClick} title="Configurar conexión">
      <span className="conn-badge__dot" style={{ background: dotColor }} />
      <span className="conn-badge__mode">{labels[mode] || mode}</span>
      {status === "ok"      && <span className="conn-badge__status">OK</span>}
      {status === "loading" && <span className="conn-badge__status">Cargando…</span>}
      {status === "error"   && <span className="conn-badge__status">Error</span>}
      {status === "demo"    && <span className="conn-badge__status">Ejemplo</span>}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );
}

// ── ConnectionModal ───────────────────────────────────────
function ConnectionModal({ open, onClose, config, onSave }) {
  const [draft, setDraft]             = React.useState(config);
  const [testing, setTesting]         = React.useState(false);
  const [testResult, setTestResult]   = React.useState(null);
  const [showMapping, setShowMapping] = React.useState(false);
  const [couriersStr, setCouriersStr] = React.useState(
    () => localStorage.getItem(COURIERS_KEY) || DEFAULT_COURIERS_STR
  );

  React.useEffect(() => {
    setDraft(config);
    setTestResult(null);
    // Releer couriers al abrir el modal
    setCouriersStr(localStorage.getItem(COURIERS_KEY) || DEFAULT_COURIERS_STR);
  }, [config, open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set    = (patch) => setDraft(d => ({ ...d, ...patch }));
  const setMap = (k, v)  => setDraft(d => ({ ...d, mapping: { ...d.mapping, [k]: v } }));

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    const r = await fetchPedidos(draft);
    setTesting(false);
    setTestResult(r.ok
      ? { ok: true,  msg: `OK · ${r.data.length} pedidos recibidos` }
      : { ok: false, msg: r.error || "Error desconocido" }
    );
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-labelledby="conn-title">
        <header className="modal__head">
          <div>
            <h2 id="conn-title" className="modal__title">Conexión</h2>
            <p className="modal__sub">Configura cómo el panel recibe y envía pedidos</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="modal__body">
          {/* Modo */}
          <div className="form-row">
            <label className="form-label">Modo de conexión</label>
            <div className="mode-grid">
              {[
                { v: "demo",      l: "Demo",        d: "Pedidos de ejemplo" },
                { v: "n8n",       l: "N8N Webhooks", d: "Dos webhooks: GET leer / POST escribir" },
                { v: "supabase",  l: "Supabase",    d: "REST /rest/v1/ + apikey" },
                { v: "postgrest", l: "PostgREST",   d: "Postgres vía PostgREST" },
                { v: "rest",      l: "REST custom",  d: "Tu propio endpoint JSON" },
              ].map(m => (
                <button key={m.v}
                  className={`mode-card ${draft.mode === m.v ? "is-active" : ""}`}
                  onClick={() => set({ mode: m.v })} type="button">
                  <span className="mode-card__title">{m.l}</span>
                  <span className="mode-card__desc">{m.d}</span>
                </button>
              ))}
            </div>
          </div>

          {draft.mode === "n8n" && (
            <>
              {/* Webhook GET */}
              <div className="form-row">
                <label className="form-label" htmlFor="conn-get">
                  Webhook GET — cargar pedidos
                </label>
                <input id="conn-get" type="text" className="form-input"
                  placeholder="https://n8n.midominio.com/webhook/pedidos-get"
                  value={draft.n8nGetUrl}
                  onChange={(e) => set({ n8nGetUrl: e.target.value })} />
                <p className="form-hint">
                  El panel hace <code style={{fontFamily:"monospace"}}>GET</code> a esta URL al cargar y cada N segundos.
                  N8N debe responder con un array JSON de pedidos.
                  Usa la <strong>Production URL</strong> del webhook (no la de Test).
                </p>
              </div>

              {/* Webhook POST */}
              <div className="form-row">
                <label className="form-label" htmlFor="conn-post">
                  Webhook POST — confirmar / clave
                </label>
                <input id="conn-post" type="text" className="form-input"
                  placeholder="https://n8n.midominio.com/webhook/pedidos-post"
                  value={draft.n8nPostUrl}
                  onChange={(e) => set({ n8nPostUrl: e.target.value })} />
                <p className="form-hint">
                  El panel envía <code style={{fontFamily:"monospace"}}>POST</code> aquí al confirmar o editar la clave Shalom.
                  Body: <code style={{fontFamily:"monospace"}}>{"{ id, accion, es_confirmado?, clave? }"}</code>
                </p>
              </div>
            </>
          )}

          {(draft.mode === "rest" || draft.mode === "supabase" || draft.mode === "postgrest") && (
            <>
              <div className="form-row">
                <label className="form-label" htmlFor="conn-url">
                  {draft.mode === "supabase"  ? "URL del proyecto Supabase" :
                   draft.mode === "postgrest" ? "URL base de PostgREST" :
                   "Endpoint de tu API"}
                </label>
                <input id="conn-url" type="text" className="form-input"
                  placeholder={
                    draft.mode === "supabase"  ? "https://abcxyz.supabase.co" :
                    draft.mode === "postgrest" ? "https://miapi.com" :
                    "https://miapi.com/pedidos"
                  }
                  value={draft.url}
                  onChange={(e) => set({ url: e.target.value })} />
                <p className="form-hint">
                  {draft.mode === "supabase" && "Ej: https://abcxyzdef.supabase.co"}
                  {draft.mode === "postgrest" && "Sin la tabla — se agrega abajo."}
                  {draft.mode === "rest" && "Devuelve array JSON. PATCH /:id actualiza campos."}
                </p>
              </div>

              {(draft.mode === "supabase" || draft.mode === "postgrest") && (
                <div className="form-row">
                  <label className="form-label" htmlFor="conn-table">Tabla o vista</label>
                  <input id="conn-table" type="text" className="form-input"
                    placeholder="pedidos" value={draft.table}
                    onChange={(e) => set({ table: e.target.value })} />
                </div>
              )}

              <div className="form-row">
                <label className="form-label" htmlFor="conn-key">
                  {draft.mode === "supabase" ? "anon key (apikey)" : "API key / Bearer token"}
                  <span className="form-label__opt">{draft.mode === "supabase" ? "" : " (opcional)"}</span>
                </label>
                <input id="conn-key" type="password" className="form-input"
                  placeholder={draft.mode === "supabase" ? "eyJhbGciOiJIUzI1NiI..." : "Bearer ..."}
                  value={draft.apiKey}
                  onChange={(e) => set({ apiKey: e.target.value })} />
                <p className="form-hint">Se guarda solo en este navegador. Nunca se envía a otro lado.</p>
              </div>

              <div className="form-row">
                <button type="button" className="form-disclosure"
                  onClick={() => setShowMapping(s => !s)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: showMapping ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Mapeo de columnas {showMapping ? "" : "(opcional)"}
                </button>
                {showMapping && (
                  <div className="mapping-grid">
                    <div className="mapping-grid__head">
                      <span>Campo de la app</span><span>Columna en tu tabla</span>
                    </div>
                    {Object.keys(CONNECTION_DEFAULTS.mapping).map(k => (
                      <React.Fragment key={k}>
                        <code className="mapping-key">{k}</code>
                        <input type="text" className="form-input form-input--sm"
                          value={draft.mapping[k] || ""} placeholder={k}
                          onChange={(e) => setMap(k, e.target.value)} />
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Refresco — aplica a todos los modos no-demo */}
          {draft.mode !== "demo" && (
            <div className="form-row">
              <label className="form-label" htmlFor="conn-refresh">Intervalo de refresco automático</label>
              <div className="form-inline">
                <input id="conn-refresh" type="number" min="0" max="600"
                  className="form-input form-input--narrow"
                  value={draft.refreshSec}
                  onChange={(e) => set({ refreshSec: Number(e.target.value) })} />
                <span className="form-unit">seg · 0 = desactivado</span>
              </div>
            </div>
          )}

          {/* Probar conexión — solo si hay URL GET configurada */}
          {draft.mode !== "demo" && (draft.n8nGetUrl || draft.url) && (
            <div className="form-row">
              <button type="button" className="btn-secondary"
                onClick={handleTest} disabled={testing}>
                {testing ? "Probando…" : "Probar conexión (GET)"}
              </button>
              {testResult && (
                <div className={`test-result ${testResult.ok ? "test-result--ok" : "test-result--err"}`}>
                  {testResult.msg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Mis Couriers ─────────────────────────── */}
        <div className="modal__body" style={{ borderTop: "1px solid var(--c-divider)", paddingTop: "14px", gap: "8px" }}>
          <div className="form-row">
            <label className="form-label" htmlFor="couriers-input">
              Mis Couriers
            </label>
            <input
              id="couriers-input"
              type="text"
              className="form-input"
              placeholder="Ej: Shalom, Olva, JExpress, InDrive"
              value={couriersStr}
              onChange={(e) => setCouriersStr(e.target.value)}
            />
            <p className="form-hint">
              Separa cada courier con una coma. Se guardan en este navegador.
            </p>
          </div>
        </div>

        <footer className="modal__footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={() => {
            saveCouriers(couriersStr);
            onSave(draft);
            onClose();
          }}>
            Guardar
          </button>
        </footer>
      </div>
    </>
  );
}

Object.assign(window, {
  CONNECTION_DEFAULTS,
  loadConfig, saveConfig,
  loadCouriers, saveCouriers,
  fetchPedidos, patchConfirmacion, patchClave, patchNotas, patchCourier,
  ConnectionBadge, ConnectionModal,
});
