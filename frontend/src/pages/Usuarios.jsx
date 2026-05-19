import { useState, useEffect } from 'react';
import { api, AREAS } from '../api';

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // null | 'new' | user
  const [form, setForm] = useState({ nome:'', cnpj:'', cpf:'', area_atuacao:'Comercial', email:'', telefone:'', senha:'', status:'Ativo' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const abrirNovo = () => {
    setForm({ nome:'', cnpj:'', cpf:'', area_atuacao:'Comercial', email:'', telefone:'', senha:'', status:'Ativo' });
    setError(''); setEditando('new');
  };

  const abrirEditar = (u) => {
    setForm({ nome:u.nome, cnpj:u.cnpj||'', cpf:u.cpf||'', area_atuacao:u.area_atuacao, email:u.email||'', telefone:u.telefone||'', senha:'', status:u.status });
    setError(''); setEditando(u);
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editando === 'new') await api.createUser(form);
      else await api.updateUser(editando.id, form);
      load(); setEditando(null);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (u) => {
    await api.toggleUser(u.id);
    load();
  };

  const deletar = async (u) => {
    if (!window.confirm(`Excluir ${u.nome}?`)) return;
    await api.deleteUser(u.id);
    load();
  };

  const f = (k,v) => setForm(p=>({...p,[k]:v}));

  return (
    <>
      <header className="topbar">
        <div><h2>Usuarios</h2><p>Gerencie usuarios, areas e acessos ao sistema.</p></div>
      </header>
      <div className="tab-panel">
        <div className="content-grid users-layout">

          {/* FORM ESQUERDA */}
          <section className="form-panel compact">
            <div className="section-heading compact-heading">
              <h3>{editando === 'new' ? 'Novo usuario' : editando ? `Editar: ${editando.nome}` : 'Cadastrar usuario'}</h3>
            </div>
            <form onSubmit={salvar}>
              <label>Nome e sobrenome<input value={form.nome} onChange={e=>f('nome',e.target.value)} required/></label>
              <label>CNPJ<input value={form.cnpj} onChange={e=>f('cnpj',e.target.value)} placeholder="00.000.000/0000-00"/></label>
              <label>CPF<input value={form.cpf} onChange={e=>f('cpf',e.target.value)} placeholder="000.000.000-00"/></label>
              <label>Area de atuacao
                <select value={form.area_atuacao} onChange={e=>f('area_atuacao',e.target.value)}>
                  {AREAS.map(a=><option key={a}>{a}</option>)}
                </select>
              </label>
              <label>E-mail<input type="email" value={form.email} onChange={e=>f('email',e.target.value)}/></label>
              <label>Telefone<input value={form.telefone} onChange={e=>f('telefone',e.target.value)}/></label>
              <label>
                {editando !== 'new' ? 'Nova senha (em branco = nao alterar)' : 'Senha'}
                <input type="password" value={form.senha} onChange={e=>f('senha',e.target.value)} placeholder={editando!=='new'?'••••••••':''} minLength={editando==='new'?6:0}/>
              </label>
              <label>Status
                <select value={form.status} onChange={e=>f('status',e.target.value)}>
                  <option>Ativo</option><option>Inativo</option>
                </select>
              </label>
              {error && <div style={{color:'var(--red)',fontSize:12,marginBottom:8}}>⚠ {error}</div>}
              <div className="form-actions">
                {editando && <button type="button" className="secondary-button compact-button" onClick={()=>setEditando(null)}>Cancelar</button>}
                <button type="button" className="secondary-button compact-button" onClick={abrirNovo}>Novo</button>
                <button type="submit" className="compact-button" disabled={saving || !editando}>
                  {saving ? 'Salvando...' : 'Salvar usuario'}
                </button>
              </div>
            </form>
          </section>

          {/* LISTA DIREITA */}
          <section className="list-panel">
            <div className="panel-title">Usuarios cadastrados ({users.length})</div>
            <div className="user-list">
              {loading ? <div className="empty-state"><div className="spinner"/> Carregando...</div>
              : users.length === 0 ? <div className="empty-state">Nenhum usuario cadastrado.</div>
              : users.map(u => (
                <article key={u.id} className="user-item">
                  <div className="item-title">
                    <strong>{u.nome}</strong>
                    <span className={`status-pill status-${u.status}`}>{u.status}</span>
                  </div>
                  <div className="item-meta">{u.area_atuacao} — {u.acesso_criado ? u.email : 'Acesso ainda nao criado'}</div>
                  <div className="item-meta">CNPJ: {u.cnpj||'—'} — CPF: {u.cpf||'Nao informado'}</div>
                  <div className="item-meta">
                    Funcoes: {[u.act_as_captador&&'Captador',u.act_as_consultor&&'Consultor',u.act_as_fechador&&'Fechador'].filter(Boolean).join(', ') || 'Sem funcao comercial'}
                  </div>
                  <div className="item-meta">Cadastro: {new Date(u.created_at).toLocaleString('pt-BR')}</div>
                  <div className="row-actions" style={{marginTop:6}}>
                    <button className="mini-button" onClick={()=>abrirEditar(u)}>Editar</button>
                    <button className="mini-button secondary-button" onClick={()=>toggle(u)}>{u.status==='Ativo'?'Inativar':'Ativar'}</button>
                    <button className="mini-button danger-button" onClick={()=>deletar(u)}>Excluir</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
