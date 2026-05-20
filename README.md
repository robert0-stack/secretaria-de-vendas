# 📋 Secretaria de Vendas

Sistema completo de gestão de vendas com Node.js + PostgreSQL + React.

---

## 🚀 Deploy completo no Render.com — Passo a Passo

### PASSO 1 — Instalar o Git

1. Acesse **https://git-scm.com/downloads**
2. Baixe e instale o Git para seu sistema operacional
3. Após instalar, abra o terminal (CMD ou PowerShell no Windows) e confirme:
   ```
   git --version
   ```
   Deve aparecer algo como `git version 2.x.x`

---

### PASSO 2 — Criar conta no GitHub

1. Acesse **https://github.com**
2. Clique em **Sign up**
3. Crie sua conta com e-mail e senha
4. Confirme o e-mail recebido

---

### PASSO 3 — Criar repositório no GitHub

1. Estando logado no GitHub, clique no botão **+** (canto superior direito)
2. Clique em **New repository**
3. Configure:
   - **Repository name:** `secretaria-vendas`
   - **Visibility:** Public
   - **NÃO marque** nenhuma opção adicional (sem README, sem .gitignore)
4. Clique em **Create repository**
5. Copie a URL do repositório que aparece (ex: `https://github.com/SEU_USUARIO/secretaria-vendas.git`)

---

### PASSO 4 — Enviar o projeto para o GitHub

1. Extraia o arquivo `secretaria-vendas-v3.zip` em uma pasta no seu computador
2. Abra o terminal **dentro dessa pasta** (no Windows: clique com botão direito → "Abrir no Terminal")
3. Rode os comandos abaixo um por um:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/secretaria-vendas.git
git push -u origin main
```

> ⚠️ Substitua `SEU_USUARIO` pelo seu usuário do GitHub.
> O Git pode pedir seu usuário e senha do GitHub.

4. Acesse seu repositório no GitHub e confirme que os arquivos apareceram.

---

### PASSO 5 — Criar conta no Render

1. Acesse **https://render.com**
2. Clique em **Get Started for Free**
3. Clique em **Continue with GitHub** (conecta direto com sua conta — mais fácil)
4. Autorize o Render a acessar sua conta GitHub

---

### PASSO 6 — Criar o Banco de Dados PostgreSQL

1. No painel do Render, clique em **New +**
2. Escolha **PostgreSQL**
3. Configure:
   - **Name:** `secretaria-vendas-db`
   - **Region:** Oregon (US West) — gratuito
   - **Plan:** Free
4. Clique em **Create Database**
5. Aguarde criar (pode levar 1-2 minutos)
6. Quando estiver pronto, clique no banco e copie a **Internal Database URL**
   - Parece com: `postgresql://user:senha@host/secretaria_vendas`
   - Guarde essa URL, vai usar no próximo passo

---

### PASSO 7 — Deploy do Backend (API)

1. No painel do Render, clique em **New +**
2. Escolha **Web Service**
3. Clique em **Connect a repository** e selecione `secretaria-vendas`
4. Configure:
   - **Name:** `secretaria-vendas-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Role para baixo até **Environment Variables** e adicione:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Cole a Internal Database URL do Passo 6 |
   | `JWT_SECRET` | Qualquer texto longo e aleatório (ex: `minha_chave_secreta_super_segura_2024_abc123xyz`) |
   | `NODE_ENV` | `production` |

6. Clique em **Create Web Service**
7. Aguarde o deploy (5-10 minutos na primeira vez)
8. Quando aparecer **Live** na tela, copie a URL do backend
   - Parece com: `https://secretaria-vendas-backend.onrender.com`

---

### PASSO 8 — Deploy do Frontend (Interface)

1. No painel do Render, clique em **New +**
2. Escolha **Static Site**
3. Selecione o repositório `secretaria-vendas`
4. Configure:
   - **Name:** `secretaria-vendas-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Role para baixo até **Environment Variables** e adicione:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | URL do backend + `/api` (ex: `https://secretaria-vendas-backend.onrender.com/api`) |

6. Clique em **Create Static Site**
7. Aguarde o build (3-5 minutos)
8. Quando aparecer **Live**, clique na URL — seu sistema está no ar! 🎉

---

### PASSO 9 — Dar permissão de Admin ao primeiro usuário

