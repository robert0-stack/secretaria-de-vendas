import { useState, useEffect } from 'react';
import { api } from '../api';

const PERM_KEYS = [
  { key:'access_dashboard',    label:'Acessar dashboard' },
  { key:'create_sales',        label:'Cadastrar vendas' },
  { key:'view_own_sales',      label:'Ver proprias vendas' },
  { key:'view_all_sales',      label:'Ver todas as vendas' },
  { key:'view_documents',      label:'Ver documentos de vendas' },
  { key:'manage_conference',   label:'Conferir documentos' },
  { key:'change_sale_status',  label:'Alterar status' },
  { key:'manage_users',        label:'Gerenciar usuarios' },
  { key:'manage_permissions',  label:'Gerenciar permissoes' },
  { key:'delete_sales',        label:'Excluir vendas' },
  { key:'view_audit',          label:'Ver auditoria' },
  { key:'act_as_captador',     label:'Atuar como captador' },
  { key:'act_as_consultor',    label:'Atuar como consultor' },
  { key:'act_as_fechador',     label:'Atuar como fechador' },
];

export default function Permissoes() {
  const [users, setUsers] = useState([]);
  const [setores, setSetores] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [perms, setPerms] = useState({});
  const [preset, setPreset] = useState('');
  const [saving, setSaving] = useState(false);
  const [sectorName, setSectorName] = useState('');
  const [addingSetor, setAddingSetor] = useState(false);

  const load = () => {
    Promise.all([api.getUsers(), api.getSetores()])
      .then(([u, s]) => { setUsers(u); setSetores(s); })
      .catch(console.error);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedUser) return;
    api.getPermissoes(selectedUser).then(p => {
      const permsObj = {};
      PERM_KEYS.forEach(({ key }) => { permsObj[key] = !!p[key]; });
      setPerms(permsObj);
      setPreset('');
    }).catch(console.error);
  }, [selectedUser]);

  const aplicarPreset = (nome) => {
    setPreset(nome);
    if (!nome) return;
    const s = setores.find(s => s.nome === nome);
    if (!s) return;
    const p = {};
    PERM_KEYS.forEach(({ key }) => { p[key] = !!s[key]; });
    setPerms(p);
  };

  const salvarPerms = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.updatePermissoes(selectedUser, perms);
      alert('Permissoes salvas!');
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const salvarSetorPerms = async (nome, permsSetor) => {
    await api.updateSetorPerms(nome, permsSetor);
    load();
  };

  const addSetor = async (e) => {
    e.preventDefault();
    if (!sectorName.trim()) return;
    setAddingSetor(true);
    try { await api.createSetor({ nome: sectorName }); setSectorName(''); load(); }
    catch(e) { alert(e.message); }
    finally { setAddingSetor(false); }
  };

  const delSetor = async (nome) => {
    if (!window.confirm(`Excluir setor "${nome}"?`)) return;
    await api.deleteSetor(nome);
    load();
  };

  const setP = (key, val) => setPerms(p => ({ ...p, [key]: val }));

  return (
    <>
      <header className="topbar">
        <div><h2>Permissoes</h2><p>Defina o que cada usuario pode acessar e fazer no sistema.</p></div>
      </header>
      <div className="tab-panel">
        <div className="content-grid permissions-layout">

          {/* FORM ESQUERDA */}
          <section className="form-panel compact">
            <div className="section-heading compact-heading">
              <h3>Permissoes por usuario</h3>
            </div>
            <label style={{display:'flex',flexDirection:'column',gap:5,fontSize:12,fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:12}}>
              Usuario
              <select value={selectedUser} onChange={e=>setSelectedUser(e.target.value)}>
                <option value="">Selecione o usuario</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.nome} — {u.cnpj||u.email||u.id}</option>)}
              </select>
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:5,fontSize:12,fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:12}}>
              Aplicar modelo da area
              <select value={preset} onChange={e=>aplicarPreset(e.target.value)} disabled={!selectedUser}>
                <option value="">Personalizado</option>
                {setores.map(s=><option key={s.nome}>{s.nome}</option>)}
              </select>
            </label>
            <div className="permission-grid">
              {PERM_KEYS.map(({ key, label }) => (
                <label key={key} className="permission-option">
                  <input type="checkbox" checked={!!perms[key]} onChange={e=>setP(key,e.target.checked)} disabled={!selectedUser} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="form-actions">
              <button className="primary-button compact-button" onClick={salvarPerms} disabled={saving||!selectedUser}>
                {saving ? 'Salvando...' : 'Salvar permissoes'}
              </button>
            </div>
          </section>

          {/* DIREITA */}
          <div>
            {/* EXPLICAÇÃO */}
            <section className="list-panel" style={{marginBottom:20}}>
              <div className="admin-panel-head">
                <strong>Como o sistema usa essas permissoes</strong>
                <span>Captador, Consultor e Fechador aparecem nas listas apenas quando o usuario tem permissao para atuar naquela funcao. O CNPJ salvo no cadastro oficial e usado na venda.</span>
              </div>
              <div className="simple-list">
                <article className="simple-item"><strong>Comercial</strong>Pode cadastrar vendas e atuar nas funcoes comerciais.</article>
                <article className="simple-item"><strong>Administrativo</strong>Pode visualizar todas as vendas, conferir documentos e alterar status.</article>
                <article className="simple-item"><strong>ADM</strong>Tem acesso total, inclusive usuarios, permissoes e exclusao.</article>
              </div>
            </section>

            {/* SETORES */}
            <section className="list-panel">
              <div className="admin-panel-head sector-head">
                <strong>Setores do sistema</strong>
                <span>Cadastre setores e defina os acessos gerais de cada area. Ao salvar o setor, os usuarios vinculados recebem esse padrao.</span>
              </div>
              <form className="sector-form" onSubmit={addSetor}>
                <input type="text" maxLength={40} placeholder="Nome do novo setor" value={sectorName} onChange={e=>setSectorName(e.target.value)}/>
                <button type="submit" disabled={addingSetor}>{addingSetor?'Adicionando...':'Adicionar setor'}</button>
              </form>
              <div className="sector-list">
                {setores.map(s => {
                  const sPerms = {};
                  PERM_KEYS.forEach(({ key }) => { sPerms[key] = !!s[key]; });
                  const setSetor = (key, val) => {
                    setSetores(prev => prev.map(x => x.nome === s.nome ? { ...x, [key]: val } : x));
                  };
                  return (
                    <article key={s.nome} className="sector-item">
                      <div className="sector-item-head">
                        <div>
                          <strong>{s.nome}</strong>
                          <span>{s.usuarios} usuario(s) vinculado(s)</span>
                        </div>
                        <div className="sector-actions">
                          {s.padrao && <small>Setor padrao</small>}
                          {!s.padrao && <button type="button" className="mini-button danger" onClick={()=>delSetor(s.nome)}>Excluir</button>}
                          <button type="button" className="mini-button" onClick={()=>salvarSetorPerms(s.nome, sPerms)} disabled={s.nome==='ADM'}>Salvar acessos</button>
                        </div>
                      </div>
                      <div className="sector-permission-grid">
                        {PERM_KEYS.map(({ key, label }) => (
                          <label key={key} className="sector-permission-option">
                            <input type="checkbox" checked={!!s[key]} onChange={e=>setSetor(key,e.target.checked)} disabled={s.nome==='ADM'}/>
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
