import { useState, useEffect } from 'react';
import { api, fmtCurrency, fmtDate } from '../api';

export default function Dashboard({ setPage }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const exportar = () => {
    if (!data) return;
    const rows = [
      ['Cliente','Tipo de produto','Semana','Valor vendido','Qtd. contratos','Entrada efetiva','Formas de pagamento','Parcelas entrada','Valor parcela','Data parcelas','SPIFF'],
      ...(data.resumoVendas || []).map(v => {
        const pags = Array.isArray(v.pagamentos) ? v.pagamentos : (typeof v.pagamentos === 'string' ? JSON.parse(v.pagamentos||'[]') : []);
        const formas = pags.filter(p=>p.valor).map(p=>p.forma).join('/');
        const er = typeof v.entrada_restante === 'string' ? JSON.parse(v.entrada_restante||'{}') : (v.entrada_restante||{});
        return [v.comprador_nome||'',v.produto||'',v.semana||'',`R$ ${Number(v.valor_total||0).toFixed(2).replace('.',',')}`,v.quantidade||1,`R$ ${Number(v.valor_entrada_total||0).toFixed(2).replace('.',',')}`,formas,er.parcelas||'',er.valor_parcela?`R$ ${Number(er.valor_parcela).toFixed(2).replace('.',',')}`:'',(er.data_inicio||'').replace(/-/g,'/'),v.spiff||'Sem SPIFF'];
      })
    ];
    const csv = rows.map(r=>r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`relatorio-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  return (
    <>
      <header className="topbar">
        <div>
          <h2 id="pageTitle">Dashboard</h2>
          <p id="pageSubtitle">Visao geral das vendas e conferencias.</p>
        </div>
        <button className="secondary-button" onClick={exportar}>Exportar relatorio</button>
      </header>
      <div className="tab-panel" id="dashboardTab">
        {loading ? <div className="empty-state"><div className="spinner"/> Carregando...</div> : data && (
          <>
            <div className="metrics-row" id="metricsRow">
              <article className="metric-card"><strong>{data.total}</strong><span>Total de vendas</span></article>
              <article className="metric-card"><strong>{data.aprovadas}</strong><span>Aprovadas</span></article>
              <article className="metric-card"><strong>{data.pendentes}</strong><span>Pendentes</span></article>
              <article className="metric-card"><strong>{data.reprovadas}</strong><span>Reprovadas</span></article>
            </div>
            <div className="content-grid dashboard-grid">
              <section className="list-panel">
                <div className="panel-title">Vendas por usuario</div>
                <div className="simple-list" id="salesByUserList">
                  {data.porUsuario?.length === 0 && <div className="empty-state">Nenhuma venda registrada.</div>}
                  {data.porUsuario?.map(u => (
                    <article key={u.nome} className="simple-item">
                      <strong>{u.nome}</strong>
                      {u.total_vendas} venda(s)
                    </article>
                  ))}
                </div>
              </section>
              <section className="list-panel">
                <div className="panel-title">Resumo de vendas</div>
                <div className="audit-list" id="recentAuditList">
                  <div className="dashboard-sales-list">
                    <div className="dashboard-sale-row header">
                      <span>Cliente</span><span>Tipo de produto</span><span>Semana</span>
                      <span>Valor vendido</span><span>Qtd.</span><span>Entrada efetiva</span>
                      <span>Formas de pagamento</span><span>Parcelas entrada</span>
                      <span>Valor parcela entrada</span><span>Data parcelas entrada</span><span>SPIFF</span>
                    </div>
                    {data.resumoVendas?.length === 0 && <div className="empty-state">Nenhuma venda ainda.</div>}
                    {data.resumoVendas?.map(v => {
                      const pags = Array.isArray(v.pagamentos) ? v.pagamentos : (typeof v.pagamentos === 'string' ? JSON.parse(v.pagamentos||'[]') : []);
                      const formas = pags.filter(p=>p.valor).map(p=>p.forma).join(', ') || '—';
                      const er = typeof v.entrada_restante === 'string' ? JSON.parse(v.entrada_restante||'{}') : (v.entrada_restante||{});
                      return (
                        <div key={v.id} className="dashboard-sale-row">
                          <span className="summary-client">{v.comprador_nome||'—'}</span>
                          <span>{v.produto||'—'}</span>
                          <span>{v.semana||'—'}</span>
                          <span className="val-currency">{fmtCurrency(v.valor_total)}</span>
                          <span>{v.quantidade||1}</span>
                          <span className="val-currency">{fmtCurrency(v.valor_entrada_total)}</span>
                          <span>{formas}</span>
                          <span>{er.parcelas||'—'}</span>
                          <span>{er.valor_parcela ? fmtCurrency(er.valor_parcela) : '—'}</span>
                          <span>{er.data_inicio ? new Date(er.data_inicio+'T12:00').toLocaleDateString('pt-BR') : '—'}</span>
                          <span>{v.spiff||'Sem SPIFF'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