Após o deploy, o sistema já tem um usuário admin padrão:

- **E-mail:** `admin@sistema.com`
- **Senha:** `admin123`

> ⚠️ **Troque a senha imediatamente após o primeiro acesso!**

Para criar outros administradores, acesse o painel do banco no Render:

1. No painel do Render, clique no banco `secretaria-vendas-db`
2. Clique em **Connect** → **External Connection**
3. Use um cliente como **DBeaver** ou **TablePlus** com as credenciais mostradas
4. Execute o SQL abaixo para dar admin a um usuário já cadastrado:

```sql
-- Descobrir o ID do usuário pelo e-mail
SELECT id, nome, email FROM users WHERE email = 'email@dosusuario.com';

-- Dar permissão de admin
UPDATE permissoes SET
  access_dashboard = true,
  create_sales = true,
  view_own_sales = true,
  view_all_sales = true,
  view_documents = true,
  manage_conference = true,
  change_sale_status = true,
  manage_users = true,
  manage_permissions = true,
  delete_sales = true,
  view_audit = true,
  act_as_captador = true,
  act_as_consultor = true,
  act_as_fechador = true
WHERE user_id = 'ID_DO_USUARIO';
```

---

## 💻 Rodar localmente (desenvolvimento)

### Pré-requisitos
- Node.js 18 ou superior
- PostgreSQL instalado localmente

### Backend
```bash
cd backend
cp .env.example .env
# Edite o .env com sua DATABASE_URL local
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

---

## 📋 Páginas do sistema

| Página | Descrição | Acesso |
|--------|-----------|--------|
| Dashboard | Visão geral, resumo de vendas e ranking | Todos |
| Cadastro de vendas | Formulário completo com documentos | Comercial |
| Minhas vendas | Acompanhar vendas do próprio usuário | Comercial |
| Documentos de vendas | Conferência, checklist e status | Administrativo |
| Usuarios | Cadastro e gerenciamento de usuários | ADM |
| Permissoes | Controle de acesso por usuário e setor | ADM |
| Historico de Atividade | Relatório com ranking e métricas | ADM |
| Auditoria | Log completo de todas as ações | ADM |

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Banco de dados | PostgreSQL |
| Autenticação | JWT + bcrypt |
| Upload de arquivos | Multer |
| Busca de CEP | ViaCEP (API gratuita) |
| Deploy | Render.com (plano gratuito) |

---

## 📂 Estrutura do projeto

```
secretaria-vendas/
├── backend/
│   ├── db/
│   │   └── schema.sql        # Banco criado automaticamente
│   ├── uploads/              # Documentos enviados (gerado automaticamente)
│   ├── server.js             # API completa
│   ├── .env.example          # Modelo de variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CadastroVendas.jsx
│   │   │   ├── MinhasVendas.jsx
│   │   │   ├── DocumentosVendas.jsx
│   │   │   ├── Usuarios.jsx
│   │   │   ├── Permissoes.jsx
│   │   │   ├── HistoricoAtividade.jsx
│   │   │   └── Auditoria.jsx
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── render.yaml               # Config de deploy automático
└── README.md
```

---

## ⚠️ Observações importantes

- No plano **gratuito do Render**, o backend "adormece" após 15 minutos sem uso. O primeiro acesso após esse período pode demorar 30-60 segundos para acordar.
- O banco de dados gratuito tem limite de **1GB** de armazenamento.
- Os arquivos de upload são armazenados no servidor — no plano gratuito do Render eles são **apagados a cada deploy**. Para produção, considere usar o **Cloudinary** ou **AWS S3** para armazenar os documentos.

---

## 🆘 Problemas comuns

**Backend não inicia:**
- Verifique se a `DATABASE_URL` está correta nas variáveis de ambiente
- Veja os logs no painel do Render → clique no serviço → aba **Logs**

**Frontend não conecta na API:**
- Verifique se a `VITE_API_URL` termina com `/api`
- Confirme que o backend está com status **Live**

**Erro de CORS:**
- O backend já está configurado para aceitar qualquer origem. Se persistir, verifique se a URL da API está correta no frontend.

**Upload de documentos não funciona:**
- O diretório `uploads/` é criado automaticamente. Verifique os logs do backend.
