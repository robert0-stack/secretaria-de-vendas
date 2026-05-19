import { useState, useEffect } from 'react';
import { api, fmtCurrency, fmtDate, statusBadge, STATUS_LIST } from '../api';

const TABS = ['todos', ...STATUS_LIST];

export default function MinhasVendas() {
  const [vendas, setVendas] = useState([]);
  const [tab, setTab] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState(null);
  const [loadingDet, setLoadingDet] = useState(false);

  const load = (s) => {
    setLoading(true);
    api.getMinhasVendas(s).then(setVendas).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(() => { load(tab); }, [tab]);

  const verDetalhe = async (id) => {
    setLoadingDet(true);
    try { setDetalhe(await api.getVenda(id)); }
    catch(e) { alert(e.message); }
    finally { setLoadingDet(false); }
  };

  return (
    <>
      <header className="topbar">
        <div><h2>Minhas vendas</h2><p>Acompanhe suas vendas e status de conferencia.</p></div>
        <button className="primary-button compact-button" onClick={()=>{}}>Nova venda</button>
      </header>
      <div className="tab-panel">
        {/* STATUS TABS */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)}
              style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,border:'1px solid',
                borderColor: tab===t ? 'var(--accent)' : 'var(--border)',
                background: tab===t ? 'var(--accent-bg)' : 'var(--surface)',
                color: tab===t ? 'var(--accent)' : 'var(--text3)',cursor:'pointer'}}>
              {t === 'todos' ? 'Todas' : t}
            </button>
          ))}
        </div>

        <section className="list-panel my-sales-panel">
          <div className="sales-list">
            {loading ? <div className="empty-state"><div className="spinner"/> Carregando...</div>
            : vendas.length === 0 ? <div className="empty-state">Nenhuma venda encontrada.</div>
            : vendas.map(v => (
              <div key={v.id} className="sale-item">
                <div>
                  <div className="sale-item-title">{v.comprador_nome || '—'}</div>
                  <div className="sale-item-meta">
                    {v.produto||'—'} · {fmtDate(v.data_venda)} · {fmtCurrency(v.valor_total)}
                  </div>
                  <div className="sale-item-meta" style={{marginTop:2}}>
                    Cap: {v.captador_nome||'—'} · Cons: {v.consultor_nome||'—'} · Fec: {v.fechador_nome||'—'}
                  </div>
                </div>
                <div className="sale-item-actions">
                  <span className={`status-pill status-${(v.status||'').replace(/ /g,'-')}`}>{v.status}</span>
                  <button className="mini-button" onClick={()=>verDetalhe(v.id)}>Ver detalhes</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* MODAL DETALHE */}
      {detalhe && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}} onClick={()=>setDetalhe(null)}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:28,width:'100%',maxWidth:700,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            {loadingDet ? <div className="empty-state"><div className="spinner"/> Carregando...</div> : (
              <>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                  <h3 style={{fontSize:17,fontWeight:700}}>Venda — {detalhe.compradores?.[0]?.nome || '—'}</h3>
                  <button onClick={()=>setDetalhe(null)} style={{background:'none',border:'none',color:'var(--text3)',fontSize:22,cursor:'pointer'}}>×</button>
                </div>

                {detalhe.venda?.obs_admin && (
                  <div style={{background:'var(--yellow-bg)',border:'1px solid rgba(245,158,11,.2)',borderRadius:8,padding:'10px 14px',color:'var(--yellow)',fontSize:13,marginBottom:16}}>
                    📋 Obs. do administrador: {detalhe.venda.obs_admin}
                  </div>
                )}

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20,background:'var(--surface2)',borderRadius:10,padding:14}}>
                  {[
                    ['Status', <span className={`status-pill status-${(detalhe.venda?.status||'').replace(/ /g,'-')}`}>{detalhe.venda?.status}</span>],
                    ['Produto', `${detalhe.venda?.produto||'—'} — ${detalhe.venda?.semana||'—'}`],
                    ['Valor total', fmtCurrency(detalhe.venda?.valor_total)],
                    ['Entrada', fmtCurrency(detalhe.venda?.valor_entrada_total)],
                    ['Captador', detalhe.venda?.captador_nome||'—'],
                    ['Consultor', detalhe.venda?.consultor_nome||'—'],
                  ].map(([l,v]) => (
                    <div key={l}>
                      <div style={{fontSize:11,color:'var(--text3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>{l}</div>
                      <div style={{fontSize:13.5,fontWeight:500,marginTop:2}}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Documentos</div>
                  {detalhe.documentos?.length === 0 && <p style={{fontSize:13,color:'var(--text3)'}}>Nenhum documento enviado.</p>}
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {detalhe.documentos?.map(doc => (
                      <a key={doc.id} href={`/uploads/${doc.arquivo_path}`} target="_blank" rel="noopener noreferrer"
                        style={{padding:'5px 12px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,fontSize:12,color:'var(--text2)'}}>
                        📄 {doc.tipo.replace(/_/g,' ')}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
