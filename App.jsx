import { useState, useEffect, useRef } from "react";

const COLORS = {
  navy: "#1E2247",
  navyDark: "#14162E",
  navyLight: "#2B2D52",
  gold: "#C9A84C",
  goldLight: "#E2C67A",
  white: "#F8F9FC",
  muted: "#8B90B0",
  success: "#3DAA7D",
  danger: "#D95C5C",
  warning: "#E8A020",
  border: "#2E3260",
};

const RECURRENCES = [
  { value: "unico", label: "Único / Sem recorrência" },
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

const CATEGORIES = [
  { value: "fiscal", label: "Fiscal", color: "#3D7FBF" },
  { value: "contabil", label: "Contábil", color: "#7B5EA7" },
  { value: "dp", label: "DP / RH", color: "#3DAA7D" },
  { value: "comercial", label: "Comercial", color: COLORS.gold },
  { value: "sebrae", label: "SEBRAE", color: "#D95C5C" },
  { value: "cliente", label: "Cliente", color: "#E8A020" },
  { value: "societario", label: "Societário", color: "#5EA7A7" },
  { value: "financeiro", label: "Financeiro", color: "#4CAF8A" },
  { value: "administrativo", label: "Administrativo", color: "#A75E7B" },
  { value: "pessoal", label: "Pessoal", color: "#E07B54" },
  { value: "outros", label: "Outros", color: COLORS.muted },
];

const STATUS = [
  { value: "pendente", label: "Pendente", color: COLORS.warning },
  { value: "em_andamento", label: "Em andamento", color: "#3D7FBF" },
  { value: "concluido", label: "Concluído", color: COLORS.success },
  { value: "cancelado", label: "Cancelado", color: COLORS.muted },
];

const PRIORITY = [
  { value: "alta", label: "Alta", color: COLORS.danger },
  { value: "media", label: "Média", color: COLORS.warning },
  { value: "baixa", label: "Baixa", color: COLORS.success },
];

const STORAGE_KEY = "totus_agenda_v2";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveData(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getCategoryMeta(val) {
  return CATEGORIES.find(c => c.value === val) || CATEGORIES[8];
}
function getStatusMeta(val) {
  return STATUS.find(s => s.value === val) || STATUS[0];
}
function getPriorityMeta(val) {
  return PRIORITY.find(p => p.value === val) || PRIORITY[1];
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function isOverdue(item) {
  if (!item.dueDate || item.status === "concluido" || item.status === "cancelado") return false;
  return item.dueDate < today();
}

function isDueToday(item) {
  if (!item.dueDate || item.status === "concluido" || item.status === "cancelado") return false;
  return item.dueDate === today();
}

function isDueThisWeek(item) {
  if (!item.dueDate || item.status === "concluido" || item.status === "cancelado") return false;
  const d = new Date(item.dueDate + "T12:00:00");
  const t = new Date();
  const end = new Date(t);
  end.setDate(t.getDate() + 7);
  return d >= t && d <= end;
}

const emptyForm = {
  title: "",
  description: "",
  category: "fiscal",
  priority: "media",
  status: "pendente",
  recurrence: "unico",
  dueDate: "",
};

export default function GestorAgenda() {
  const [items, setItems] = useState(loadData);
  const [view, setView] = useState("dashboard"); // dashboard | lista | novo
  const [filter, setFilter] = useState({ status: "all", category: "all", priority: "all", search: "" });
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  useEffect(() => { saveData(items); }, [items]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editId) {
      setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form } : i));
      showToast("Obrigação atualizada!");
    } else {
      const newItem = { ...form, id: Date.now().toString(), createdAt: today() };
      setItems(prev => [newItem, ...prev]);
      showToast("Obrigação adicionada!");
    }
    setForm(emptyForm);
    setEditId(null);
    setView("lista");
  }

  function handleEdit(item) {
    setForm({
      title: item.title,
      description: item.description || "",
      category: item.category,
      priority: item.priority,
      status: item.status,
      recurrence: item.recurrence,
      dueDate: item.dueDate || "",
    });
    setEditId(item.id);
    setDetailItem(null);
    setView("novo");
  }

  function handleDelete(id) {
    setItems(prev => prev.filter(i => i.id !== id));
    setConfirmDelete(null);
    setDetailItem(null);
    showToast("Removida.", "info");
  }

  function handleStatusChange(id, status) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    if (detailItem?.id === id) setDetailItem(prev => ({ ...prev, status }));
  }

  const filtered = items.filter(i => {
    if (filter.status !== "all" && i.status !== filter.status) return false;
    if (filter.category !== "all" && i.category !== filter.category) return false;
    if (filter.priority !== "all" && i.priority !== filter.priority) return false;
    if (filter.search && !i.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const pendentes = items.filter(i => i.status === "pendente" || i.status === "em_andamento");
  const vencidas = items.filter(isOverdue);
  const hoje = items.filter(isDueToday);
  const semana = items.filter(isDueThisWeek);
  const concluidas = items.filter(i => i.status === "concluido");
  const total = items.length;
  const pct = total > 0 ? Math.round((concluidas.length / total) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.navyDark, fontFamily: "'Georgia', 'Times New Roman', serif", color: COLORS.white }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 4px; }
        input, textarea, select { font-family: 'Source Sans 3', sans-serif; }
        button { font-family: 'Source Sans 3', sans-serif; cursor: pointer; }
        .hover-gold:hover { color: ${COLORS.gold} !important; }
        .card-hover:hover { border-color: ${COLORS.gold} !important; background: #1A1D40 !important; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .animate-in { animation: fadeIn 0.3s ease; }
        .slide-in { animation: slideIn 0.25s ease; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: COLORS.navyLight, borderBottom: `1px solid ${COLORS.border}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, background: COLORS.gold, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: COLORS.navyDark, fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16 }}>T</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, letterSpacing: 1, color: COLORS.white }}>TOTUS</div>
              <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 2, textTransform: "uppercase" }}>Gestor de Obrigações</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "dashboard", label: "Painel" },
              { key: "lista", label: "Obrigações" },
              { key: "novo", label: "+ Nova" },
            ].map(tab => (
              <button key={tab.key} onClick={() => { setView(tab.key); if (tab.key !== "novo") { setForm(emptyForm); setEditId(null); } }}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
                  background: view === tab.key ? COLORS.gold : "transparent",
                  color: view === tab.key ? COLORS.navyDark : COLORS.muted,
                  transition: "all 0.2s" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, background: toast.type === "success" ? COLORS.success : toast.type === "info" ? COLORS.navyLight : COLORS.danger,
          color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontFamily: "'Source Sans 3', sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "fadeIn 0.3s ease" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div className="animate-in">
            {/* Alertas */}
            {(vencidas.length > 0 || hoje.length > 0) && (
              <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {vencidas.length > 0 && (
                  <div style={{ background: "#2A1414", border: `1px solid ${COLORS.danger}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.danger, fontFamily: "'Source Sans 3', sans-serif" }}>{vencidas.length} obrigação(ões) vencida(s)!</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: "'Source Sans 3', sans-serif" }}>{vencidas.map(v => v.title).join(" · ")}</div>
                    </div>
                    <button onClick={() => { setFilter({ status: "all", category: "all", priority: "all", search: "" }); setView("lista"); }} style={{ marginLeft: "auto", fontSize: 11, color: COLORS.gold, background: "none", border: "none", textDecoration: "underline" }}>Ver tudo</button>
                  </div>
                )}
                {hoje.length > 0 && (
                  <div style={{ background: "#281E0A", border: `1px solid ${COLORS.warning}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>📅</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.warning, fontFamily: "'Source Sans 3', sans-serif" }}>{hoje.length} obrigação(ões) para hoje</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: "'Source Sans 3', sans-serif" }}>{hoje.map(v => v.title).join(" · ")}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cards de métricas */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total", value: total, color: COLORS.gold, icon: "📋" },
                { label: "Pendentes", value: pendentes.length, color: COLORS.warning, icon: "⏳" },
                { label: "Vencidas", value: vencidas.length, color: COLORS.danger, icon: "🔴" },
                { label: "Concluídas", value: concluidas.length, color: COLORS.success, icon: "✅" },
              ].map(m => (
                <div key={m.label} style={{ background: COLORS.navyLight, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: m.color, fontFamily: "'Playfair Display', serif" }}>{m.value}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Source Sans 3', sans-serif" }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progresso geral */}
            <div style={{ background: COLORS.navyLight, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontFamily: "'Source Sans 3', sans-serif", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>Progresso Geral</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: COLORS.gold }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.goldLight})`, borderRadius: 4, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: "'Source Sans 3', sans-serif", marginTop: 6 }}>{concluidas.length} de {total} obrigações concluídas</div>
            </div>

            {/* Por categoria */}
            <div style={{ background: COLORS.navyLight, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, fontFamily: "'Source Sans 3', sans-serif" }}>Por Setor</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {CATEGORIES.map(cat => {
                  const total_cat = items.filter(i => i.category === cat.value).length;
                  const conc_cat = items.filter(i => i.category === cat.value && i.status === "concluido").length;
                  const pend_cat = items.filter(i => i.category === cat.value && (i.status === "pendente" || i.status === "em_andamento")).length;
                  if (total_cat === 0) return null;
                  return (
                    <div key={cat.value} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                      <div style={{ width: 80, fontSize: 12, color: COLORS.white, fontFamily: "'Source Sans 3', sans-serif" }}>{cat.label}</div>
                      <div style={{ flex: 1, height: 5, background: COLORS.border, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: total_cat > 0 ? `${(conc_cat / total_cat) * 100}%` : "0%", background: cat.color, borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: "'Source Sans 3', sans-serif", width: 50, textAlign: "right" }}>
                        {pend_cat > 0 && <span style={{ color: COLORS.warning }}>{pend_cat} pend. </span>}
                        <span>{total_cat} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Próximas da semana */}
            {semana.length > 0 && (
              <div style={{ background: COLORS.navyLight, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, fontFamily: "'Source Sans 3', sans-serif" }}>Próximos 7 dias ({semana.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {semana.slice(0, 5).map(item => (
                    <div key={item.id} onClick={() => { setDetailItem(item); setView("lista"); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, background: COLORS.navyDark, cursor: "pointer" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: getCategoryMeta(item.category).color, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 13, fontFamily: "'Source Sans 3', sans-serif" }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: isDueToday(item) ? COLORS.warning : COLORS.muted, fontFamily: "'Source Sans 3', sans-serif" }}>
                        {isDueToday(item) ? "Hoje" : item.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LISTA */}
        {view === "lista" && (
          <div className="animate-in">
            {/* Filtros */}
            <div style={{ background: COLORS.navyLight, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
              <input value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                placeholder="Buscar obrigação..."
                style={{ flex: 1, minWidth: 140, background: COLORS.navyDark, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "7px 12px", color: COLORS.white, fontSize: 13, outline: "none" }} />
              {[
                { key: "status", options: [{ value: "all", label: "Todos status" }, ...STATUS.map(s => ({ value: s.value, label: s.label }))] },
                { key: "category", options: [{ value: "all", label: "Todos setores" }, ...CATEGORIES.map(c => ({ value: c.value, label: c.label }))] },
                { key: "priority", options: [{ value: "all", label: "Toda prioridade" }, ...PRIORITY.map(p => ({ value: p.value, label: p.label }))] },
              ].map(f => (
                <select key={f.key} value={filter[f.key]} onChange={e => setFilter(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ background: COLORS.navyDark, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "7px 10px", color: COLORS.white, fontSize: 12, outline: "none" }}>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ))}
            </div>

            <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: "'Source Sans 3', sans-serif", marginBottom: 10 }}>
              {filtered.length} registro(s) encontrado(s)
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 14, fontFamily: "'Source Sans 3', sans-serif" }}>Nenhuma obrigação encontrada</div>
                <button onClick={() => setView("novo")} style={{ marginTop: 16, padding: "8px 20px", background: COLORS.gold, color: COLORS.navyDark, border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                  + Adicionar primeira obrigação
                </button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map(item => {
                const cat = getCategoryMeta(item.category);
                const st = getStatusMeta(item.status);
                const pr = getPriorityMeta(item.priority);
                const overdue = isOverdue(item);
                const due_today = isDueToday(item);
                return (
                  <div key={item.id} className="card-hover" onClick={() => setDetailItem(item)}
                    style={{ background: COLORS.navyLight, border: `1px solid ${overdue ? COLORS.danger : COLORS.border}`, borderRadius: 10, padding: "12px 14px",
                      cursor: "pointer", transition: "all 0.2s", borderLeft: `3px solid ${cat.color}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600, color: COLORS.white }}>{item.title}</span>
                          {overdue && <span style={{ fontSize: 9, background: COLORS.danger, color: "#fff", padding: "1px 6px", borderRadius: 10, textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif" }}>VENCIDA</span>}
                          {due_today && !overdue && <span style={{ fontSize: 9, background: COLORS.warning, color: "#fff", padding: "1px 6px", borderRadius: 10, textTransform: "uppercase", fontFamily: "'Source Sans 3', sans-serif" }}>HOJE</span>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${cat.color}22`, color: cat.color, fontFamily: "'Source Sans 3', sans-serif" }}>{cat.label}</span>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${pr.color}22`, color: pr.color, fontFamily: "'Source Sans 3', sans-serif" }}>{pr.label}</span>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${st.color}22`, color: st.color, fontFamily: "'Source Sans 3', sans-serif" }}>{st.label}</span>
                          {item.recurrence !== "unico" && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${COLORS.gold}22`, color: COLORS.gold, fontFamily: "'Source Sans 3', sans-serif" }}>🔄 {RECURRENCES.find(r => r.value === item.recurrence)?.label}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {item.dueDate && <div style={{ fontSize: 11, color: overdue ? COLORS.danger : due_today ? COLORS.warning : COLORS.muted, fontFamily: "'Source Sans 3', sans-serif" }}>{item.dueDate}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FORM NOVO / EDITAR */}
        {view === "novo" && (
          <div className="animate-in">
            <div style={{ marginBottom: 20, fontFamily: "'Playfair Display', serif", fontSize: 20, color: COLORS.gold }}>
              {editId ? "Editar Obrigação" : "Nova Obrigação"}
            </div>
            <div style={{ background: COLORS.navyLight, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Título *", key: "title", type: "text", placeholder: "Ex: Apuração IRPJ trimestral..." },
                { label: "Descrição", key: "description", type: "textarea", placeholder: "Detalhes, referências, observações..." },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "'Source Sans 3', sans-serif" }}>{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} rows={3}
                      style={{ width: "100%", background: COLORS.navyDark, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", color: COLORS.white, fontSize: 13, outline: "none", resize: "vertical" }} />
                  ) : (
                    <input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} type={f.type}
                      style={{ width: "100%", background: COLORS.navyDark, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", color: COLORS.white, fontSize: 13, outline: "none" }} />
                  )}
                </div>
              ))}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Setor", key: "category", options: CATEGORIES },
                  { label: "Prioridade", key: "priority", options: PRIORITY },
                  { label: "Status", key: "status", options: STATUS },
                  { label: "Recorrência", key: "recurrence", options: RECURRENCES.map(r => ({ value: r.value, label: r.label })) },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "'Source Sans 3', sans-serif" }}>{f.label}</label>
                    <select value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{ width: "100%", background: COLORS.navyDark, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", color: COLORS.white, fontSize: 13, outline: "none" }}>
                      {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, fontFamily: "'Source Sans 3', sans-serif" }}>Data de Vencimento</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  style={{ width: "100%", background: COLORS.navyDark, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", color: COLORS.white, fontSize: 13, outline: "none", colorScheme: "dark" }} />
              </div>

              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button onClick={handleSave} disabled={!form.title.trim()}
                  style={{ flex: 1, padding: "12px", background: form.title.trim() ? COLORS.gold : COLORS.border, color: form.title.trim() ? COLORS.navyDark : COLORS.muted,
                    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: 0.5, transition: "all 0.2s" }}>
                  {editId ? "Salvar Alterações" : "Adicionar Obrigação"}
                </button>
                <button onClick={() => { setForm(emptyForm); setEditId(null); setView("lista"); }}
                  style={{ padding: "12px 20px", background: "transparent", color: COLORS.muted, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14 }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETALHE */}
      {detailItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setDetailItem(null); }}>
          <div className="slide-in" style={{ background: COLORS.navyLight, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, width: "100%", maxWidth: 600, maxHeight: "85vh", overflowY: "auto", border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: COLORS.white, marginBottom: 6 }}>{detailItem.title}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(() => {
                    const cat = getCategoryMeta(detailItem.category);
                    const st = getStatusMeta(detailItem.status);
                    const pr = getPriorityMeta(detailItem.priority);
                    return (
                      <>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: `${cat.color}33`, color: cat.color }}>{cat.label}</span>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: `${pr.color}33`, color: pr.color }}>{pr.label}</span>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: `${st.color}33`, color: st.color }}>{st.label}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <button onClick={() => setDetailItem(null)} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            {detailItem.description && (
              <div style={{ background: COLORS.navyDark, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: COLORS.muted, fontFamily: "'Source Sans 3', sans-serif", lineHeight: 1.6 }}>
                {detailItem.description}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Vencimento", value: detailItem.dueDate || "—" },
                { label: "Recorrência", value: RECURRENCES.find(r => r.value === detailItem.recurrence)?.label || "—" },
                { label: "Criado em", value: detailItem.createdAt || "—" },
              ].map(info => (
                <div key={info.label} style={{ background: COLORS.navyDark, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Source Sans 3', sans-serif" }}>{info.label}</div>
                  <div style={{ fontSize: 13, color: COLORS.white, fontFamily: "'Source Sans 3', sans-serif" }}>{info.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'Source Sans 3', sans-serif" }}>Alterar Status</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {STATUS.map(s => (
                  <button key={s.value} onClick={() => handleStatusChange(detailItem.id, s.value)}
                    style={{ padding: "7px 14px", borderRadius: 20, border: `1px solid ${s.color}`, fontSize: 12, fontFamily: "'Source Sans 3', sans-serif",
                      background: detailItem.status === s.value ? s.color : "transparent", color: detailItem.status === s.value ? COLORS.navyDark : s.color, transition: "all 0.2s" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleEdit(detailItem)}
                style={{ flex: 1, padding: "11px", background: COLORS.gold, color: COLORS.navyDark, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                ✏️ Editar
              </button>
              {confirmDelete === detailItem.id ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleDelete(detailItem.id)} style={{ padding: "11px 16px", background: COLORS.danger, color: "#fff", border: "none", borderRadius: 8, fontSize: 13 }}>Confirmar</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ padding: "11px 16px", background: "transparent", color: COLORS.muted, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13 }}>Não</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(detailItem.id)} style={{ padding: "11px 16px", background: "transparent", color: COLORS.danger, border: `1px solid ${COLORS.danger}`, borderRadius: 8, fontSize: 13 }}>🗑</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
