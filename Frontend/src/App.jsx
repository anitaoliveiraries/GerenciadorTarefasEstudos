import { useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const emptyTask = { titulo: "", descricao: "", dataPrazo: "", concluida: false, disciplinaId: "" };
const emptySubject = { nome: "", descricao: "" };

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Erro HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function dateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatDate(value) {
  if (!value) return "Sem prazo";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function App() {
  const [tab, setTab] = useState("inicio");
  const [disciplinas, setDisciplinas] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("todas");
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [sessionForm, setSessionForm] = useState({ tarefaId: "", duracaoMinutos: "" });
  const [editingTask, setEditingTask] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

  async function loadAll() {
    setLoading(true); setError("");
    try {
      const [d, t, s, r] = await Promise.all([
        request("/api/disciplinas"), request("/api/tarefas"),
        request("/api/sessoes-estudo"), request("/api/relatorios/tempo-estudo")
      ]);
      setDisciplinas(d); setTarefas(t); setSessoes(s); setRelatorio(r);
    } catch (e) {
      setError(`Não foi possível carregar os dados. Verifique se a API está em execução e se a URL está correta. Detalhe: ${e.message}`);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  async function run(action, success) {
    setError(""); setNotice("");
    try { await action(); await loadAll(); setNotice(success); }
    catch (e) { setError(e.message || "Ocorreu um erro."); }
  }

  async function saveSubject(e) {
    e.preventDefault();
    const body = { nome: subjectForm.nome.trim(), descricao: subjectForm.descricao.trim() };
    await run(() => request(editingSubject ? `/api/disciplinas/${editingSubject}` : "/api/disciplinas", {
      method: editingSubject ? "PUT" : "POST", body: JSON.stringify(body)
    }), editingSubject ? "Disciplina atualizada." : "Disciplina cadastrada.");
    setSubjectForm(emptySubject); setEditingSubject(null);
  }
  function editSubject(d) {
    setEditingSubject(d.id); setSubjectForm({ nome: d.nome || "", descricao: d.descricao || "" }); setTab("disciplinas");
  }
  async function deleteSubject(id) {
    if (!confirm("Excluir esta disciplina?")) return;
    await run(() => request(`/api/disciplinas/${id}`, { method: "DELETE" }), "Disciplina excluída.");
  }

  async function saveTask(e) {
    e.preventDefault();
    const body = {
      titulo: taskForm.titulo.trim(), descricao: taskForm.descricao.trim(),
      dataPrazo: taskForm.dataPrazo ? new Date(`${taskForm.dataPrazo}T12:00:00`).toISOString() : null,
      concluida: Boolean(taskForm.concluida), disciplinaId: Number(taskForm.disciplinaId)
    };
    await run(() => request(editingTask ? `/api/tarefas/${editingTask}` : "/api/tarefas", {
      method: editingTask ? "PUT" : "POST", body: JSON.stringify(body)
    }), editingTask ? "Tarefa atualizada." : "Tarefa cadastrada.");
    setTaskForm(emptyTask); setEditingTask(null);
  }
  function editTask(t) {
    setEditingTask(t.id);
    setTaskForm({ titulo: t.titulo || "", descricao: t.descricao || "", dataPrazo: dateInput(t.dataPrazo),
      concluida: Boolean(t.concluida), disciplinaId: String(t.disciplinaId ?? t.disciplina?.id ?? "") });
    setTab("tarefas");
  }
  async function deleteTask(id) {
    if (!confirm("Excluir esta tarefa?")) return;
    await run(() => request(`/api/tarefas/${id}`, { method: "DELETE" }), "Tarefa excluída.");
  }
  async function toggleTask(t) {
    await run(() => request(`/api/tarefas/${t.id}/concluida?concluida=${!t.concluida}`, { method: "PATCH" }),
      !t.concluida ? "Tarefa concluída." : "Tarefa reaberta.");
  }
  async function addSession(e) {
    e.preventDefault();
    await run(() => request("/api/sessoes-estudo", { method: "POST", body: JSON.stringify({
      tarefaId: Number(sessionForm.tarefaId), duracaoMinutos: Number(sessionForm.duracaoMinutos)
    }) }), "Sessão de estudo registrada.");
    setSessionForm({ tarefaId: "", duracaoMinutos: "" });
  }
  async function deleteSession(id) {
    if (!confirm("Excluir esta sessão de estudo?")) return;
    await run(() => request(`/api/sessoes-estudo/${id}`, { method: "DELETE" }), "Sessão excluída.");
  }

  const visibleTasks = useMemo(() => tarefas.filter(t =>
    filter === "todas" || (filter === "pendentes" && !t.concluida) || (filter === "concluidas" && t.concluida)
  ), [tarefas, filter]);
  const totalMinutes = relatorio.reduce((sum, r) => sum + (r.totalMinutos || 0), 0);
  const pending = tarefas.filter(t => !t.concluida).length;
  const completed = tarefas.filter(t => t.concluida).length;
  const overdue = tarefas.filter(t => !t.concluida && t.dataPrazo && new Date(t.dataPrazo) < new Date()).length;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">O</div><div><strong>organiza</strong><small>SEUS ESTUDOS</small></div></div>
      <div className="nav-label">MENU</div>
      {[
        ["inicio","▦","Visão geral"],["tarefas","✓","Tarefas"],["disciplinas","▤","Disciplinas"],
        ["sessoes","◷","Sessões de estudo"],["relatorios","▥","Relatórios"]
      ].map(([key, icon, label]) => <button key={key} className={`nav-item ${tab===key?"active":""}`} onClick={()=>setTab(key)}>
        <span>{icon}</span>{label}
      </button>)}
      <div className="sidebar-bottom"><div className="mini-avatar">✦</div><div><b>Seu espaço de estudos</b><small>Organize. Acompanhe. Evolua.</small></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><span className="eyebrow">GERENCIADOR DE TAREFAS E ESTUDOS</span><h1>{({inicio:"Visão geral",tarefas:"Minhas tarefas",disciplinas:"Disciplinas",sessoes:"Sessões de estudo",relatorios:"Relatórios"})[tab]}</h1></div>
        <button className="refresh" onClick={loadAll}>↻ <span>Atualizar</span></button>
      </header>
      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}
      {loading && <div className="loading">Carregando informações...</div>}

      {!loading && tab==="inicio" && <>
        <section className="welcome"><div><span className="welcome-kicker">SEU PROGRESSO, EM UM SÓ LUGAR</span><h2>Um passo de cada vez.<br/><em>Você chega lá.</em></h2><p>Acompanhe suas tarefas e mantenha seus estudos em dia.</p></div><div className="welcome-art">✧</div></section>
        <section className="stats">
          <Stat label="Total de tarefas" value={tarefas.length} icon="▣" tone="purple"/>
          <Stat label="Pendentes" value={pending} icon="◷" tone="orange"/>
          <Stat label="Concluídas" value={completed} icon="✓" tone="green"/>
          <Stat label="Em atraso" value={overdue} icon="!" tone="red"/>
        </section>
        <div className="content-grid">
          <section className="panel"><div className="panel-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h3>Tarefas recentes</h3></div><button className="text-button" onClick={()=>setTab("tarefas")}>Ver todas →</button></div>
            {tarefas.length===0 ? <Empty text="Nenhuma tarefa cadastrada ainda."/> : <div className="task-list">{[...tarefas].slice(-5).reverse().map(t=><TaskRow key={t.id} task={t} onToggle={toggleTask} onEdit={editTask}/>)}</div>}
          </section>
          <section className="panel quick-panel"><span className="eyebrow">RESUMO</span><h3>Seu tempo de estudo</h3><div className="big-number">{Math.floor(totalMinutes/60)}<small>h</small> {totalMinutes%60}<small>min</small></div><p>Tempo registrado em sessões de estudo.</p><button className="primary full" onClick={()=>setTab("sessoes")}>Registrar sessão <span>＋</span></button></section>
        </div>
      </>}

      {!loading && tab==="tarefas" && <div className="content-grid form-layout">
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">ORGANIZAÇÃO</span><h3>{editingTask?"Editar tarefa":"Cadastrar tarefa"}</h3></div></div>
          <form onSubmit={saveTask} className="form">
            <Field label="Título"><input required value={taskForm.titulo} onChange={e=>setTaskForm({...taskForm,titulo:e.target.value})} placeholder="Ex.: Estudar lógica de programação"/></Field>
            <Field label="Descrição"><textarea value={taskForm.descricao} onChange={e=>setTaskForm({...taskForm,descricao:e.target.value})} placeholder="Detalhes da tarefa..." rows="3"/></Field>
            <Field label="Disciplina"><select required value={taskForm.disciplinaId} onChange={e=>setTaskForm({...taskForm,disciplinaId:e.target.value})}><option value="">Selecione uma disciplina</option>{disciplinas.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}</select></Field>
            <Field label="Data de prazo"><input type="date" value={taskForm.dataPrazo} onChange={e=>setTaskForm({...taskForm,dataPrazo:e.target.value})}/></Field>
            {editingTask && <label className="checkline"><input type="checkbox" checked={taskForm.concluida} onChange={e=>setTaskForm({...taskForm,concluida:e.target.checked})}/> Tarefa concluída</label>}
            <div className="form-actions"><button className="primary" type="submit">{editingTask?"Salvar alterações":"Adicionar tarefa"}</button>{editingTask&&<button type="button" className="secondary" onClick={()=>{setEditingTask(null);setTaskForm(emptyTask)}}>Cancelar</button>}</div>
            {disciplinas.length===0&&<p className="hint">Cadastre uma disciplina antes de criar tarefas.</p>}
          </form>
        </section>
        <section className="panel"><div className="panel-heading wrap-heading"><div><span className="eyebrow">LISTA</span><h3>Todas as tarefas</h3></div><select className="filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="todas">Todas</option><option value="pendentes">Pendentes</option><option value="concluidas">Concluídas</option></select></div>
          {visibleTasks.length===0?<Empty text="Nenhuma tarefa encontrada."/>:<div className="task-list">{visibleTasks.map(t=><div className="task-card" key={t.id}><TaskRow task={t} onToggle={toggleTask} onEdit={editTask}/><div className="task-actions"><button onClick={()=>editTask(t)}>Editar</button><button className="danger-text" onClick={()=>deleteTask(t.id)}>Excluir</button></div></div>)}</div>}
        </section>
      </div>}

      {!loading && tab==="disciplinas" && <div className="content-grid form-layout">
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">MATÉRIAS</span><h3>{editingSubject?"Editar disciplina":"Nova disciplina"}</h3></div></div>
          <form className="form" onSubmit={saveSubject}><Field label="Nome"><input required value={subjectForm.nome} onChange={e=>setSubjectForm({...subjectForm,nome:e.target.value})} placeholder="Ex.: Ciência da Computação"/></Field><Field label="Descrição"><textarea rows="4" value={subjectForm.descricao} onChange={e=>setSubjectForm({...subjectForm,descricao:e.target.value})} placeholder="Informações sobre a disciplina..."/></Field><div className="form-actions"><button className="primary">{editingSubject?"Salvar alterações":"Cadastrar disciplina"}</button>{editingSubject&&<button type="button" className="secondary" onClick={()=>{setEditingSubject(null);setSubjectForm(emptySubject)}}>Cancelar</button>}</div></form>
        </section>
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">SEU PLANO DE ESTUDOS</span><h3>Disciplinas cadastradas</h3></div><span className="count-pill">{disciplinas.length}</span></div>
          {disciplinas.length===0?<Empty text="Você ainda não cadastrou disciplinas."/>:<div className="subject-list">{disciplinas.map(d=><div className="subject-card" key={d.id}><div className="subject-icon">▤</div><div className="subject-info"><b>{d.nome}</b><p>{d.descricao||"Sem descrição"}</p><small>{tarefas.filter(t=>t.disciplinaId===d.id).length} tarefa(s)</small></div><div className="inline-actions"><button onClick={()=>editSubject(d)}>Editar</button><button className="danger-text" onClick={()=>deleteSubject(d.id)}>Excluir</button></div></div>)}</div>}
        </section>
      </div>}

      {!loading && tab==="sessoes" && <div className="content-grid form-layout">
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">FOCO E CONSTÂNCIA</span><h3>Registrar sessão</h3></div></div>
          <form className="form" onSubmit={addSession}><Field label="Tarefa estudada"><select required value={sessionForm.tarefaId} onChange={e=>setSessionForm({...sessionForm,tarefaId:e.target.value})}><option value="">Selecione uma tarefa</option>{tarefas.map(t=><option key={t.id} value={t.id}>{t.titulo}</option>)}</select></Field><Field label="Duração (minutos)"><input type="number" min="1" required value={sessionForm.duracaoMinutos} onChange={e=>setSessionForm({...sessionForm,duracaoMinutos:e.target.value})} placeholder="Ex.: 50"/></Field><button className="primary">Salvar sessão</button>{tarefas.length===0&&<p className="hint">Cadastre uma tarefa para registrar uma sessão.</p>}</form>
        </section>
        <section className="panel"><div className="panel-heading"><div><span className="eyebrow">HISTÓRICO</span><h3>Sessões registradas</h3></div><span className="count-pill">{sessoes.length}</span></div>
          {sessoes.length===0?<Empty text="Nenhuma sessão registrada."/>:<div className="session-list">{sessoes.map(s=><div className="session-row" key={s.id}><div className="session-icon">◷</div><div className="session-info"><b>{s.tarefa?.titulo || `Tarefa #${s.tarefaId}`}</b><small>Registro de estudo</small></div><strong>{s.duracaoMinutos} min</strong><button className="danger-text" onClick={()=>deleteSession(s.id)}>Excluir</button></div>)}</div>}
        </section>
      </div>}

      {!loading && tab==="relatorios" && <section className="panel"><div className="panel-heading"><div><span className="eyebrow">DESEMPENHO</span><h3>Tempo de estudo por tarefa</h3></div></div>
        <div className="report-total"><span>Tempo total registrado</span><strong>{Math.floor(totalMinutes/60)}h {totalMinutes%60}min</strong></div>
        {relatorio.length===0?<Empty text="Ainda não há dados para exibir."/>:<div className="report-list">{relatorio.map((r,i)=><div className="report-row" key={`${r.tarefa}-${i}`}><div><b>{r.tarefa}</b><small>{r.disciplina}</small></div><strong>{r.totalMinutos} min</strong><div className="bar"><span style={{width:`${totalMinutes?Math.max(2,r.totalMinutos/totalMinutes*100):0}%`}}/></div></div>)}</div>}
      </section>}
      <footer>Organiza <span>•</span> Gerenciador de tarefas e estudos</footer>
    </main>
  </div>;
}

function Stat({label,value,icon,tone}) { return <div className="stat-card"><div><span>{label}</span><strong>{value}</strong></div><div className={`stat-icon ${tone}`}>{icon}</div></div>; }
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Empty({text}) { return <div className="empty"><span>✧</span><p>{text}</p></div>; }
function TaskRow({task,onToggle,onEdit}) {
  return <div className="task-row"><button className={`task-check ${task.concluida?"checked":""}`} onClick={()=>onToggle(task)} aria-label="Alternar conclusão">{task.concluida?"✓":""}</button><div className="task-main"><b className={task.concluida?"done":""}>{task.titulo}</b><small>{task.disciplina?.nome || "Disciplina"} <span>·</span> Prazo: {formatDate(task.dataPrazo)}</small></div><span className={`status ${task.concluida?"done-status":"pending-status"}`}>{task.concluida?"Concluída":"Pendente"}</span><button className="edit-icon" onClick={()=>onEdit(task)} aria-label="Editar">✎</button></div>;
}