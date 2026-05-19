import { useAuth } from '../App';

const allNav = [
  { id:'dashboard', label:'Dashboard', perms:['all'] },
  { id:'cadastro_vendas', label:'Cadastro de vendas', perms:['create_sales'] },
  { id:'minhas_vendas', label:'Minhas vendas', perms:['view_own_sales'] },
  { id:'documentos_vendas', label:'Documentos de vendas', perms:['view_documents'] },
  { id:'usuarios', label:'Usuarios', perms:['manage_users'] },
  { id:'permissoes', label:'Permissoes', perms:['manage_permissions'] },
  { id:'historico_atividade', label:'Historico de Atividade', perms:['view_audit'] },
  { id:'auditoria', label:'Auditoria', perms:['view_audit'] },
];

export default function Layout({ page, setPage }) {
  const { user, logout } = useAuth();

  const visible = allNav.filter(item => {
    if (item.perms.includes('all')) return true;
    return item.perms.some(p => user?.[p]);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-placeholder">📋</div>
        <div>
          <strong>Conferencia</strong>
          <span>{user?.nome} - {user?.area_atuacao}</span>
        </div>
      </div>
      <nav id="mainNav">
        {visible.map(item => (
          <button key={item.id} className={`nav-button ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      <button className="ghost-button" onClick={logout}>Sair</button>
    </aside>
  );
}
