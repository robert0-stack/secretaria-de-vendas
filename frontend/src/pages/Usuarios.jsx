import { useState, useEffect } from 'react';
import { api, AREAS } from '../api';

// ✅ Funções de máscara e validação
const maskCNPJ = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const maskCPF = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
};

const maskTelefone = (v) => {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  return n.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3');
};

const validarCNPJ = (v) => {
  const n = v.replace(/\D/g, '');
  return n.length === 0 || n.length === 14;
};

const validarCPF = (v) => {
  const n = v.replace(/\D/g, '');
  return n.length === 0 || n.length === 11;
};

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nome:'', cnpj:'', cpf:'', area_atuacao:'Comercial', email:'', telefone:'', senha:'', status:'Ativo' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const abrirNovo = () => {
    setForm({ nome:'', cnpj:'', cpf:'', area_atuacao:'Comercial', email:'', telefone:'', senha:'', status:'Ativo' });
    setError(''); setEditando('new');
  };

  const abrirEditar = (u) => {
    setForm({
      nome: u.nome,
      cnpj: u.cnpj ? maskCNPJ(u.cnpj) : '',
      cpf: u.cpf ? maskCPF(u.cpf) : '',
      area_atuacao: u.area_atuacao,
      email: u.email || '',
      telefone: u.telefone ? maskTelefone(u.telefone) : '',
      senha: '',
      status: u.status
    });
    setError(''); setEditando(u);
  };

  const salvar = async (e) => {
    e.preventDefault();
    // Validações frontend
    if (!form.nome.trim()) { setError('Nome é obrigatorio.'); return; }
    if (form.cnpj && !validarCNPJ(form.cnpj)) { setError('CNPJ invalido. Digite os 14 numeros.'); return; }
    if (form.cpf && !validarCPF(form.cpf)) { setError('CPF invalido. Digite os 11 numeros.'); return; }
    if (editando === 'new' && !form.senha) { setError('Senha e obrigatoria para novo usuario.'); return; }
    if (form.senha && form.senha.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }

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
    if (!window.confirm(`Excluir ${u.nome}? Esta acao nao pode ser desfeita.`)) return;
    try {
      await api.deleteUser(u.id);
      load();
    } catch(e) { alert(e.message); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <header className="topbar">
        <div><h2>Usuarios</h2><p>Gerencie usuarios, areas e acessos ao sistema.</p></div>
      </header>
      <div className="tab-panel">
        <div className="content-grid users-layout">

          {/* FORMULÁRIO — ESQUERDA */}
          <section className="form-panel compact">
            <div className="section-heading compact-heading">
              <h3>{editando === 'new' ? 'Novo usuario' : editando ? `Editar: ${editando.nome}` : 'Selecione ou crie um usuario'}</h3>
            </div>
            <form onSubmit={salvar}>
              <label>Nome e sobrenome *
                <input value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Nome completo" required />
              </label>
              <label>CNPJ do prestador
                <input
                  value={form.cnpj}
                  onChange={e => f('cnpj', maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  maxLength={18}
                />
              </label>
              <label>CPF
                <input
                  value={form.cpf}
                  onChange={e => f('cpf', maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                />
              </label>
              <label>Area de atuacao
                <select value={form.area_atuacao} onChange={e => f('area_atuacao', e.target.value)}>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </label>
              <label>E-mail
                <input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="usuario@email.com" />
              </label>
              <label>Telefone
                <input
                  value={form.telefone}
                  onChange={e => f('telefone', maskTelefone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  maxLength={15}
                />
              </label>
              <label>
                {editando !== 'new' ? 'Nova senha (em branco = nao alterar)' : 'Senha *'}
                <input
                  type="password"
                  value={form.senha}
                  onChange={e => f('senha', e.target.value)}
                  placeholder={editando !== 'new' ? '••••••••' : 'Minimo 6 caracteres'}
                  minLength={editando === 'new' ? 6 : 0}
                />
              </label>
              <label>Status
                <select value={form.status} onChange={e => f('status', e.target.value)}>
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </label>

              {error && (
                <div style={{ color:'var(--red)', fontSize:12, marginBottom:8, padding:'8px 10px', background:'var(--red-bg)', borderRadius:6, border:'1px solid rgba(239,68,68,.2)' }}>
                  ⚠ {error}
                </div>
              )}

              <div className="form-actions">
                {editando && (
                  <button type="button" className="secondary-button compact-button" onClick={() => setEditando(null)}>Cancelar</button>
                )}
                <button type="button" className="secondary-button compact-button" onClick={abrirNovo}>Novo</button>
                <button type="submit" className="compact-button" disabled={saving || !editando}>
                  {saving ? 'Salvando...' : 'Salvar usuario'}
                </button>
              </div>
            </form>
          </section>

          {/* LISTA — DIREITA */}
          <section className="list-panel">
            <div className="panel-title">Usuarios cadastrados ({users.length})</div>
            <div className="user-list">
              {loading
                ? <div className="empty-state"><div className="spinner" /> Carregando...</div>
                : users.length === 0
                  ? <div className="empty-state">Nenhum usuario cadastrado.</div>
                  : users.map(u => (
                    <article key={u.id} className="user-item">
                      <div className="item-title">
                        <strong>{u.nome}</strong>
                        <span className={`status-pill status-${u.status}`}>{u.status}</span>
                      </div>
                      <div className="item-meta">{u.area_atuacao} — {u.acesso_criado ? u.email || 'sem e-mail' : 'Acesso ainda nao criado'}</div>
                      <div className="item-meta">
                        CNPJ: {u.cnpj ? maskCNPJ(u.cnpj) : '—'} &nbsp;·&nbsp; CPF: {u.cpf ? maskCPF(u.cpf) : 'Nao informado'}
                      </div>
                      <div className="item-meta">
                        Funcoes: {[
                          u.act_as_captador && 'Captador',
                          u.act_as_consultor && 'Consultor',
                          u.act_as_fechador && 'Fechador'
                        ].filter(Boolean).join(', ') || 'Sem funcao comercial'}
                      </div>
                      <div className="item-meta">
                        Cadastro: {new Date(u.created_at).toLocaleString('pt-BR')}
                      </div>
                      <div className="row-actions" style={{ marginTop:8 }}>
                        <button className="mini-button" onClick={() => abrirEditar(u)}>Editar</button>
                        <button className="mini-button secondary-button" onClick={() => toggle(u)}>
                          {u.status === 'Ativo' ? 'Inativar' : 'Ativar'}
                        </button>
                        <button className="mini-button danger-button" onClick={() => deletar(u)}>Excluir</button>
                      </div>
                    </article>
                  ))
              }
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
