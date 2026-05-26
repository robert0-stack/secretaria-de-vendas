const BASE = import.meta.env.VITE_API_URL || '/api';
const getToken = () => localStorage.getItem('sv_token');

async function req(method, path, body, isForm = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method, headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro');
  return data;
}

export const api = {
  login: (email, senha) => req('POST', '/auth/login', { email, senha }),
  register: (body) => req('POST', '/auth/register', body),
  recuperarSenha: (email) => req('POST', '/auth/recuperar-senha', { email }),
  me: () => req('GET', '/auth/me'),

  getUsers: () => req('GET', '/users'),
  getCaptadores: () => req('GET', '/users/captadores'),
  getConsultores: () => req('GET', '/users/consultores'),
  getFechadores: () => req('GET', '/users/fechadores'),
  createUser: (body) => req('POST', '/users', body),
  updateUser: (id, body) => req('PUT', `/users/${id}`, body),
  toggleUser: (id) => req('PUT', `/users/${id}/toggle`),
  deleteUser: (id) => req('DELETE', `/users/${id}`),

  getPermissoes: (uid) => req('GET', `/permissoes/${uid}`),
  updatePermissoes: (uid, body) => req('PUT', `/permissoes/${uid}`, body),

  getSetores: () => req('GET', '/setores'),
  createSetor: (body) => req('POST', '/setores', body),
  updateSetorPerms: (nome, body) => req('PUT', `/setores/${encodeURIComponent(nome)}/permissoes`, body),
  deleteSetor: (nome) => req('DELETE', `/setores/${encodeURIComponent(nome)}`),

  createVenda: (fd) => req('POST', '/vendas', fd, true),
  getVendas: (status) => req('GET', `/vendas${status && status !== 'todos' ? `?status=${encodeURIComponent(status)}` : ''}`),
  getMinhasVendas: (status) => req('GET', `/vendas/minhas${status && status !== 'todos' ? `?status=${encodeURIComponent(status)}` : ''}`),
  getVenda: (id) => req('GET', `/vendas/${id}`),
  deleteVenda: (id) => req('DELETE', `/vendas/${id}`),

  salvarConferencia: (body) => req('POST', '/conferencias', body),

  getDashboard: () => req('GET', '/relatorios/dashboard'),
  getAtividades: (params) => req('GET', `/relatorios/atividades?${new URLSearchParams(params)}`),
  getAuditoria: () => req('GET', '/relatorios/auditoria'),
};

export const fmtCurrency = (v) => v || v === 0 ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v) : '—';
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('pt-BR') : '—';
export const statusBadge = (s) => ({'Aguardando conferencia':'waiting','Em conferencia':'review','Pendente de ajuste':'pending','Aprovado':'approved','Reprovado':'rejected','Finalizado':'done','Ativo':'ativo','Inativo':'inativo'}[s]||'waiting');
export const STATUS_LIST = ['Aguardando conferencia','Em conferencia','Pendente de ajuste','Aprovado','Reprovado','Finalizado'];
export const PRODUTOS = ['TIPITI','BURITI','BANGALO'];
export const SEMANAS = ['1 SEMANA','2 SEMANAS'];
export const FORMAS_PAG = ['PIX','DINHEIRO','CARTAO DE DEBITO','CARTAO DE CREDITO','TRANSFERENCIA','BOLETO'];
export const AREAS = ['Comercial','Administrativo','ADM','Captação','Telemarketing'];

// ✅ URL autenticada para arquivos — passa o token no header
export const getFileUrl = (filename) => {
  if (!filename) return null;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  return `${base}/uploads/${filename}`;
};

// Abre arquivo com autenticação
export const abrirArquivo = async (filename) => {
  if (!filename) return;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const url = `${base}/uploads/${filename}`;
  const token = localStorage.getItem('sv_token');
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Arquivo não encontrado');
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank');
    // Libera a URL após 60 segundos
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (e) {
    alert('Erro ao abrir arquivo: ' + e.message);
  }
};
