import { useState } from 'react';
import { useAuth } from '../App';
import { api } from '../api';

export default function Login() {
  const { login } = useAuth();
  const [tela, setTela] = useState('login'); // login | register | recover
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [reg, setReg] = useState({ nome:'', cnpj:'', area_atuacao:'Comercial', email:'', telefone:'', senha:'' });
  const [recEmail, setRecEmail] = useState('');

  const go = (t) => { setTela(t); setError(''); setSuccess(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await login(email, senha); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.register(reg);
      setSuccess('Cadastro realizado! Aguarde a criacao do seu acesso pelo administrador.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.recuperarSenha(recEmail);
      setSuccess('Se este e-mail estiver cadastrado, voce recebera as instrucoes.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-view">
      <div className="auth-copy">
        <div className="brand-mark" style={{ width:64, height:64, background:'var(--accent)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, marginBottom:20 }}>📋</div>
        <h1>Secretaria de Vendas</h1>
        <p>Agilidade e eficiencia na producao de contratos e conferencia de documentos.</p>
      </div>

      <div className="auth-panel">
        {tela === 'login' && (
          <div className="auth-form">
            <h2>Entrar</h2>
            <form onSubmit={handleLogin}>
              <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required /></label>
              <label>Senha<input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" required /></label>
              {error && <div className="error-message">⚠ {error}</div>}
              <button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Acessar sistema'}</button>
            </form>
            <div className="auth-links">
              <button className="link-button" onClick={() => go('register')}>Criar acesso</button>
              <button className="link-button" onClick={() => go('recover')}>Recuperar senha</button>
            </div>
          </div>
        )}

        {tela === 'register' && (
          <div className="auth-form">
            <h2>Novo usuario</h2>
            <form onSubmit={handleRegister}>
              <label>Nome e sobrenome<input value={reg.nome} onChange={e=>setReg({...reg,nome:e.target.value})} placeholder="Nome completo" required /></label>
              <label>CNPJ do prestador<input value={reg.cnpj} onChange={e=>setReg({...reg,cnpj:e.target.value})} placeholder="00.000.000/0000-00" /></label>
              <label>Area de atuacao
                <select value={reg.area_atuacao} onChange={e=>setReg({...reg,area_atuacao:e.target.value})}>
                  <option>Comercial</option>
                  <option>Administrativo</option>
                  <option>Captação</option>
                  <option>Telemarketing</option>
                </select>
              </label>
              <label>E-mail<input type="email" value={reg.email} onChange={e=>setReg({...reg,email:e.target.value})} placeholder="seu@email.com" required /></label>
              <label>Telefone<input value={reg.telefone} onChange={e=>setReg({...reg,telefone:e.target.value})} placeholder="(00) 00000-0000" /></label>
              <label>Senha<input type="password" value={reg.senha} onChange={e=>setReg({...reg,senha:e.target.value})} placeholder="Minimo 6 caracteres" required minLength={6} /></label>
              {error && <div className="error-message">⚠ {error}</div>}
              {success && <div style={{color:'var(--green)',fontSize:13,marginTop:8}}>✓ {success}</div>}
              <button type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Criar acesso'}</button>
            </form>
            <p className="form-note">Se o CNPJ ja estiver na base oficial, o nome sera preenchido automaticamente. Novos consultores podem preencher os dados normalmente.</p>
            <div className="auth-links"><button className="link-button" onClick={() => go('login')}>Voltar ao login</button></div>
          </div>
        )}

        {tela === 'recover' && (
          <div className="auth-form">
            <h2>Recuperar senha</h2>
            <form onSubmit={handleRecover}>
              <label>E-mail cadastrado<input type="email" value={recEmail} onChange={e=>setRecEmail(e.target.value)} placeholder="seu@email.com" required /></label>
              {error && <div className="error-message">⚠ {error}</div>}
              {success && <div style={{color:'var(--green)',fontSize:13,marginTop:8}}>✓ {success}</div>}
              <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Ver orientacao'}</button>
            </form>
            <div className="auth-links"><button className="link-button" onClick={() => go('login')}>Voltar ao login</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
