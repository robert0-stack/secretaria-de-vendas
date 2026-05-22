import { useState, useEffect, createContext, useContext } from 'react';
import { api } from './api';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CadastroVendas from './pages/CadastroVendas';
import MinhasVendas from './pages/MinhasVendas';
import DocumentosVendas from './pages/DocumentosVendas';
import Usuarios from './pages/Usuarios';
import Permissoes from './pages/Permissoes';
import HistoricoAtividade from './pages/HistoricoAtividade';
import Auditoria from './pages/Auditoria';

export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const PAGES = {
  dashboard: Dashboard,
  cadastro_vendas: CadastroVendas,
  minhas_vendas: MinhasVendas,
  documentos_vendas: DocumentosVendas,
  usuarios: Usuarios,
  permissoes: Permissoes,
  historico_atividade: HistoricoAtividade,
  auditoria: Auditoria,
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('sv_token');
    if (token) {
      api.me().then(u => setUser(u))
        .catch(() => localStorage.removeItem('sv_token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, senha) => {
    const data = await api.login(email, senha);
    localStorage.setItem('sv_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('sv_token');
    setUser(null);
    setPage('dashboard');
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', gap:12, color:'#8FA3BF' }}>
      <div className="spinner"/> Carregando...
    </div>
  );

  if (!user) return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <Login />
    </AuthCtx.Provider>
  );

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <AuthCtx.Provider value={{ user, login, logout, setUser }}>
      <div className="app-shell">
        <Layout page={page} setPage={setPage} />
        <section className="workspace" style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-w)' }}>
          <PageComponent setPage={setPage} />
        </section>
      </div>
    </AuthCtx.Provider>
  );
}
