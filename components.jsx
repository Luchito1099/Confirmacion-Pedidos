// components.jsx — UI building blocks for the Pedidos page.

// ── Helpers ──────────────────────────────────────────────
const NOW = new Date(window.PEDIDOS_NOW);

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diffDays(a, b) {
  return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
}

function formatFecha(iso, fmt) {
  const d = new Date(iso);
  const dDiff = diffDays(NOW, d);
  if (fmt === "relativa") {
    if (dDiff === 0) return "Hoy";
    if (dDiff === 1) return "Ayer";
    if (dDiff < 7) return `Hace ${dDiff} días`;
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  }
  if (fmt === "corta") {
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
  }
  // absoluta
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function formatHora(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatSoles(n) {
  return "S/ " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function groupByDay(pedidos) {
  const groups = new Map();
  pedidos.forEach(p => {
    const key = startOfDay(new Date(p.created_at)).getTime();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  });
  // Sort groups newest first, items inside also newest first
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([ts, items]) => ({
      ts,
      label: dayLabel(ts),
      items: items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }));
}

function dayLabel(ts) {
  const d = new Date(ts);
  const dDiff = diffDays(NOW, d);
  if (dDiff === 0) return "Hoy";
  if (dDiff === 1) return "Ayer";
  const dayName = d.toLocaleDateString("es-PE", { weekday: "long" });
  const dateStr = d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} · ${dateStr}`;
}

// ── Icons (minimal, inline SVG) ───────────────────────────
function Icon({ name, size = 14 }) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "check":
      return <svg {...common}><polyline points="20 6 9 17 4 12" /></svg>;
    case "x":
      return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case "filter":
      return <svg {...common}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>;
    case "chevron-down":
      return <svg {...common}><polyline points="6 9 12 15 18 9" /></svg>;
    case "chevron-right":
      return <svg {...common}><polyline points="9 18 15 12 9 6" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case "pin":
      return <svg {...common}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case "phone":
      return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case "package":
      return <svg {...common}><path d="M16.5 9.4l-9-5.19" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
    case "copy":
      return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
    case "note":
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    default:
      return null;
  }
}

// ── Estado pill / chips ───────────────────────────────────
function StatusChip({ kind, value }) {
  // Color map by family
  const map = {
    financial: {
      pagado:     { bg: "var(--c-green-soft)",  fg: "var(--c-green-deep)",  label: "Pagado" },
      pendiente:  { bg: "var(--c-amber-soft)",  fg: "var(--c-amber-deep)",  label: "Pago pend." },
      reembolsado:{ bg: "var(--c-neutral-soft)",fg: "var(--c-text-muted)",  label: "Reembolsado" },
    },
    fulfillment: {
      no_enviado: { bg: "var(--c-neutral-soft)",fg: "var(--c-text-muted)",  label: "Sin enviar" },
      preparando: { bg: "var(--c-blue-soft)",   fg: "var(--c-blue-deep)",   label: "Preparando" },
      enviado:    { bg: "var(--c-blue-soft)",   fg: "var(--c-blue-deep)",   label: "Enviado" },
      entregado:  { bg: "var(--c-green-soft)",  fg: "var(--c-green-deep)",  label: "Entregado" },
    },
    estado: {
      nuevo:      { bg: "var(--c-amber-soft)",  fg: "var(--c-amber-deep)",  label: "Nuevo" },
      procesando: { bg: "var(--c-blue-soft)",   fg: "var(--c-blue-deep)",   label: "Procesando" },
      enviado:    { bg: "var(--c-blue-soft)",   fg: "var(--c-blue-deep)",   label: "Enviado" },
      entregado:  { bg: "var(--c-green-soft)",  fg: "var(--c-green-deep)",  label: "Entregado" },
    },
    metodo: {
      yape:           { bg: "#F3E8E5", fg: "#7A2E1F", label: "Yape" },
      plin:           { bg: "#E8E5F0", fg: "#3F2E7A", label: "Plin" },
      transferencia:  { bg: "var(--c-neutral-soft)", fg: "var(--c-text-muted)", label: "Transferencia" },
      efectivo:       { bg: "var(--c-amber-soft)", fg: "var(--c-amber-deep)", label: "Efectivo" },
      tarjeta:        { bg: "var(--c-blue-soft)", fg: "var(--c-blue-deep)", label: "Tarjeta" },
    }
  };
  const c = (map[kind] && map[kind][value]) || { bg: "var(--c-neutral-soft)", fg: "var(--c-text-muted)", label: value };
  return (
    <span className="chip" style={{ background: c.bg, color: c.fg }}>
      {c.label}
    </span>
  );
}

// ── Clave inline editor ───────────────────────────────────
function ClaveInput({ id, value, onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft]     = React.useState(value || "");

  // Sync cuando cambia el valor externo (refresco)
  React.useEffect(() => { if (!editing) setDraft(value || ""); }, [value, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== (value || "").trim()) onSave(id, trimmed);
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter")  { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
    e.stopPropagation();
  };

  if (editing) {
    return (
      <input
        className="form-input form-input--sm clave-input"
        value={draft}
        autoFocus
        placeholder="Código Shalom"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={`clave-tag${value ? " clave-tag--set" : ""}`}
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title={value ? `Clave Shalom: ${value} — clic para editar` : "Agregar clave Shalom"}
    >
      {value ? value : <span className="clave-tag__empty">+ clave</span>}
    </span>
  );
}

// ── Notas inline editor ───────────────────────────────────
function NotasInput({ id, value, onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft]     = React.useState(value || "");

  React.useEffect(() => { if (!editing) setDraft(value || ""); }, [value, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed !== (value || "").trim()) onSave(id, trimmed);
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && e.ctrlKey) { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
    e.stopPropagation();
  };

  if (editing) {
    return (
      <textarea
        className="form-input notas-textarea"
        rows={3}
        value={draft}
        autoFocus
        placeholder="Escribe una nota… (Ctrl+Enter para guardar)"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  const preview = value ? value.slice(0, 30) + (value.length > 30 ? "…" : "") : null;
  return (
    <span
      className={`notas-tag${value ? " notas-tag--set" : ""}`}
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title={value ? value : "Agregar nota"}
    >
      📝 {preview || <span className="notas-tag__empty">+ nota</span>}
    </span>
  );
}

// ── Pedido Card ───────────────────────────────────────────
function PedidoCard({ pedido, selected, onToggleSelect, onConfirm, onUnconfirm, onOpen, onUpdateClave, onUpdateNotas, density, dateFmt }) {
  const confirmado = pedido.es_confirmado;
  return (
    <div
      className={`pedido-card ${confirmado ? "is-confirmed" : "is-pending"} ${selected ? "is-selected" : ""}`}
      data-density={density}
      onClick={() => onOpen(pedido)}
    >
      <div className="pedido-card__head">
        <label className="checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(pedido.id)}
          />
          <span></span>
        </label>
        <div className="pedido-card__id">{pedido.id}</div>
        <div className="pedido-card__hora">{formatHora(pedido.created_at)}</div>
      </div>

      <div className="pedido-card__nombre">{pedido.nombre}</div>

      <div className="pedido-card__producto">
        <Icon name="package" size={12} />
        <span>{pedido.producto}</span>
        {pedido.cantidad > 1 && <span className="qty">×{pedido.cantidad}</span>}
      </div>

      <div className="pedido-card__meta">
        <span className="pedido-card__precio">{formatSoles(pedido.precio)}</span>
        <span className="pedido-card__distrito">
          <Icon name="pin" size={11} />
          {pedido.distrito}
          {pedido.provincia !== "Lima" && <span className="prov">, {pedido.provincia}</span>}
        </span>
      </div>

      <div className="pedido-card__chips">
        <StatusChip kind="metodo" value={pedido.metodo_pago} />
        <StatusChip kind="financial" value={pedido.financial_status} />
        {density !== "compacta" && <StatusChip kind="fulfillment" value={pedido.fulfillment_status} />}
      </div>

      {/* Clave de seguimiento Shalom */}
      <div className="pedido-card__clave" onClick={(e) => e.stopPropagation()}>
        <ClaveInput
          id={pedido.id}
          value={pedido.clave_shalom || pedido.clave || ""}
          onSave={onUpdateClave}
        />
      </div>

      {/* Notas inline */}
      <div className="pedido-card__notas" onClick={(e) => e.stopPropagation()}>
        <NotasInput
          id={pedido.id}
          value={pedido.notas ?? ""}
          onSave={onUpdateNotas}
        />
      </div>

      {/* Botón siempre al fondo */}
      <div className="pedido-card__actions" style={{marginTop:"auto"}} onClick={(e) => e.stopPropagation()}>
        {confirmado ? (
          <button className="btn-unconfirm" onClick={() => onUnconfirm(pedido.id)}>
            <Icon name="x" size={12} />
            Des-confirmar
          </button>
        ) : (
          <button className="btn-confirm" onClick={() => onConfirm(pedido.id)}>
            <Icon name="check" size={12} />
            Confirmar
          </button>
        )}
      </div>
    </div>
  );
}

// ── Date Group ────────────────────────────────────────────
function DateGroup({ group, defaultCollapsed, selectedIds, ...cardProps }) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const total = group.items.reduce((s, p) => s + p.precio, 0);
  return (
    <div className={`date-group ${collapsed ? "is-collapsed" : ""}`}>
      <button className="date-group__header" onClick={() => setCollapsed(!collapsed)}>
        <Icon name={collapsed ? "chevron-right" : "chevron-down"} size={14} />
        <span className="date-group__label">{group.label}</span>
        <span className="date-group__count">{group.items.length}</span>
        <span className="date-group__total">{formatSoles(total)}</span>
      </button>
      {!collapsed && (
        <div className="date-group__cards">
          {group.items.map(p => (
            <PedidoCard
              key={p.id}
              pedido={p}
              selected={selectedIds ? selectedIds.has(p.id) : false}
              {...cardProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────
function KanbanColumn({ title, count, total, groups, isConfirmedCol, accent, selectedIds, ...cardProps }) {
  return (
    <section className="column" data-kind={isConfirmedCol ? "confirmed" : "pending"} style={{ "--col-accent": accent }}>
      <header className="column__header">
        <div className="column__title-row">
          <span className="column__dot" />
          <h2 className="column__title">{title}</h2>
          <span className="column__count">{count}</span>
        </div>
        <div className="column__total">{formatSoles(total)}</div>
      </header>
      <div className="column__body">
        {groups.length === 0 ? (
          <div className="column__empty">Sin pedidos en este rango</div>
        ) : (
          groups.map((g, i) => (
            <DateGroup
              key={g.ts}
              group={g}
              defaultCollapsed={isConfirmedCol && i > 0}
              selectedIds={selectedIds}
              {...cardProps}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ── Filters bar ──────────────────────────────────────────
function FiltersBar({ filters, setFilters, productos, distritos, dateRange, setDateRange }) {
  return (
    <div className="filters">
      <div className="filters__group">
        <label className="filters__label">Rango</label>
        <div className="seg">
          {[
            { v: "hoy", l: "Hoy" },
            { v: "7d",  l: "7 días" },
            { v: "30d", l: "30 días" },
            { v: "all", l: "Todo" },
          ].map(opt => (
            <button
              key={opt.v}
              className={`seg__btn ${dateRange === opt.v ? "is-active" : ""}`}
              onClick={() => setDateRange(opt.v)}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__group filters__group--grow">
        <label className="filters__label">Buscar</label>
        <div className="input-wrap">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Nombre o teléfono"
            value={filters.query}
            onChange={(e) => setFilters(f => ({ ...f, query: e.target.value }))}
          />
          {filters.query && (
            <button className="input-clear" onClick={() => setFilters(f => ({ ...f, query: "" }))}>
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="filters__group">
        <label className="filters__label">Producto</label>
        <select
          value={filters.producto}
          onChange={(e) => setFilters(f => ({ ...f, producto: e.target.value }))}
        >
          <option value="">Todos</option>
          {productos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="filters__group">
        <label className="filters__label">Distrito / Provincia</label>
        <select
          value={filters.distrito}
          onChange={(e) => setFilters(f => ({ ...f, distrito: e.target.value }))}
        >
          <option value="">Todos</option>
          {distritos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Summary bar ──────────────────────────────────────────
function Summary({ pending, confirmed, total, pendingTotal, confirmedTotal, extras }) {
  return (
    <div className="summary">
      <div className="summary__title">
        <h1>Pedidos</h1>
        <p>Confirma y haz seguimiento de tus pedidos del día</p>
        {extras && <div className="summary__head-actions">{extras}</div>}
      </div>
      <div className="summary__metrics">
        <div className="metric metric--pending">
          <div className="metric__label">Pendientes</div>
          <div className="metric__value">{pending}</div>
          <div className="metric__sub">{formatSoles(pendingTotal)}</div>
        </div>
        <div className="metric metric--confirmed">
          <div className="metric__label">Confirmados</div>
          <div className="metric__value">{confirmed}</div>
          <div className="metric__sub">{formatSoles(confirmedTotal)}</div>
        </div>
        <div className="metric metric--total">
          <div className="metric__label">Total visible</div>
          <div className="metric__value">{pending + confirmed}</div>
          <div className="metric__sub">{formatSoles(total)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Side panel ───────────────────────────────────────────
function SidePanel({ pedido, onClose, onConfirm, onUnconfirm, onUpdateClave, onUpdateNotas }) {
  React.useEffect(() => {
    if (!pedido) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pedido, onClose]);

  if (!pedido) return null;
  const copy = (txt) => navigator.clipboard?.writeText(txt);

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} />
      <aside className="side-panel">
        <header className="side-panel__head">
          <div>
            <div className="side-panel__id">{pedido.id}</div>
            <div className="side-panel__date">
              <Icon name="calendar" size={12} />
              {new Date(pedido.created_at).toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
              {" · "}
              {formatHora(pedido.created_at)}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={16} />
          </button>
        </header>

        <div className="side-panel__hero">
          <h2 className="side-panel__nombre">{pedido.nombre}</h2>
          <div className="side-panel__chip-row">
            {pedido.es_confirmado ? (
              <span className="status-flag status-flag--confirmed">
                <Icon name="check" size={12} /> Confirmado
              </span>
            ) : (
              <span className="status-flag status-flag--pending">
                Pendiente de confirmar
              </span>
            )}
          </div>
        </div>

        <div className="side-panel__grid">
          <Field label="Teléfono" copyable onCopy={() => copy(pedido.telefono)}>
            <a href={`https://wa.me/51${pedido.telefono}`} target="_blank" rel="noreferrer">{pedido.telefono}</a>
          </Field>
          <Field label="Método de pago"><StatusChip kind="metodo" value={pedido.metodo_pago} /></Field>

          <Field label="Producto">{pedido.producto}</Field>
          <Field label="Cantidad">{pedido.cantidad}</Field>

          <Field label="Precio total" mono>{formatSoles(pedido.precio)}</Field>
          <Field label="Estado"><StatusChip kind="estado" value={pedido.estado} /></Field>

          <Field label="Distrito" copyable onCopy={() => copy(`${pedido.distrito}, ${pedido.provincia}`)}>
            {pedido.distrito}
          </Field>
          <Field label="Provincia">{pedido.provincia}</Field>

          <Field label="Estado financiero"><StatusChip kind="financial" value={pedido.financial_status} /></Field>
          <Field label="Estado de envío"><StatusChip kind="fulfillment" value={pedido.fulfillment_status} /></Field>

          <div className="field" style={{gridColumn:"1/-1"}}>
            <div className="field__label">Clave Shalom</div>
            <div className="field__value">
              <ClaveInput
                id={pedido.id}
                value={pedido.clave_shalom || pedido.clave || ""}
                onSave={onUpdateClave}
              />
            </div>
          </div>
        </div>

        <div className="side-panel__notas">
          <div className="side-panel__notas-label">
            <Icon name="note" size={12} /> Notas
          </div>
          <NotasInput
            id={pedido.id}
            value={pedido.notas ?? ""}
            onSave={onUpdateNotas}
          />
        </div>

        <footer className="side-panel__footer">
          {pedido.es_confirmado ? (
            <button className="btn-unconfirm btn-unconfirm--lg" onClick={() => { onUnconfirm(pedido.id); }}>
              <Icon name="x" size={14} />
              Des-confirmar pedido
            </button>
          ) : (
            <button className="btn-confirm btn-confirm--lg" onClick={() => { onConfirm(pedido.id); }}>
              <Icon name="check" size={14} />
              Confirmar pedido
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}

function Field({ label, children, copyable, onCopy, mono }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="field">
      <div className="field__label">{label}</div>
      <div className={`field__value ${mono ? "field__value--mono" : ""}`}>
        {children}
        {copyable && (
          <button
            className="field__copy"
            onClick={() => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
            title="Copiar"
          >
            <Icon name={copied ? "check" : "copy"} size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Bulk action bar ──────────────────────────────────────
function BulkBar({ count, selectedIds, pedidos, onConfirmAll, onUnconfirmAll, onClear }) {
  if (count === 0) return null;
  const selected = pedidos.filter(p => selectedIds.has(p.id));
  const anyPending = selected.some(p => !p.es_confirmado);
  const anyConfirmed = selected.some(p => p.es_confirmado);
  const total = selected.reduce((s, p) => s + p.precio, 0);
  return (
    <div className="bulk-bar">
      <div className="bulk-bar__count">
        <strong>{count}</strong> seleccionado{count > 1 ? "s" : ""}
        <span className="bulk-bar__sep">·</span>
        <span className="bulk-bar__total">{formatSoles(total)}</span>
      </div>
      <div className="bulk-bar__actions">
        {anyPending && (
          <button className="btn-confirm btn-confirm--lg" onClick={onConfirmAll}>
            <Icon name="check" size={14} />
            Confirmar {selected.filter(p => !p.es_confirmado).length}
          </button>
        )}
        {anyConfirmed && (
          <button className="btn-unconfirm btn-unconfirm--lg" onClick={onUnconfirmAll}>
            <Icon name="x" size={14} />
            Des-confirmar {selected.filter(p => p.es_confirmado).length}
          </button>
        )}
        <button className="btn-ghost" onClick={onClear}>Limpiar selección</button>
      </div>
    </div>
  );
}

// ── Export to window ─────────────────────────────────────
Object.assign(window, {
  PedidoCard, DateGroup, KanbanColumn,
  FiltersBar, Summary, SidePanel, Field, BulkBar,
  ClaveInput, NotasInput,
  formatFecha, formatHora, formatSoles,
  groupByDay, diffDays, startOfDay,
  Icon, StatusChip
});
