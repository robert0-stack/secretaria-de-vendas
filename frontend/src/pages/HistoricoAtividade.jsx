import { useState, useEffect } from 'react';
import { api, fmtDateTime } from '../api';

export default function HistoricoAtividade() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ data_inicial:'', data_final:'', setor:'todos', user_id:'todos', tipo:'todos' });

  useEffect(() => {
    Promise.all([api.getUsers(), api.getSetores()])
      .then(([u,s])=>{ setUsers(u); setSetores(s); })
      .catch(console.error);
    buscar();
  }, []);

  const buscar = async () => {
    setLoading(true);
    try {
      const params = { ...filtros };
      if (params.setor === 'todos') delete params.setor;
      if (params.user_id === 'todos') delete params.user_id;
      if (params.tipo === 'todos') delete params.tipo;
      setData(await api.getAtividades(params));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const f = (k,v) => setFiltros(p=>({...p,[k]:v}));

  const tipoIcon = (t) => ({ access:'🔐', sales:'📋', conference:'🔍', documents:'📄', users:'👤' }[t]||'📌');
  const tipoLabel = (t) => ({ access:'Acessos', sales:'Vendas', conference:'Conferencias', documents:'Documentos', users:'Usuarios' }[t]||t);

  return (
    <>
      <header className="topbar">
        <div><h2>Historico de Atividade ADM</h2><p>Filtre por periodo, setor e usuario para entender acessos e acoes no sistema.</p></div>
      </header>
      <div className="tab-panel">

        {/* FILTROS */}
        <section className="list-panel activity-panel">
          <div className="admin-panel-head">
            <strong>Relatorio de atividade ADM</strong>
            <span>Filtre por periodo, setor e usuario para entender acessos, preenchimento de vendas, conferencias e documentos.</span>
          </div>
          <div className="activity-filters">
            <label>Data inicial<input type="date" value={filtros.data_inicial} onChange={e=>f('data_inicial',e.target.value)}/></label>
            <label>Data final<input type="date" value={filtros.data_final} onChange={e=>f('data_final',e.target.value)}/></label>
            <label>Setor
              <select value={filtros.setor} onChange={e=>f('setor',e.target.value)}>
                <option value="todos">Todos os setores</option>
                {setores.map(s=><option key={s.nome} value={s.nome}>{s.nome}</option>)}
              </select>
            </label>
            <label>Usuario
              <select value={filtros.user_id} onChange={e=>f('user_id',e.target.value)}>
                <option value="todos">Todos os usuarios</option>
                {users.filter(u=>u.acesso_criado).map(u=><option key={u.id} value={u.id}>{u.nome} — {u.area_atuacao}</option>)}
              </select>
            </label>
            <label>Tipo de atividade
              <select value={filtros.tipo} onChange={e=>f('tipo',e.target.value)}>
                <option value="todos">Todas</option>
                <option value="access">Acessos</option>
                <option value="sales">Vendas</option>
                <option value="conference">Conferencias</option>
                <option value="documents">Documentos</option>
                <option value="users">Usuarios</option>
              </select>
            </label>
          </div>
          <div style={{padding:'0 18px 14px',display:'flex',justifyContent:'flex-end'}}>
            <button className="primary-button compact-button" onClick={buscar} disabled={loading}>
              {loading ? 'Buscando...' : 'Filtrar'}
            </button>
          </div>
        </section>

        {data && (
          <>
            {/* MÉTRICAS */}
            <div className="metrics-row" id="activityMetricsRow">
              <article className="metric-card"><strong>{data.metricas.acessos}</strong><span>Acessos ao sistema</span></article>
              <article className="metric-card"><strong>{data.metricas.vendas}</strong><span>Vendas preenchidas</span></article>
              <article className="metric-card"><strong>{data.metricas.conferencias}</strong><span>Conferencias finalizadas</span></article>
              <article className="metric-card"><strong>{data.metricas.documentos}</strong><span>Eventos de documentos</span></article>
            </div>

            <div className="activity-grid">
              {/* RANKING */}
              <section className="list-panel">
                <div className="panel-title">Ranking de usuarios</div>
                <div className="activity-ranking-list">
                  {data.ranking?.length === 0 && <div className="empty-state">Nenhuma atividade no periodo.</div>}
                  {data.ranking?.map((u,i)=>(
                    <article key={u.nome} className="activity-ranking-item">
                      <div className="activity-rank-number">{i+1}</div>
                      <div>
                        <strong>{u.nome}</strong>
                        <span>{u.area}</span>
                      </div>
                      <div className="activity-chip">Acessos: {u.acessos}</div>
                      <div className="activity-chip">Vendas: {u.vendas}</div>
                      <div className="activity-chip">Conferencias: {u.conferencias}</div>
                      <div className="activity-chip">Docs: {u.docs}</div>
                    </article>
                  ))}
                </div>
              </section>

              {/* LISTA */}
              <section className="list-panel">
                <div className="panel-title">Atividades recentes ({data.atividades?.length||0})</div>
                <div className="activity-list">
                  {data.atividades?.length === 0 && <div className="empty-state">Nenhuma atividade encontrada.</div>}
                  {data.atividades?.map(a=>(
                    <div key={a.id} className="audit-item">
                      <strong>{tipoIcon(a.tipo)} {tipoLabel(a.tipo)} — {a.user_nome||'—'} <span style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>({a.area_atuacao||'—'})</span></strong>
                      {a.descricao}
                      <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{fmtDateTime(a.created_at)}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
