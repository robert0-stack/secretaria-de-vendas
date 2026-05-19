import { useState, useEffect } from 'react';
import { api, fmtCurrency, fmtDate, statusBadge, STATUS_LIST } from '../api';

const STATUS_OPTS = ['todos', ...STATUS_LIST];

export default function DocumentosVendas() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabStatus, setTabStatus] = useState('todos');
  const [busca, setBusca] = useState('');
  const [conferindo, setConferindo] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [loadingDet, setLoadingDet] = useState(false);
  const [confForm, setConfForm] = useState({
    check_bloqueio:'OK', check_atendimento:'OK', check_doc_cliente:'OK',
    check_comprovante:'OK', check_negociacao:'OK', check_doc_segundo:'Nao se aplica',
    check_dados_cliente:'OK', status:'', obs_admin:''
  });
  const [timerStart, setTimerStart] = useState(null);
  const [timerLabel, setTimerLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [msgCopiada, setMsgCopiada] = useState(false);

  const load = () => {
    setLoading(true);
    api.getVendas(tabStatus === 'todos' ? '' : tabStatus).then(setVendas).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, [tabStatus]);

  // Timer
  useEffect(() => {
    if (!timerStart) return;
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - timerStart) / 1000);
      const m = Math.floor(s/60); const sec = s%60;
      setTimerLabel(`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [timerStart]);

  const iniciarConferencia = () => setTimerStart(Date.now());

  const abrirConferencia = async (v) => {
    setConferindo(v);
    setLoadingDet(true);
    setTimerStart(null); setTimerLabel('');
    try {
      const d = await api.getVenda(v.id);
      setDetalhe(d);
      const c = d.conferencia || {};
      setConfForm({
        check_bloqueio: c.check_bloqueio || 'OK',
        check_atendimento: c.check_atendimento || 'OK',
        check_doc_cliente: c.check_doc_cliente || 'OK',
        check_comprovante: c.check_comprovante || 'OK',
        check_negociacao: c.check_negociacao || 'OK',
        check_doc_segundo: c.check_doc_segundo || 'Nao se aplica',
        check_dados_cliente: c.check_dados_cliente || 'OK',
        status: v.status || '',
        obs_admin: c.obs_admin || '',
      });
    } catch(e) { alert(e.message); }
    finally { setLoadingDet(false); }
  };

  const salvar = async () => {
    setSaving(true);
    try {
      await api.salvarConferencia({
        venda_id: conferindo.id,
        ...confForm,
        inicio: timerStart ? new Date(timerStart).toISOString() : null,
        termino: timerStart ? new Date().toISOString() : null,
      });
      load();
      alert('Conferencia salva!');
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deletar = async (id) => {
    if (!window.confirm('Excluir esta venda?')) return;
    await api.deleteVenda(id);
    load();
  };

  const gerarWhatsApp = () => {
    if (!detalhe) return '';
    const v = detalhe.venda;
    const c = detalhe.compradores?.[0];
    const pags = Array.isArray(v.pagamentos) ? v.pagamentos : JSON.parse(v.pagamentos||'[]');
    const formas = pags.filter(p=>p.valor).map(p=>`  • R$ ${Number(p.valor).toFixed(2).replace('.',',')} — ${p.forma}`).join('\n');
    return `*SECRETARIA DE VENDAS — VENDA*\n\n` +
      `📋 *Status:* ${confForm.status || v.status}\n` +
      `📅 *Data:* ${fmtDate(v.data_venda)}\n\n` +
      `👤 *Comprador:* ${c?.nome||'—'}\n   CPF: ${c?.cpf||'—'}\n   Tel: ${c?.telefone1||'—'}\n\n` +
      `🏷 *Produto:* ${v.produto||'—'} — ${v.semana||'—'}\n` +
      `💰 *Valor total:* R$ ${Number(v.valor_total||0).toFixed(2).replace('.',',')}\n` +
      `💵 *Entrada:* R$ ${Number(v.valor_entrada_total||0).toFixed(2).replace('.',',')}\n` +
      (formas ? `\n*Pagamentos:*\n${formas}\n` : '') +
      `\n👨‍💼 *Captador:* ${v.captador_nome||'—'}\n` +
      `👨‍💼 *Consultor:* ${v.consultor_nome||'—'}\n` +
      (confForm.obs_admin ? `\n📝 ${confForm.obs_admin}` : '');
  };

  const copiar = () => {
    navigator.clipboard.writeText(gerarWhatsApp()).then(()=>{ setMsgCopiada(true); setTimeout(()=>setMsgCopiada(false),3000); });
  };

  const filtered = vendas.filter(v =>
    !busca || (v.comprador_nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (v.captador_nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (v.consultor_nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (v.produto||'').toLowerCase().includes(busca.toLowerCase()) ||
    v.id.toString().includes(busca)
  );

  const CHECK_OPTS = ['OK','Pendente'];
  const CHECK_SECOND_OPTS = ['Nao se aplica','OK','Pendente'];
  const cf = (k,v) => setConfForm(p=>({...p,[k]:v}));

  return (
    <>
      <header className="topbar">
        <div><h2>Documentos de vendas</h2><p>Confira documentos, altere status e gerencie todas as vendas.</p></div>
      </header>
      <div className="tab-panel">
        {/* STATUS TABS */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
          {STATUS_OPTS.map(t => (
            <button key={t} onClick={()=>setTabStatus(t)}
              style={{padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:600,border:'1px solid',
                borderColor:tabStatus===t?'var(--accent)':'var(--border)',
                background:tabStatus===t?'var(--accent-bg)':'var(--surface)',
                color:tabStatus===t?'var(--accent)':'var(--text3)',cursor:'pointer'}}>
              {t==='todos'?'Todas':t}
            </button>
          ))}
        </div>

        <section className="list-panel">
          <div className="panel-toolbar documents-toolbar">
            <input placeholder="Buscar por comprador, captador, produto..." value={busca} onChange={e=>setBusca(e.target.value)}/>
          </div>
          {loading ? <div className="empty-state"><div className="spinner"/> Carregando...</div>
          : filtered.length === 0 ? <div className="empty-state">Nenhuma venda encontrada.</div>
          : (
            <div className="documents-table">
              <div className="document-row header">
                <span>Envio</span><span>Cliente</span><span>E-mail</span><span>Telefone</span>
                <span>Captador</span><span>Consultor</span><span>Fechador</span>
                <span>Valor</span><span>Produto</span><span>Status</span><span>Acoes</span>
              </div>
              {filtered.map(v => (
                <div key={v.id} className="document-row">
                  <span><small>{fmtDate(v.created_at)}</small></span>
                  <strong>{v.comprador_nome||'—'}<small>{v.comprador_email||''}</small></strong>
                  <span style={{fontSize:12,color:'var(--text3)'}}>{v.comprador_email||'—'}</span>
                  <span style={{fontSize:12}}>{v.comprador_tel||'—'}</span>
                  <span style={{fontSize:12}}>{v.captador_nome||'—'}</span>
                  <span style={{fontSize:12}}>{v.consultor_nome||'—'}</span>
                  <span style={{fontSize:12}}>{v.fechador_nome||'—'}</span>
                  <span style={{color:'var(--green)',fontWeight:600,fontSize:12}}>{fmtCurrency(v.valor_total)}</span>
                  <span style={{fontSize:12}}>{v.produto||'—'}</span>
                  <span><span className={`status-pill status-${(v.status||'').replace(/ /g,'-')}`} style={{fontSize:10}}>{v.status}</span></span>
                  <div className="row-actions">
                    <button className="mini-button" onClick={()=>abrirConferencia(v)}>Visualizar docs</button>
                    <button className="mini-button danger" onClick={()=>deletar(v.id)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL CONFERÊNCIA */}
      {conferindo && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}} onClick={()=>setConferindo(null)}>
          <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,width:'100%',maxWidth:900,maxHeight:'92vh',overflowY:'auto',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 24px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
              <h3 style={{fontSize:17,fontWeight:700}}>Conferencia — {conferindo.comprador_nome||'Venda'}</h3>
              <button onClick={()=>setConferindo(null)} style={{background:'none',border:'none',color:'var(--text3)',fontSize:22,cursor:'pointer'}}>×</button>
            </div>

            {loadingDet ? <div className="empty-state"><div className="spinner"/> Carregando...</div> : detalhe && (
              <div style={{display:'grid',gridTemplateColumns:'300px 1fr',flex:1,overflow:'hidden'}}>

                {/* COLUNA ESQUERDA */}
                <div style={{borderRight:'1px solid var(--border)',overflowY:'auto',padding:18}}>
                  <div className="summary-box">
                    <strong>Cliente:</strong> {detalhe.compradores?.[0]?.nome||'—'}<br/>
                    <strong>CPF:</strong> {detalhe.compradores?.[0]?.cpf||'—'}<br/>
                    <strong>Tel:</strong> {detalhe.compradores?.[0]?.telefone1||'—'}<br/>
                    {detalhe.compradores?.[1] && <><strong>Comprador 2:</strong> {detalhe.compradores[1].nome}<br/></>}
                    <br/>
                    <strong>Produto:</strong> {detalhe.venda?.produto||'—'}<br/>
                    <strong>Semana:</strong> {detalhe.venda?.semana||'—'}<br/>
                    <strong>Valor:</strong> {fmtCurrency(detalhe.venda?.valor_total)}<br/>
                    <strong>Entrada:</strong> {fmtCurrency(detalhe.venda?.valor_entrada_total)}<br/>
                    <br/>
                    <strong>Captador:</strong> {detalhe.venda?.captador_nome||'—'}<br/>
                    <strong>Consultor:</strong> {detalhe.venda?.consultor_nome||'—'}<br/>
                    <strong>Fechador:</strong> {detalhe.venda?.fechador_nome||'—'}<br/>
                  </div>

                  {/* DOCS */}
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Documentos</div>
                    {detalhe.documentos?.length === 0 && <p style={{fontSize:12,color:'var(--text3)'}}>Nenhum doc enviado.</p>}
                    {detalhe.documentos?.map(doc => (
                      <a key={doc.id} href={`/uploads/${doc.arquivo_path}`} target="_blank" rel="noopener noreferrer"
                        style={{display:'block',padding:'5px 0',fontSize:12,color:'var(--accent)'}}>
                        📄 {doc.tipo.replace(/_/g,' ')}
                      </a>
                    ))}
                  </div>
                </div>

                {/* COLUNA DIREITA */}
                <div style={{overflowY:'auto',padding:20}}>
                  {/* TIMER */}
                  <div className="conference-timer-box">
                    <div>
                      <strong>Cronometro de conferencia</strong>
                      <span id="conferenceTimerLabel" style={{fontSize:12,color:'var(--text3)'}}>{timerLabel || (timerStart ? '' : 'Nao iniciado')}</span>
                    </div>
                    <div className="timer-actions">
                      <button className="mini-button" onClick={iniciarConferencia} disabled={!!timerStart}>Iniciar conferencia</button>
                      {timerStart && <button className="mini-button secondary-button" onClick={()=>{setTimerStart(null);setTimerLabel('');}}>Resetar</button>}
                    </div>
                    <textarea id="whatsappMessage" rows={4} value={gerarWhatsApp()} readOnly/>
                    <button className="mini-button" onClick={copiar}>{msgCopiada ? '✓ Copiado!' : 'Copiar mensagem WhatsApp'}</button>
                  </div>

                  {/* CHECKLIST */}
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>Checklist de documentos</div>
                  <div className="checklist-grid">
                    {[
                      ['check_bloqueio','Ficha de Bloqueio',CHECK_OPTS],
                      ['check_atendimento','Ficha de Atendimento',CHECK_OPTS],
                      ['check_doc_cliente','Documento do Cliente',CHECK_OPTS],
                      ['check_comprovante','Comprovante',CHECK_OPTS],
                      ['check_negociacao','Negociacao',CHECK_OPTS],
                      ['check_dados_cliente','Dados do Cliente',CHECK_OPTS],
                      ['check_doc_segundo','Doc. Segundo Comprador',CHECK_SECOND_OPTS],
                    ].map(([key,label,opts]) => (
                      <label key={key}>{label}
                        <select value={confForm[key]} onChange={e=>cf(key,e.target.value)}>
                          {opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>

                  {/* STATUS / OBS */}
                  <form id="conferenceForm">
                    <label>Alterar status da venda
                      <select value={confForm.status} onChange={e=>cf('status',e.target.value)}>
                        <option value="">Manter status atual</option>
                        {['Aguardando conferencia','Em conferencia','Pendente de ajuste','Aprovado','Reprovado','Finalizado'].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </label>
                    <label>Observacao para o vendedor
                      <textarea value={confForm.obs_admin} onChange={e=>cf('obs_admin',e.target.value)} rows={3} placeholder="Detalhe o que falta ou o que foi aprovado..."/>
                    </label>
                  </form>

                  <div className="form-actions">
                    <button className="secondary-button compact-button" onClick={()=>setConferindo(null)}>Fechar</button>
                    <button className="primary-button compact-button" onClick={salvar} disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar conferencia'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
