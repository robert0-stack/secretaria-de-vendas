import { useState, useEffect } from 'react';
import { api, fmtDateTime } from '../api';

export default function Auditoria() {
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditoria().then(setAtividades).catch(console.error).finally(()=>setLoading(false));
  }, []);

  const tipoIcon = (t) => ({ access:'🔐', sales:'📋', conference:'🔍', documents:'📄', users:'👤' }[t]||'📌');

  return (
    <>
      <header className="topbar">
        <div><h2>Auditoria</h2><p>Registro completo de todas as acoes realizadas no sistema.</p></div>
      </header>
      <div className="tab-panel">
        <section className="list-panel">
          <div className="panel-title">Log de auditoria — {atividades.length} registros</div>
          <div className="audit-list">
            {loading ? <div className="empty-state"><div className="spinner"/> Carregando...</div>
            : atividades.length === 0 ? <div className="empty-state">Nenhuma atividade registrada.</div>
            : atividades.map(a => (
              <div key={a.id} className="audit-item">
                <strong>{tipoIcon(a.tipo)} {a.user_nome||'Sistema'}</strong>
                {a.descricao}
                {a.venda_id && <div style={{fontSize:11,color:'var(--accent)',marginTop:1}}>Venda: {a.venda_id}</div>}
                <div style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{fmtDateTime(a.created_at)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
