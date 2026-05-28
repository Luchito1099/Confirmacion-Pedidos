// data.jsx — Pedidos de ejemplo (Perú).
// El día que conectes Postgres, reemplaza window.PEDIDOS_DATA por el fetch real.

(function () {
  const now = new Date();
  // Hora "actual" del demo: 14:30 hoy
  now.setHours(14, 30, 0, 0);

  function daysAgo(d, h = 10, m = 0) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    date.setHours(h, m, 0, 0);
    return date.toISOString();
  }

  const productos = [
    "Sérum Vitamina C 30ml",
    "Crema hidratante facial 50g",
    "Mascarilla nocturna",
    "Tónico equilibrante 200ml",
    "Limpiador suave 150ml",
    "Protector solar SPF50",
    "Aceite de rosa mosqueta",
    "Bálsamo labial duo",
    "Contorno de ojos 15ml",
    "Exfoliante AHA"
  ];

  const distritosLima = [
    "Miraflores", "San Isidro", "Surco", "La Molina", "San Borja",
    "Surquillo", "Barranco", "Chorrillos", "San Miguel", "Pueblo Libre",
    "Jesús María", "Lince", "Magdalena", "Los Olivos", "San Martín de Porres"
  ];

  const metodos = ["yape", "plin", "transferencia", "efectivo", "tarjeta"];

  const PEDIDOS = [
    // ── HOY ────────────────────────────────────────────────
    {
      id: "PED-1058", created_at: daysAgo(0, 13, 42),
      nombre: "María Fernández Quispe", telefono: "987654321",
      producto: "Sérum Vitamina C 30ml", cantidad: 1, precio: 89.00,
      metodo_pago: "yape", distrito: "Miraflores", provincia: "Lima",
      estado: "nuevo", financial_status: "pagado", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: "Cliente prefiere entrega en la tarde. Edificio con conserje."
    },
    {
      id: "PED-1057", created_at: daysAgo(0, 12, 15),
      nombre: "Carlos Mendoza Ríos", telefono: "956123478",
      producto: "Crema hidratante facial 50g", cantidad: 2, precio: 124.00,
      metodo_pago: "plin", distrito: "San Isidro", provincia: "Lima",
      estado: "nuevo", financial_status: "pagado", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: ""
    },
    {
      id: "PED-1056", created_at: daysAgo(0, 11, 30),
      nombre: "Lucía Paredes Vega", telefono: "912345670",
      producto: "Protector solar SPF50", cantidad: 1, precio: 72.00,
      metodo_pago: "yape", distrito: "Surco", provincia: "Lima",
      estado: "nuevo", financial_status: "pendiente", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: "Confirmar pago antes de despachar."
    },
    {
      id: "PED-1055", created_at: daysAgo(0, 10, 5),
      nombre: "Diego Salazar Torres", telefono: "998877665",
      producto: "Pack: Sérum + Crema + Tónico", cantidad: 1, precio: 248.00,
      metodo_pago: "transferencia", distrito: "La Molina", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "preparando",
      es_confirmado: true,
      notas: "Regalo. Incluir tarjeta personalizada: 'Feliz cumpleaños Ana'."
    },
    {
      id: "PED-1054", created_at: daysAgo(0, 9, 20),
      nombre: "Ana Sofía Linares", telefono: "945678123",
      producto: "Mascarilla nocturna", cantidad: 3, precio: 147.00,
      metodo_pago: "yape", distrito: "Barranco", provincia: "Lima",
      estado: "nuevo", financial_status: "pagado", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: ""
    },

    // ── AYER ───────────────────────────────────────────────
    {
      id: "PED-1053", created_at: daysAgo(1, 19, 45),
      nombre: "Roberto Aguirre Cano", telefono: "923456789",
      producto: "Aceite de rosa mosqueta", cantidad: 1, precio: 65.00,
      metodo_pago: "plin", distrito: "Jesús María", provincia: "Lima",
      estado: "nuevo", financial_status: "pagado", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: "Llamar antes de llegar. Casa sin timbre."
    },
    {
      id: "PED-1052", created_at: daysAgo(1, 17, 12),
      nombre: "Patricia Ñahui Cárdenas", telefono: "967123456",
      producto: "Tónico equilibrante 200ml", cantidad: 2, precio: 98.00,
      metodo_pago: "efectivo", distrito: "Cayma", provincia: "Arequipa",
      estado: "nuevo", financial_status: "pendiente", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: "Envío a provincia vía Olva. Pago contra entrega."
    },
    {
      id: "PED-1051", created_at: daysAgo(1, 15, 30),
      nombre: "Javier Bustamante Rojas", telefono: "934567890",
      producto: "Contorno de ojos 15ml", cantidad: 1, precio: 85.00,
      metodo_pago: "yape", distrito: "San Borja", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "preparando",
      es_confirmado: true,
      notas: ""
    },
    {
      id: "PED-1050", created_at: daysAgo(1, 14, 0),
      nombre: "Camila Espinoza Llanos", telefono: "976543210",
      producto: "Limpiador suave 150ml", cantidad: 1, precio: 58.00,
      metodo_pago: "tarjeta", distrito: "Magdalena", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "enviado",
      es_confirmado: true,
      notas: "Tracking: OLV-2284-7733"
    },
    {
      id: "PED-1049", created_at: daysAgo(1, 11, 48),
      nombre: "Sebastián Cordova Pinto", telefono: "989012345",
      producto: "Exfoliante AHA", cantidad: 1, precio: 79.00,
      metodo_pago: "yape", distrito: "Surquillo", provincia: "Lima",
      estado: "nuevo", financial_status: "pagado", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: ""
    },
    {
      id: "PED-1048", created_at: daysAgo(1, 10, 22),
      nombre: "Andrea Vilcahuamán Soto", telefono: "917283645",
      producto: "Bálsamo labial duo", cantidad: 4, precio: 96.00,
      metodo_pago: "plin", distrito: "Lince", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "preparando",
      es_confirmado: true,
      notas: "Cliente recurrente — descuento aplicado 10%."
    },

    // ── HACE 2 DÍAS ────────────────────────────────────────
    {
      id: "PED-1047", created_at: daysAgo(2, 20, 5),
      nombre: "Fernando Acuña Delgado", telefono: "942356781",
      producto: "Sérum Vitamina C 30ml", cantidad: 2, precio: 178.00,
      metodo_pago: "transferencia", distrito: "San Miguel", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "enviado",
      es_confirmado: true,
      notas: ""
    },
    {
      id: "PED-1046", created_at: daysAgo(2, 18, 30),
      nombre: "Valeria Huamán Quiroz", telefono: "928374561",
      producto: "Mascarilla nocturna", cantidad: 1, precio: 49.00,
      metodo_pago: "yape", distrito: "Pueblo Libre", provincia: "Lima",
      estado: "nuevo", financial_status: "pagado", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: "Preguntó si manejamos suscripción mensual."
    },
    {
      id: "PED-1045", created_at: daysAgo(2, 16, 15),
      nombre: "Gabriel Otárola Núñez", telefono: "961234587",
      producto: "Pack: Sérum + Crema + Tónico", cantidad: 1, precio: 248.00,
      metodo_pago: "tarjeta", distrito: "Wanchaq", provincia: "Cusco",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "enviado",
      es_confirmado: true,
      notas: "Envío a Cusco. Tracking: SHA-9911-2233"
    },
    {
      id: "PED-1044", created_at: daysAgo(2, 12, 0),
      nombre: "Daniela Pizarro Manrique", telefono: "975346812",
      producto: "Crema hidratante facial 50g", cantidad: 1, precio: 62.00,
      metodo_pago: "yape", distrito: "Chorrillos", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "entregado",
      es_confirmado: true,
      notas: ""
    },

    // ── HACE 3 DÍAS ────────────────────────────────────────
    {
      id: "PED-1043", created_at: daysAgo(3, 19, 10),
      nombre: "Renato Villarreal Castro", telefono: "918273645",
      producto: "Protector solar SPF50", cantidad: 2, precio: 144.00,
      metodo_pago: "plin", distrito: "Miraflores", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "entregado",
      es_confirmado: true,
      notas: ""
    },
    {
      id: "PED-1042", created_at: daysAgo(3, 14, 45),
      nombre: "Mónica Lévano Bazán", telefono: "934857261",
      producto: "Tónico equilibrante 200ml", cantidad: 1, precio: 49.00,
      metodo_pago: "yape", distrito: "Los Olivos", provincia: "Lima",
      estado: "nuevo", financial_status: "pendiente", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: "No responde mensajes desde el día del pedido."
    },
    {
      id: "PED-1041", created_at: daysAgo(3, 11, 30),
      nombre: "Ignacio Beltrán Salas", telefono: "952637481",
      producto: "Aceite de rosa mosqueta", cantidad: 1, precio: 65.00,
      metodo_pago: "yape", distrito: "Trujillo Centro", provincia: "Trujillo",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "entregado",
      es_confirmado: true,
      notas: ""
    },

    // ── HACE 4 DÍAS ────────────────────────────────────────
    {
      id: "PED-1040", created_at: daysAgo(4, 17, 0),
      nombre: "Isabella Romero Tito", telefono: "987162534",
      producto: "Exfoliante AHA", cantidad: 2, precio: 158.00,
      metodo_pago: "transferencia", distrito: "San Isidro", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "entregado",
      es_confirmado: true,
      notas: ""
    },
    {
      id: "PED-1039", created_at: daysAgo(4, 13, 25),
      nombre: "Bruno Cárdenas Aliaga", telefono: "913524768",
      producto: "Contorno de ojos 15ml", cantidad: 1, precio: 85.00,
      metodo_pago: "yape", distrito: "Surco", provincia: "Lima",
      estado: "nuevo", financial_status: "pagado", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: "Pedido olvidado en revisión."
    },

    // ── HACE 5 DÍAS ────────────────────────────────────────
    {
      id: "PED-1038", created_at: daysAgo(5, 15, 50),
      nombre: "Karla Mendiola Sifuentes", telefono: "964738291",
      producto: "Limpiador suave 150ml", cantidad: 3, precio: 174.00,
      metodo_pago: "plin", distrito: "La Molina", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "entregado",
      es_confirmado: true,
      notas: ""
    },
    {
      id: "PED-1037", created_at: daysAgo(5, 10, 10),
      nombre: "Tomás Echevarría Olano", telefono: "925836417",
      producto: "Bálsamo labial duo", cantidad: 2, precio: 48.00,
      metodo_pago: "yape", distrito: "Castilla", provincia: "Piura",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "entregado",
      es_confirmado: true,
      notas: ""
    },

    // ── HACE 6 DÍAS ────────────────────────────────────────
    {
      id: "PED-1036", created_at: daysAgo(6, 18, 40),
      nombre: "Estefanía Quiñones Bravo", telefono: "971628354",
      producto: "Sérum Vitamina C 30ml", cantidad: 1, precio: 89.00,
      metodo_pago: "tarjeta", distrito: "Jesús María", provincia: "Lima",
      estado: "procesando", financial_status: "pagado", fulfillment_status: "entregado",
      es_confirmado: true,
      notas: ""
    },
    {
      id: "PED-1035", created_at: daysAgo(6, 14, 15),
      nombre: "Mauricio Llosa Ferrari", telefono: "938475612",
      producto: "Mascarilla nocturna", cantidad: 2, precio: 98.00,
      metodo_pago: "yape", distrito: "Barranco", provincia: "Lima",
      estado: "nuevo", financial_status: "pagado", fulfillment_status: "no_enviado",
      es_confirmado: false,
      notas: "Cliente nuevo. Verificar dirección por WhatsApp."
    },
  ];

  // Lista de productos únicos para filtros
  const productosUnicos = [...new Set(PEDIDOS.map(p => p.producto))].sort();
  const distritosUnicos = [...new Set(PEDIDOS.map(p => p.distrito))].sort();
  const provinciasUnicas = [...new Set(PEDIDOS.map(p => p.provincia))].sort();

  window.PEDIDOS_DATA = PEDIDOS;
  window.PEDIDOS_PRODUCTOS = productosUnicos;
  window.PEDIDOS_DISTRITOS = distritosUnicos;
  window.PEDIDOS_PROVINCIAS = provinciasUnicas;
  window.PEDIDOS_NOW = now.toISOString();
})();
