# 🏢 Secretaria de Vendas

Sistema completo de gestão de vendas com Node.js + PostgreSQL + React.

---

## 🚀 Deploy no Render.com (Passo a Passo)

### 1. Criar conta e repositório
1. Crie uma conta em [render.com](https://render.com)
2. Crie um repositório no GitHub e envie este projeto:
   ```bash
   git init
   git add .
   git commit -m "primeiro commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/secretaria-vendas.git
   git push -u origin main
   ```

### 2. Criar o Banco de Dados PostgreSQL
1. No painel Render → **New** → **PostgreSQL**
2. Nome: `secretaria-vendas-db`
3. Plano: **Free**
4. Clique em **Create Database**
5. Copie a **Internal Database URL**

### 3. Deploy do Backend
1. **New** → **Web Service**
2. Conecte seu repositório GitHub
3. Configurações:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Variáveis de ambiente:
   - `DATABASE_URL` → Cole a URL do banco
   - `JWT_SECRET` → Qualquer string longa e aleatória (ex: `minha_chave_super_secreta_123abc`)
   - `NODE_ENV` → `production`
5. Clique em **Create Web Service**
6. Aguarde o deploy. Copie a URL gerada (ex: `https://secretaria-vendas-backend.onrender.com`)

### 4. Deploy do Frontend
1. **New** → **Static Site**
2. Conecte o mesmo repositório
3. Configurações:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Variável de ambiente:
   - `VITE_API_URL` → URL do backend + `/api` (ex: `https://secretaria-vendas-backend.onrender.com/api`)
5. Clique em **Create Static Site**

### 5. Criar primeiro usuário Admin
Após o deploy do backend, acesse:
```
https://SEU-BACKEND.onrender.com/api
```
Use o formulário de cadastro no frontend e depois acesse o banco no painel Render para dar permissão de admin ao primeiro usuário:
```sql
UPDATE permissoes SET pode_admin=true, pode_conferir=true, pode_visualizar=true WHERE user_id=1;
```

---

## 💻 Rodar Localmente

### Backend
```bash
cd backend
cp .env.example .env
# Edite .env com sua DATABASE_URL local
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📋 Funcionalidades

- ✅ Autenticação JWT com permissões por área
- ✅ Cadastro completo de vendas (2 compradores, endereço, produto, pagamentos)
- ✅ Upload de até 6 documentos por venda
- ✅ Busca de CEP automática via ViaCEP
- ✅ Painel administrativo com checklist de conferência
- ✅ Geração de mensagem WhatsApp
- ✅ Gestão de usuários e permissões
- ✅ Cadastro de produtos e tipos personalizados
- ✅ Relatório de atividades com filtros
- ✅ Dashboard com ranking e estatísticas

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Banco | PostgreSQL |
| Auth | JWT + bcrypt |
| Upload | Multer |
| Deploy | Render.com |

---

## 📂 Estrutura

```
secretaria-vendas/
├── backend/
│   ├── db/schema.sql      # Schema do banco (auto-executado)
│   ├── server.js          # API completa
│   ├── .env.example       # Variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # Dashboard, NovaVenda, AdminPanel...
│   │   ├── components/    # Layout (Sidebar)
│   │   ├── App.jsx        # Roteamento e contexto de auth
│   │   ├── api.js         # Cliente HTTP
│   │   └── index.css      # Design system completo
│   └── package.json
├── render.yaml            # Config de deploy automático
└── README.md
```
