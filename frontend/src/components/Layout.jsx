import { useState, useEffect } from 'react';
import { useAuth } from '../App';

const allNav = [
  { id:'dashboard',           label:'Dashboard',              perms:['all'] },
  { id:'cadastro_vendas',     label:'Cadastro de vendas',     perms:['create_sales'] },
  { id:'minhas_vendas',       label:'Minhas vendas',          perms:['view_own_sales'] },
  { id:'documentos_vendas',   label:'Documentos de vendas',   perms:['view_documents'] },
  { id:'usuarios',            label:'Usuarios',               perms:['manage_users'] },
  { id:'permissoes',          label:'Permissoes',             perms:['manage_permissions'] },
  { id:'historico_atividade', label:'Historico de Atividade', perms:['view_audit'] },
  { id:'auditoria',           label:'Auditoria',              perms:['view_audit'] },
];

export default function Layout({ page, setPage }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const visible = allNav.filter(item => {
    if (item.perms.includes('all')) return true;
    return item.perms.some(p => user?.[p]);
  });

  const navigate = (id) => {
    setPage(id);
    setOpen(false);
  };

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!e.target.closest('.sidebar') && !e.target.closest('.hamburger-btn')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      {/* BOTÃO HAMBURGUER — só aparece no mobile */}
      <button className="hamburger-btn" onClick={() => setOpen(o => !o)}
        style={{ position:'fixed', top:14, left:14, zIndex:400 }}>
        {open ? '✕' : '☰'}
      </button>

      {/* OVERLAY escuro atrás do menu */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-placeholder">📋</div>
          <div>
            <strong>Conferencia</strong>
            <span>{user?.nome} - {user?.area_atuacao}</span>
          </div>
        </div>
        <nav id="mainNav">
          {visible.map(item => (
            <button key={item.id}
              className={`nav-button ${page === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button className="ghost-button" onClick={logout}>Sair</button>
      </aside>
    </>
  );
}
