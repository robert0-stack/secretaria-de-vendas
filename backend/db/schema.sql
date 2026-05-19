-- SECRETARIA DE VENDAS - SCHEMA COMPLETO

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE,
  senha_hash VARCHAR(200),
  cnpj VARCHAR(20),
  cpf VARCHAR(20),
  telefone VARCHAR(20),
  area_atuacao VARCHAR(50) DEFAULT 'Comercial',
  setor VARCHAR(50) DEFAULT 'Comercial',
  status VARCHAR(20) DEFAULT 'Ativo',
  acesso_criado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissoes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  access_dashboard BOOLEAN DEFAULT true,
  create_sales BOOLEAN DEFAULT false,
  view_own_sales BOOLEAN DEFAULT false,
  view_all_sales BOOLEAN DEFAULT false,
  view_documents BOOLEAN DEFAULT false,
  manage_conference BOOLEAN DEFAULT false,
  change_sale_status BOOLEAN DEFAULT false,
  manage_users BOOLEAN DEFAULT false,
  manage_permissions BOOLEAN DEFAULT false,
  delete_sales BOOLEAN DEFAULT false,
  view_audit BOOLEAN DEFAULT false,
  act_as_captador BOOLEAN DEFAULT false,
  act_as_consultor BOOLEAN DEFAULT false,
  act_as_fechador BOOLEAN DEFAULT false,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS setores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) UNIQUE NOT NULL,
  padrao BOOLEAN DEFAULT false,
  access_dashboard BOOLEAN DEFAULT true,
  create_sales BOOLEAN DEFAULT false,
  view_own_sales BOOLEAN DEFAULT false,
  view_all_sales BOOLEAN DEFAULT false,
  view_documents BOOLEAN DEFAULT false,
  manage_conference BOOLEAN DEFAULT false,
  change_sale_status BOOLEAN DEFAULT false,
  manage_users BOOLEAN DEFAULT false,
  manage_permissions BOOLEAN DEFAULT false,
  delete_sales BOOLEAN DEFAULT false,
  view_audit BOOLEAN DEFAULT false,
  act_as_captador BOOLEAN DEFAULT false,
  act_as_consultor BOOLEAN DEFAULT false,
  act_as_fechador BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas (
  id VARCHAR(100) PRIMARY KEY,
  captador_id VARCHAR(100) REFERENCES users(id),
  consultor_id VARCHAR(100) REFERENCES users(id),
  fechador_id VARCHAR(100) REFERENCES users(id),
  data_venda VARCHAR(20),
  status VARCHAR(50) DEFAULT 'Aguardando conferencia',
  produto VARCHAR(50),
  semana VARCHAR(20),
  valor_unitario DECIMAL(15,2),
  quantidade INTEGER DEFAULT 1,
  valor_total DECIMAL(15,2),
  valor_entrada_total DECIMAL(15,2),
  data_entrada_efetiva VARCHAR(20),
  pagamentos JSONB DEFAULT '[]',
  entrada_restante JSONB DEFAULT '{}',
  saldo JSONB DEFAULT '{}',
  spiff VARCHAR(50),
  brindes TEXT,
  observacoes TEXT,
  obs_admin TEXT,
  segundo_comprador BOOLEAN DEFAULT false,
  drive_folder_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compradores (
  id SERIAL PRIMARY KEY,
  venda_id VARCHAR(100) REFERENCES vendas(id) ON DELETE CASCADE,
  is_segundo BOOLEAN DEFAULT false,
  nome VARCHAR(200),
  email VARCHAR(200),
  telefone1 VARCHAR(20),
  telefone2 VARCHAR(20),
  cpf VARCHAR(20),
  data_nasc VARCHAR(20),
  rg VARCHAR(30),
  orgao_exp VARCHAR(30),
  uf VARCHAR(2),
  estado_civil VARCHAR(30),
  profissao VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS enderecos (
  id SERIAL PRIMARY KEY,
  venda_id VARCHAR(100) REFERENCES vendas(id) ON DELETE CASCADE,
  cep VARCHAR(10),
  logradouro VARCHAR(200),
  numero VARCHAR(20),
  bairro VARCHAR(100),
  cidade_uf VARCHAR(150),
  complemento VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  venda_id VARCHAR(100) REFERENCES vendas(id) ON DELETE CASCADE,
  tipo VARCHAR(100),
  arquivo_path VARCHAR(500),
  arquivo_original VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conferencias (
  id SERIAL PRIMARY KEY,
  venda_id VARCHAR(100) REFERENCES vendas(id) ON DELETE CASCADE UNIQUE,
  admin_id VARCHAR(100) REFERENCES users(id),
  inicio TIMESTAMP,
  termino TIMESTAMP,
  check_bloqueio VARCHAR(20) DEFAULT 'OK',
  check_atendimento VARCHAR(20) DEFAULT 'OK',
  check_doc_cliente VARCHAR(20) DEFAULT 'OK',
  check_comprovante VARCHAR(20) DEFAULT 'OK',
  check_negociacao VARCHAR(20) DEFAULT 'OK',
  check_doc_segundo VARCHAR(20) DEFAULT 'Nao se aplica',
  check_dados_cliente VARCHAR(20) DEFAULT 'OK',
  obs_admin TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atividades (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id),
  tipo VARCHAR(50),
  descricao TEXT,
  venda_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Setores padrão
INSERT INTO setores (nome, padrao, access_dashboard, create_sales, view_own_sales, act_as_captador, act_as_consultor, act_as_fechador)
SELECT 'Comercial', true, true, true, true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM setores WHERE nome='Comercial');

INSERT INTO setores (nome, padrao, access_dashboard, create_sales, view_all_sales, view_documents, manage_conference, change_sale_status, view_audit)
SELECT 'Administrativo', true, true, true, false, true, true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM setores WHERE nome='Administrativo');

INSERT INTO setores (nome, padrao, access_dashboard, create_sales, view_own_sales, view_all_sales, view_documents, manage_conference, change_sale_status, manage_users, manage_permissions, delete_sales, view_audit, act_as_captador, act_as_consultor, act_as_fechador)
SELECT 'ADM', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM setores WHERE nome='ADM');

INSERT INTO setores (nome, padrao, access_dashboard) SELECT 'Captação', false, true WHERE NOT EXISTS (SELECT 1 FROM setores WHERE nome='Captação');
INSERT INTO setores (nome, padrao, access_dashboard) SELECT 'Telemarketing', false, true WHERE NOT EXISTS (SELECT 1 FROM setores WHERE nome='Telemarketing');

-- Admin padrão
INSERT INTO users (id, nome, email, senha_hash, cnpj, cpf, area_atuacao, setor, status, acesso_criado)
SELECT 'u-adm', 'Administrador Geral', 'admin@sistema.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LGGtVHJCxIoFBa.fK',
  '00.000.000/0000-00', '000.000.000-00', 'ADM', 'ADM', 'Ativo', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id='u-adm');

INSERT INTO permissoes (user_id, access_dashboard, create_sales, view_own_sales, view_all_sales, view_documents, manage_conference, change_sale_status, manage_users, manage_permissions, delete_sales, view_audit, act_as_captador, act_as_consultor, act_as_fechador)
SELECT 'u-adm', true, true, true, true, true, true, true, true, true, true, true, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM permissoes WHERE user_id='u-adm');
