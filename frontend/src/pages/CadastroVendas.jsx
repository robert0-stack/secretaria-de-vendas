import { useState, useEffect } from 'react';
import { api, PRODUTOS, SEMANAS, FORMAS_PAG } from '../api';
import { useAuth } from '../App';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const ESTADOS_CIVIS = ['Solteiro(a)','Casado(a)','Divorciado(a)','Viuvo(a)','Uniao estavel'];
const SPIFF_OPTS = ['12x','24x','36x','10% DE ENTRADA','5% DE ENTRADA'];

function gerarFicha(form, cap, cons, fec) {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Ficha de Bloqueio</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px;color:#000}h1{text-align:center;font-size:16px;margin-bottom:4px}h2{font-size:12px;background:#222;color:#fff;padding:4px 10px;margin:14px 0 8px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px}.field label{font-weight:bold;font-size:10px;color:#555;display:block}.field span{border-bottom:1px solid #999;display:block;min-height:18px;padding:2px 0}
  .full{grid-column:span 2}table{width:100%;border-collapse:collapse}td{border:1px solid #999;padding:6px;font-size:11px}
  @media print{body{padding:8px}}</style></head><body>
  <h1>Secretaria de Vendas — Ficha de Bloqueio</h1>
  <p style="text-align:center;font-size:11px;color:#666">Data: ${form.data_venda || new Date().toLocaleDateString('pt-BR')}</p>
  <h2>EQUIPE</h2>
  <div class="grid">
    <div class="field"><label>Captador</label><span>${cap}</span></div>
    <div class="field"><label>Consultor</label><span>${cons}</span></div>
    <div class="field full"><label>Fechador</label><span>${fec}</span></div>
  </div>
  <h2>COMPRADOR 1</h2>
  <div class="grid">
    <div class="field full"><label>Nome</label><span>${form.c1_nome||''}</span></div>
    <div class="field"><label>CPF</label><span>${form.c1_cpf||''}</span></div>
    <div class="field"><label>Data nasc.</label><span>${form.c1_nasc||''}</span></div>
    <div class="field"><label>RG</label><span>${form.c1_rg||''}</span></div>
    <div class="field"><label>Orgao / UF</label><span>${form.c1_orgao||''} ${form.c1_uf||''}</span></div>
    <div class="field"><label>Estado civil</label><span>${form.c1_estado_civil||''}</span></div>
    <div class="field"><label>Profissao</label><span>${form.c1_profissao||''}</span></div>
    <div class="field"><label>Telefone 1</label><span>${form.c1_tel1||''}</span></div>
    <div class="field"><label>Telefone 2</label><span>${form.c1_tel2||''}</span></div>
    <div class="field full"><label>E-mail</label><span>${form.c1_email||''}</span></div>
  </div>
  ${form.tem_segundo&&form.c2_nome?`<h2>COMPRADOR 2</h2><div class="grid">
    <div class="field full"><label>Nome</label><span>${form.c2_nome}</span></div>
    <div class="field"><label>CPF</label><span>${form.c2_cpf||''}</span></div>
    <div class="field"><label>Estado civil</label><span>${form.c2_estado_civil||''}</span></div>
    <div class="field"><label>RG</label><span>${form.c2_rg||''}</span></div>
    <div class="field"><label>Profissao</label><span>${form.c2_profissao||''}</span></div>
  </div>`:''}
  <h2>ENDERECO</h2>
  <div class="grid">
    <div class="field"><label>CEP</label><span>${form.cep||''}</span></div>
    <div class="field"><label>Numero</label><span>${form.numero||''}</span></div>
    <div class="field full"><label>Logradouro</label><span>${form.logradouro||''}</span></div>
    <div class="field"><label>Bairro</label><span>${form.bairro||''}</span></div>
    <div class="field"><label>Cidade/UF</label><span>${form.cidade_uf||''}</span></div>
    <div class="field full"><label>Complemento</label><span>${form.complemento||''}</span></div>
  </div>
  <h2>PRODUTO</h2>
  <div class="grid">
    <div class="field"><label>Produto</label><span>${form.produto||''}</span></div>
    <div class="field"><label>Semana</label><span>${form.semana||''}</span></div>
    <div class="field"><label>Valor unitario</label><span>R$ ${form.valor_unitario||''}</span></div>
    <div class="field"><label>Quantidade</label><span>${form.quantidade||1}</span></div>
    <div class="field"><label>Valor total</label><span>R$ ${form.valor_total||''}</span></div>
    <div class="field"><label>Entrada efetiva</label><span>R$ ${form.valor_entrada_total||''}</span></div>
  </div>
  ${form.brindes?`<h2>BRINDES</h2><p>${form.brindes}</p>`:''}
  ${form.observacoes?`<h2>OBSERVACOES</h2><p>${form.observacoes}</p>`:''}
  <div style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
    <div style="border-top:1px solid #000;padding-top:6px;text-align:center;font-size:11px">Assinatura Comprador 1</div>
    ${form.tem_segundo&&form.c2_nome?`<div style="border-top:1px solid #000;padding-top:6px;text-align:center;font-size:11px">Assinatura Comprador 2</div>`:'<div></div>'}
    <div style="border-top:1px solid #000;padding-top:6px;text-align:center;font-size:11px">Assinatura do Vendedor</div>
    <div style="border-top:1px solid #000;padding-top:6px;text-align:center;font-size:11px">Data</div>
  </div>
  <script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open('','_blank'); w.document.write(html); w.document.close();
}

const emptyForm = () => ({
  captador_id:'', consultor_id:'', fechador_id:'', data_venda:'',
  c1_nome:'', c1_email:'', c1_tel1:'', c1_tel2:'', c1_cpf:'', c1_nasc:'', c1_rg:'', c1_orgao:'', c1_uf:'', c1_estado_civil:'', c1_profissao:'',
  tem_segundo: false,
  c2_nome:'', c2_email:'', c2_tel1:'', c2_tel2:'', c2_cpf:'', c2_nasc:'', c2_rg:'', c2_orgao:'', c2_uf:'', c2_estado_civil:'', c2_profissao:'',
  cep:'', logradouro:'', numero:'', bairro:'', cidade_uf:'', complemento:'',
  produto:'', semana:'', valor_unitario:'', quantidade:1, valor_total:'', valor_entrada_total:'', data_entrada_efetiva:'',
  pag1_valor:'', pag1_forma:'PIX', pag1_credito:1,
  pag2_valor:'', pag2_forma:'PIX', pag2_credito:1,
  pag3_valor:'', pag3_forma:'PIX', pag3_credito:1,
  er_valor:'', er_data:'', er_parcelas:'', er_parcela_val:'', er_forma:'BOLETO',
  saldo_valor:'', saldo_forma:'BOLETO', saldo_data:'', saldo_parcelas:'', saldo_parcela_val:'',
  spiff:'', brindes:'', observacoes:'',
});

export default function CadastroVendas({ setPage }) {
  const { user } = useAuth();
  const [captadores, setCaptadores] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [fechadores, setFechadores] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([api.getCaptadores(), api.getConsultores(), api.getFechadores()])
      .then(([c,co,f]) => { setCaptadores(c); setConsultores(co); setFechadores(f); })
      .catch(console.error);
  }, []);

  const f = (k,v) => setForm(p => ({ ...p, [k]: v }));
  const recalc = (vu, q) => {
    const total = (parseFloat(vu||0) * parseInt(q||1)).toFixed(2);
    setForm(p => ({ ...p, valor_total: total }));
  };
  const handleFile = (name, file) => setFiles(p => ({ ...p, [name]: file }));

  const buscarCep = async () => {
    const cep = form.cep.replace(/\D/g,'');
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) setForm(p => ({ ...p, logradouro: d.logradouro, bairro: d.bairro, cidade_uf: `${d.localidade}/${d.uf}` }));
    } catch {}
  };

  const limpar = () => {
    if (!window.confirm('Limpar todos os campos?')) return;
    setForm(emptyForm()); setFiles({}); setError(''); setSuccess('');
  };

  const getNome = (list, id) => list.find(u => u.id === id)?.nome || '';

  const handleSubmit = async () => {
    if (!files.ficha_bloqueio || !files.ficha_atendimento || !files.documento_cliente || !files.comprovante || !files.negociacao) {
      setError('Todos os documentos obrigatorios devem ser anexados.'); return;
    }
    setLoading(true); setProgress('Enviando venda...'); setError(''); setSuccess('');
    try {
      const pagamentos = [
        { valor: form.pag1_valor, forma: form.pag1_forma, parcelas: form.pag1_credito },
        { valor: form.pag2_valor, forma: form.pag2_forma, parcelas: form.pag2_credito },
        { valor: form.pag3_valor, forma: form.pag3_forma, parcelas: form.pag3_credito },
      ].filter(p => p.valor);

      const entrada_restante = form.er_valor ? {
        valor: form.er_valor, data_inicio: form.er_data, parcelas: form.er_parcelas,
        valor_parcela: form.er_parcela_val, forma: form.er_forma
      } : {};

      const saldo = form.saldo_valor ? {
        valor: form.saldo_valor, forma: form.saldo_forma, data_inicio: form.saldo_data,
        parcelas: form.saldo_parcelas, valor_parcela: form.saldo_parcela_val
      } : {};

      const dados = { ...form, pagamentos, entrada_restante, saldo };

      const fd = new FormData();
      fd.append('dados', JSON.stringify(dados));
      Object.entries(files).forEach(([k,v]) => { if(v) fd.append(k, v); });

      const res = await api.createVenda(fd);
      setSuccess(`Venda enviada com sucesso! ID: ${res.venda_id}`);
      setForm(emptyForm()); setFiles({});
      setTimeout(() => setPage('minhas_vendas'), 2000);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setProgress(''); }
  };

  const capNome = getNome(captadores, form.captador_id);
  const consNome = getNome(consultores, form.consultor_id);
  const fecNome = getNome(fechadores, form.fechador_id);

  const UploadCard = ({ name, label, required }) => (
    <label className="upload-card">
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>handleFile(name, e.target.files[0])} />
      <strong>{label}</strong>
      {files[name]
        ? <span style={{color:'var(--green)'}}>✓ {files[name].name}</span>
        : <span>{required ? 'Arquivo obrigatorio' : 'Opcional'}</span>
      }
    </label>
  );

  return (
    <>
      <header className="topbar">
        <div>
          <h2>Cadastro de vendas</h2>
          <span id="saleMetaBadge">Preencha os dados da venda e anexe os documentos obrigatorios.</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="secondary-button compact-button" onClick={() => gerarFicha(form, capNome, consNome, fecNome)}>Gerar ficha de bloqueio</button>
          <button className="secondary-button compact-button" onClick={limpar}>Limpar</button>
        </div>
      </header>

      <div className="tab-panel" id="salesTab">
        {error && <div style={{background:'var(--red-bg)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,padding:'10px 14px',color:'var(--red)',fontSize:13,marginBottom:14}}>⚠ {error}</div>}
        {success && <div style={{background:'var(--green-bg)',border:'1px solid rgba(16,185,129,.2)',borderRadius:8,padding:'10px 14px',color:'var(--green)',fontSize:13,marginBottom:14}}>✓ {success}</div>}

        <div className="content-grid sales-form-only">
          <div className="form-panel blocking-form-box">

            {/* NOVA VENDA */}
            <div className="blocking-section">
              <h4>Nova venda</h4>
              <div className="form-grid">
                <label>Nome do captador
                  <select value={form.captador_id} onChange={e=>f('captador_id',e.target.value)}>
                    <option value="">Selecione</option>
                    {captadores.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </label>
                <label>Nome do consultor
                  <select value={form.consultor_id} onChange={e=>f('consultor_id',e.target.value)}>
                    <option value="">Selecione</option>
                    {consultores.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </label>
                <label>Nome do fechador
                  <select value={form.fechador_id} onChange={e=>f('fechador_id',e.target.value)}>
                    <option value="">Selecione</option>
                    {fechadores.map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </label>
                <label>Data da venda<input type="date" value={form.data_venda} onChange={e=>f('data_venda',e.target.value)}/></label>
              </div>
            </div>

            {/* FICHA / COMPRADOR 1 */}
            <div className="blocking-section">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <h4>Ficha de bloqueio — Comprador 1</h4>
              </div>
              <div className="form-grid">
                <label className="full-width">Nome do comprador<input value={form.c1_nome} onChange={e=>f('c1_nome',e.target.value)}/></label>
                <label>E-mail<input type="email" value={form.c1_email} onChange={e=>f('c1_email',e.target.value)}/></label>
                <label>Telefone 1<input value={form.c1_tel1} onChange={e=>f('c1_tel1',e.target.value)}/></label>
                <label>Telefone 2<input value={form.c1_tel2} onChange={e=>f('c1_tel2',e.target.value)}/></label>
                <label>CPF<input value={form.c1_cpf} onChange={e=>f('c1_cpf',e.target.value)}/></label>
                <label>Data de nascimento<input type="date" value={form.c1_nasc} onChange={e=>f('c1_nasc',e.target.value)}/></label>
                <label>RG<input value={form.c1_rg} onChange={e=>f('c1_rg',e.target.value)}/></label>
                <label>Orgao expedidor<input value={form.c1_orgao} onChange={e=>f('c1_orgao',e.target.value)}/></label>
                <label>UF do RG
                  <select value={form.c1_uf} onChange={e=>f('c1_uf',e.target.value)}>
                    <option value="">UF</option>
                    {UFS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </label>
                <label>Estado civil
                  <select value={form.c1_estado_civil} onChange={e=>f('c1_estado_civil',e.target.value)}>
                    <option value="">Selecione</option>
                    {ESTADOS_CIVIS.map(ec=><option key={ec}>{ec}</option>)}
                  </select>
                </label>
                <label>Profissao<input value={form.c1_profissao} onChange={e=>f('c1_profissao',e.target.value)}/></label>
              </div>
            </div>

            {/* COMPRADOR 2 */}
            <div className="blocking-section">
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <h4>Comprador 2</h4>
                <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:400,color:'var(--text2)',textTransform:'none',letterSpacing:0}}>
                  <input type="checkbox" checked={form.tem_segundo} onChange={e=>f('tem_segundo',e.target.checked)} style={{accentColor:'var(--accent)'}}/>
                  Cadastrar segundo comprador
                </label>
              </div>
              {form.tem_segundo && (
                <div className="form-grid">
                  <label className="full-width">Nome do comprador<input value={form.c2_nome} onChange={e=>f('c2_nome',e.target.value)}/></label>
                  <label>CPF<input value={form.c2_cpf} onChange={e=>f('c2_cpf',e.target.value)}/></label>
                  <label>Data de nascimento<input type="date" value={form.c2_nasc} onChange={e=>f('c2_nasc',e.target.value)}/></label>
                  <label>RG<input value={form.c2_rg} onChange={e=>f('c2_rg',e.target.value)}/></label>
                  <label>Orgao expedidor<input value={form.c2_orgao} onChange={e=>f('c2_orgao',e.target.value)}/></label>
                  <label>UF do RG
                    <select value={form.c2_uf} onChange={e=>f('c2_uf',e.target.value)}>
                      <option value="">UF</option>
                      {UFS.map(u=><option key={u}>{u}</option>)}
                    </select>
                  </label>
                  <label>Estado civil
                    <select value={form.c2_estado_civil} onChange={e=>f('c2_estado_civil',e.target.value)}>
                      <option value="">Selecione</option>
                      {ESTADOS_CIVIS.map(ec=><option key={ec}>{ec}</option>)}
                    </select>
                  </label>
                  <label>Profissao<input value={form.c2_profissao} onChange={e=>f('c2_profissao',e.target.value)}/></label>
                  <label>E-mail<input type="email" value={form.c2_email} onChange={e=>f('c2_email',e.target.value)}/></label>
                  <label>Telefone 1<input value={form.c2_tel1} onChange={e=>f('c2_tel1',e.target.value)}/></label>
                  <label>Telefone 2<input value={form.c2_tel2} onChange={e=>f('c2_tel2',e.target.value)}/></label>
                </div>
              )}
            </div>

            {/* ENDEREÇO */}
            <div className="blocking-section">
              <h4>Endereco</h4>
              <div className="form-grid">
                <label>CEP<input value={form.cep} onChange={e=>f('cep',e.target.value)} onBlur={buscarCep} placeholder="00000-000"/></label>
                <label>Numero<input value={form.numero} onChange={e=>f('numero',e.target.value)}/></label>
                <label className="full-width">Logradouro<input value={form.logradouro} onChange={e=>f('logradouro',e.target.value)}/></label>
                <label>Bairro<input value={form.bairro} onChange={e=>f('bairro',e.target.value)}/></label>
                <label>Cidade/UF<input value={form.cidade_uf} onChange={e=>f('cidade_uf',e.target.value)} placeholder="Ex: Sao Paulo/SP"/></label>
                <label>Complemento<input value={form.complemento} onChange={e=>f('complemento',e.target.value)}/></label>
              </div>
            </div>

            {/* PRODUTO */}
            <div className="blocking-section">
              <h4>Produto</h4>
              <div className="form-grid">
                <label>Produto
                  <select value={form.produto} onChange={e=>f('produto',e.target.value)}>
                    <option value="">Selecione</option>
                    {PRODUTOS.map(p=><option key={p}>{p}</option>)}
                  </select>
                </label>
                <label>Semana
                  <select value={form.semana} onChange={e=>f('semana',e.target.value)}>
                    <option value="">Selecione</option>
                    {SEMANAS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>Valor unitario do contrato
                  <input type="number" step="0.01" value={form.valor_unitario} onChange={e=>{f('valor_unitario',e.target.value);recalc(e.target.value,form.quantidade);}}/>
                </label>
                <label>Quantidade de contratos
                  <input type="number" min="1" value={form.quantidade} onChange={e=>{f('quantidade',e.target.value);recalc(form.valor_unitario,e.target.value);}}/>
                </label>
                <label>Valor total vendido<input type="number" step="0.01" value={form.valor_total} readOnly style={{opacity:.7}}/></label>
                <label>Valor total da entrada efetiva<input type="number" step="0.01" value={form.valor_entrada_total} onChange={e=>f('valor_entrada_total',e.target.value)}/></label>
              </div>
            </div>

            {/* ENTRADA EFETIVA */}
            <div className="blocking-section">
              <h4>Entrada efetiva por contrato</h4>
              <div className="form-grid entry-payment-grid">
                {[1,2,3].map(i => (
                  <>
                    <label key={`v${i}`}>Pagamento {i} — valor<input type="number" step="0.01" value={form[`pag${i}_valor`]} onChange={e=>f(`pag${i}_valor`,e.target.value)}/></label>
                    <label key={`f${i}`}>Pagamento {i} — forma
                      <select value={form[`pag${i}_forma`]} onChange={e=>f(`pag${i}_forma`,e.target.value)}>
                        {FORMAS_PAG.map(fm=><option key={fm}>{fm}</option>)}
                      </select>
                    </label>
                    {form[`pag${i}_forma`]==='CARTAO DE CREDITO' && (
                      <label key={`c${i}`}>Parcelas no credito<input type="number" min="1" max="24" value={form[`pag${i}_credito`]} onChange={e=>f(`pag${i}_credito`,e.target.value)}/></label>
                    )}
                  </>
                ))}
                <label>Data pagamento entrada efetiva<input type="date" value={form.data_entrada_efetiva} onChange={e=>f('data_entrada_efetiva',e.target.value)}/></label>
              </div>
            </div>

            {/* ENTRADA RESTANTE */}
            <div className="blocking-section">
              <h4>Entrada restante</h4>
              <div className="form-grid">
                <label>Entrada restante do contrato<input type="number" step="0.01" value={form.er_valor} onChange={e=>f('er_valor',e.target.value)}/></label>
                <label>Data inicio entrada restante<input type="date" value={form.er_data} onChange={e=>f('er_data',e.target.value)}/></label>
                <label>Parcelas entrada restante<input type="number" min="1" value={form.er_parcelas} onChange={e=>f('er_parcelas',e.target.value)}/></label>
                <label>Valor da parcela da entrada<input type="number" step="0.01" value={form.er_parcela_val} onChange={e=>f('er_parcela_val',e.target.value)}/></label>
                <label>Forma de pagamento da entrada
                  <select value={form.er_forma} onChange={e=>f('er_forma',e.target.value)}>
                    {FORMAS_PAG.map(fm=><option key={fm}>{fm}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {/* SALDO */}
            <div className="blocking-section">
              <h4>Saldo</h4>
              <div className="form-grid">
                <label>Valor do saldo<input type="number" step="0.01" value={form.saldo_valor} onChange={e=>f('saldo_valor',e.target.value)}/></label>
                <label>Forma de pagamento
                  <select value={form.saldo_forma} onChange={e=>f('saldo_forma',e.target.value)}>
                    {FORMAS_PAG.map(fm=><option key={fm}>{fm}</option>)}
                  </select>
                </label>
                <label>Data de inicio<input type="date" value={form.saldo_data} onChange={e=>f('saldo_data',e.target.value)}/></label>
                <label>Parcelas do saldo<input type="number" min="1" value={form.saldo_parcelas} onChange={e=>f('saldo_parcelas',e.target.value)}/></label>
                <label>Valor da parcela do saldo<input type="number" step="0.01" value={form.saldo_parcela_val} onChange={e=>f('saldo_parcela_val',e.target.value)}/></label>
              </div>
            </div>

            {/* CONTROLE VENDEDOR */}
            <div className="blocking-section">
              <div className="sale-details-box">
                <h4 style={{marginBottom:12}}>Controle do vendedor</h4>
                <p style={{fontSize:13,color:'var(--text3)',marginBottom:12}}>Informacao opcional para controle comercial.</p>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:8}}>Venda com SPIFF</div>
                  <div className="payment-options">
                    {SPIFF_OPTS.map(opt => (
                      <label key={opt} className="payment-option">
                        <input type="radio" name="spiff" value={opt} checked={form.spiff===opt} onChange={e=>f('spiff',e.target.value)}/>
                        <span>{opt}</span>
                      </label>
                    ))}
                    {form.spiff && <button type="button" className="mini-button" onClick={()=>f('spiff','')}>Remover SPIFF</button>}
                  </div>
                </div>
                <div className="form-grid">
                  <label className="full-width">Brindes de venda<input value={form.brindes} onChange={e=>f('brindes',e.target.value)} placeholder="Brindes incluidos na venda"/></label>
                  <label className="full-width">Observacoes<textarea value={form.observacoes} onChange={e=>f('observacoes',e.target.value)} rows={3}/></label>
                </div>
              </div>
            </div>

            {/* DOCUMENTOS */}
            <div className="blocking-section">
              <div className="documents-box">
                <h4 style={{marginBottom:12}}>Upload de documentos obrigatorios</h4>
                <div className="doc-upload-grid">
                  <UploadCard name="ficha_bloqueio" label="Ficha de bloqueio" required />
                  <UploadCard name="ficha_atendimento" label="Ficha de atendimento" required />
                  <UploadCard name="documento_cliente" label="Documento do cliente" required />
                  <UploadCard name="comprovante" label="Comprovante" required />
                  <UploadCard name="negociacao" label="Negociacao" required />
                  <UploadCard name="documento_segundo" label="Documento do segundo comprador" required={false} />
                </div>
              </div>
            </div>

            {loading && <div className="sale-progress"><div className="progress-spinner"/>{progress}</div>}

            <div className="form-actions" style={{marginTop:20}}>
              <button type="button" className="secondary-button" onClick={()=>setPage('minhas_vendas')}>Cancelar</button>
              <button type="button" className="primary-button" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar venda'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
