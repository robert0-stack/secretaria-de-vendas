const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// AUTH MIDDLEWARE
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    next();
  } catch { res.status(401).json({ error: 'Token invalido' }); }
};

const genId = () => 'u-' + crypto.randomUUID();
const logAtiv = async (user_id, tipo, descricao, venda_id = null) => {
  try { await pool.query('INSERT INTO atividades (user_id, tipo, descricao, venda_id) VALUES ($1,$2,$3,$4)', [user_id, tipo, descricao, venda_id]); } catch {}
};

// ── AUTH ──────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { nome, cnpj, area_atuacao, email, telefone, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha sao obrigatorios' });
  try {
    const existe = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existe.rows.length) return res.status(400).json({ error: 'E-mail ja cadastrado' });
    const senha_hash = await bcrypt.hash(senha, 12);
    const id = genId();
    await pool.query(
      'INSERT INTO users (id,nome,email,senha_hash,cnpj,area_atuacao,setor,status,acesso_criado) VALUES ($1,$2,$3,$4,$5,$6,$6,$7,true)',
      [id, nome, email, senha_hash, cnpj || null, area_atuacao || 'Comercial', 'Ativo']
    );
    // Permissões padrão pelo setor
    const setor = area_atuacao || 'Comercial';
    const s = await pool.query('SELECT * FROM setores WHERE nome=$1', [setor]);
    if (s.rows.length) {
      const st = s.rows[0];
      await pool.query(`INSERT INTO permissoes (user_id,access_dashboard,create_sales,view_own_sales,view_all_sales,view_documents,manage_conference,change_sale_status,manage_users,manage_permissions,delete_sales,view_audit,act_as_captador,act_as_consultor,act_as_fechador)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [id,st.access_dashboard,st.create_sales,st.view_own_sales,st.view_all_sales,st.view_documents,st.manage_conference,st.change_sale_status,st.manage_users,st.manage_permissions,st.delete_sales,st.view_audit,st.act_as_captador,st.act_as_consultor,st.act_as_fechador]);
    } else {
      await pool.query('INSERT INTO permissoes (user_id,access_dashboard,create_sales,view_own_sales,act_as_captador,act_as_consultor,act_as_fechador) VALUES ($1,true,true,true,true,true,true)', [id]);
    }
    await logAtiv(id, 'users', `${nome} criou acesso pela tela inicial.`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const r = await pool.query(
      `SELECT u.*, p.* FROM users u LEFT JOIN permissoes p ON u.id=p.user_id WHERE u.email=$1`, [email]
    );
    if (!r.rows.length) return res.status(401).json({ error: 'E-mail nao encontrado' });
    const u = r.rows[0];
    if (u.status === 'Inativo') return res.status(401).json({ error: 'Usuario inativo' });
    if (!u.senha_hash) return res.status(401).json({ error: 'Este usuario nao tem senha cadastrada. Contate o administrador.' });
    const ok = await bcrypt.compare(senha, u.senha_hash);
    if (!ok) return res.status(401).json({ error: 'Senha incorreta' });
    const token = jwt.sign({ id: u.id, nome: u.nome, area: u.area_atuacao }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
    await logAtiv(u.id, 'access', `${u.nome} acessou o sistema.`);
    const { senha_hash, ...safe } = u;
    res.json({ token, user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/recuperar-senha', async (req, res) => {
  const { email } = req.body;
  try {
    const r = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!r.rows.length) return res.status(404).json({ error: 'E-mail nao encontrado' });
    res.json({ success: true, message: 'Se este e-mail estiver cadastrado, voce recebera as instrucoes.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  const r = await pool.query('SELECT u.*, p.* FROM users u LEFT JOIN permissoes p ON u.id=p.user_id WHERE u.id=$1', [req.user.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Usuario nao encontrado' });
  const { senha_hash, ...safe } = r.rows[0];
  res.json(safe);
});

// ── USERS ────────────────────────────────────────────────────
app.get('/api/users', auth, async (req, res) => {
  const r = await pool.query(`SELECT u.*, p.act_as_captador, p.act_as_consultor, p.act_as_fechador, p.manage_users, p.manage_permissions, p.view_audit, p.access_dashboard, p.create_sales, p.view_own_sales, p.view_all_sales, p.view_documents, p.manage_conference, p.change_sale_status, p.delete_sales FROM users u LEFT JOIN permissoes p ON u.id=p.user_id ORDER BY u.nome`);
  res.json(r.rows);
});

app.get('/api/users/captadores', auth, async (req, res) => {
  const r = await pool.query(`SELECT u.id, u.nome, u.cnpj FROM users u LEFT JOIN permissoes p ON u.id=p.user_id WHERE u.status='Ativo' AND p.act_as_captador=true ORDER BY u.nome`);
  res.json(r.rows);
});

app.get('/api/users/consultores', auth, async (req, res) => {
  const r = await pool.query(`SELECT u.id, u.nome, u.cnpj FROM users u LEFT JOIN permissoes p ON u.id=p.user_id WHERE u.status='Ativo' AND p.act_as_consultor=true ORDER BY u.nome`);
  res.json(r.rows);
});

app.get('/api/users/fechadores', auth, async (req, res) => {
  const r = await pool.query(`SELECT u.id, u.nome, u.cnpj FROM users u LEFT JOIN permissoes p ON u.id=p.user_id WHERE u.status='Ativo' AND p.act_as_fechador=true ORDER BY u.nome`);
  res.json(r.rows);
});

app.post('/api/users', auth, async (req, res) => {
  const { nome, cnpj, cpf, area_atuacao, email, telefone, senha, status } = req.body;
  try {
    const id = genId();
    let senha_hash = null;
    let acesso_criado = false;
    if (senha) { senha_hash = await bcrypt.hash(senha, 12); acesso_criado = true; }
    if (email) {
      const existe = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
      if (existe.rows.length) return res.status(400).json({ error: 'E-mail ja cadastrado' });
    }
    await pool.query(
      'INSERT INTO users (id,nome,cnpj,cpf,area_atuacao,setor,email,telefone,senha_hash,status,acesso_criado) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10)',
      [id, nome, cnpj||null, cpf||null, area_atuacao||'Comercial', email||null, telefone||null, senha_hash, status||'Ativo', acesso_criado]
    );
    const s = await pool.query('SELECT * FROM setores WHERE nome=$1', [area_atuacao||'Comercial']);
    if (s.rows.length) {
      const st = s.rows[0];
      await pool.query(`INSERT INTO permissoes (user_id,access_dashboard,create_sales,view_own_sales,view_all_sales,view_documents,manage_conference,change_sale_status,manage_users,manage_permissions,delete_sales,view_audit,act_as_captador,act_as_consultor,act_as_fechador)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [id,st.access_dashboard,st.create_sales,st.view_own_sales,st.view_all_sales,st.view_documents,st.manage_conference,st.change_sale_status,st.manage_users,st.manage_permissions,st.delete_sales,st.view_audit,st.act_as_captador,st.act_as_consultor,st.act_as_fechador]);
    } else {
      await pool.query('INSERT INTO permissoes (user_id) VALUES ($1)', [id]);
    }
    await logAtiv(req.user.id, 'users', `${nome} foi criado como ${area_atuacao||'Comercial'}.`);
    res.json({ success: true, id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', auth, async (req, res) => {
  const { nome, cnpj, cpf, area_atuacao, email, telefone, status, senha } = req.body;
  try {
    if (senha) {
      const h = await bcrypt.hash(senha, 12);
      await pool.query('UPDATE users SET nome=$1,cnpj=$2,cpf=$3,area_atuacao=$4,setor=$4,email=$5,telefone=$6,status=$7,senha_hash=$8,acesso_criado=true WHERE id=$9',
        [nome, cnpj||null, cpf||null, area_atuacao, email||null, telefone||null, status, h, req.params.id]);
    } else {
      await pool.query('UPDATE users SET nome=$1,cnpj=$2,cpf=$3,area_atuacao=$4,setor=$4,email=$5,telefone=$6,status=$7 WHERE id=$8',
        [nome, cnpj||null, cpf||null, area_atuacao, email||null, telefone||null, status, req.params.id]);
    }
    await logAtiv(req.user.id, 'users', `${nome} foi atualizado.`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id/toggle', auth, async (req, res) => {
  const r = await pool.query('SELECT status, nome FROM users WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Usuario nao encontrado' });
  const novo = r.rows[0].status === 'Ativo' ? 'Inativo' : 'Ativo';
  await pool.query('UPDATE users SET status=$1 WHERE id=$2', [novo, req.params.id]);
  await logAtiv(req.user.id, 'users', `${r.rows[0].nome} foi ${novo === 'Inativo' ? 'inativado' : 'reativado'}.`);
  res.json({ success: true, status: novo });
});

app.delete('/api/users/:id', auth, async (req, res) => {
  const r = await pool.query('SELECT nome FROM users WHERE id=$1', [req.params.id]);
  if (r.rows.length) await logAtiv(req.user.id, 'users', `${r.rows[0].nome} foi excluido.`);
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});

// ── PERMISSÕES ───────────────────────────────────────────────
app.get('/api/permissoes/:user_id', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM permissoes WHERE user_id=$1', [req.params.user_id]);
  res.json(r.rows[0] || {});
});

app.put('/api/permissoes/:user_id', auth, async (req, res) => {
  const p = req.body;
  await pool.query(`INSERT INTO permissoes (user_id,access_dashboard,create_sales,view_own_sales,view_all_sales,view_documents,manage_conference,change_sale_status,manage_users,manage_permissions,delete_sales,view_audit,act_as_captador,act_as_consultor,act_as_fechador)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (user_id) DO UPDATE SET access_dashboard=$2,create_sales=$3,view_own_sales=$4,view_all_sales=$5,view_documents=$6,manage_conference=$7,change_sale_status=$8,manage_users=$9,manage_permissions=$10,delete_sales=$11,view_audit=$12,act_as_captador=$13,act_as_consultor=$14,act_as_fechador=$15`,
    [req.params.user_id,p.access_dashboard,p.create_sales,p.view_own_sales,p.view_all_sales,p.view_documents,p.manage_conference,p.change_sale_status,p.manage_users,p.manage_permissions,p.delete_sales,p.view_audit,p.act_as_captador,p.act_as_consultor,p.act_as_fechador]);
  await logAtiv(req.user.id, 'users', `Permissoes do usuario #${req.params.user_id} foram atualizadas.`);
  res.json({ success: true });
});

// ── SETORES ──────────────────────────────────────────────────
app.get('/api/setores', auth, async (req, res) => {
  const r = await pool.query('SELECT s.*, (SELECT COUNT(*) FROM users WHERE setor=s.nome) as usuarios FROM setores s ORDER BY s.id');
  res.json(r.rows);
});

app.post('/api/setores', auth, async (req, res) => {
  const { nome } = req.body;
  try {
    const r = await pool.query('INSERT INTO setores (nome) VALUES ($1) RETURNING *', [nome]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/setores/:nome/permissoes', auth, async (req, res) => {
  const p = req.body;
  await pool.query(`UPDATE setores SET access_dashboard=$1,create_sales=$2,view_own_sales=$3,view_all_sales=$4,view_documents=$5,manage_conference=$6,change_sale_status=$7,manage_users=$8,manage_permissions=$9,delete_sales=$10,view_audit=$11,act_as_captador=$12,act_as_consultor=$13,act_as_fechador=$14 WHERE nome=$15`,
    [p.access_dashboard,p.create_sales,p.view_own_sales,p.view_all_sales,p.view_documents,p.manage_conference,p.change_sale_status,p.manage_users,p.manage_permissions,p.delete_sales,p.view_audit,p.act_as_captador,p.act_as_consultor,p.act_as_fechador,req.params.nome]);
  res.json({ success: true });
});

app.delete('/api/setores/:nome', auth, async (req, res) => {
  await pool.query('DELETE FROM setores WHERE nome=$1 AND padrao=false', [req.params.nome]);
  res.json({ success: true });
});

// ── VENDAS ───────────────────────────────────────────────────
const docFields = [
  { name: 'ficha_bloqueio', maxCount: 1 }, { name: 'ficha_atendimento', maxCount: 1 },
  { name: 'documento_cliente', maxCount: 1 }, { name: 'comprovante', maxCount: 1 },
  { name: 'negociacao', maxCount: 1 }, { name: 'documento_segundo', maxCount: 1 }
];

app.post('/api/vendas', auth, upload.fields(docFields), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const d = JSON.parse(req.body.dados);
    const vid = 's-' + crypto.randomUUID();

    await client.query(`INSERT INTO vendas (id,captador_id,consultor_id,fechador_id,data_venda,produto,semana,valor_unitario,quantidade,valor_total,valor_entrada_total,data_entrada_efetiva,pagamentos,entrada_restante,saldo,spiff,brindes,observacoes,segundo_comprador)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [vid,d.captador_id||null,d.consultor_id||null,d.fechador_id||null,d.data_venda,d.produto,d.semana,
       d.valor_unitario,d.quantidade||1,d.valor_total,d.valor_entrada_total,d.data_entrada_efetiva,
       JSON.stringify(d.pagamentos||[]),JSON.stringify(d.entrada_restante||{}),JSON.stringify(d.saldo||{}),
       d.spiff||null,d.brindes||null,d.observacoes||null,d.tem_segundo||false]);

    await client.query(`INSERT INTO compradores (venda_id,is_segundo,nome,email,telefone1,telefone2,cpf,data_nasc,rg,orgao_exp,uf,estado_civil,profissao)
      VALUES ($1,false,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [vid,d.c1_nome,d.c1_email,d.c1_tel1,d.c1_tel2,d.c1_cpf,d.c1_nasc,d.c1_rg,d.c1_orgao,d.c1_uf,d.c1_estado_civil,d.c1_profissao]);

    if (d.tem_segundo && d.c2_nome) {
      await client.query(`INSERT INTO compradores (venda_id,is_segundo,nome,email,telefone1,telefone2,cpf,data_nasc,rg,orgao_exp,uf,estado_civil,profissao)
        VALUES ($1,true,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [vid,d.c2_nome,d.c2_email,d.c2_tel1,d.c2_tel2,d.c2_cpf,d.c2_nasc,d.c2_rg,d.c2_orgao,d.c2_uf,d.c2_estado_civil,d.c2_profissao]);
    }

    await client.query('INSERT INTO enderecos (venda_id,cep,logradouro,numero,bairro,cidade_uf,complemento) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [vid,d.cep,d.logradouro,d.numero,d.bairro,d.cidade_uf,d.complemento]);

    const tiposDoc = ['ficha_bloqueio','ficha_atendimento','documento_cliente','comprovante','negociacao','documento_segundo'];
    for (const tipo of tiposDoc) {
      if (req.files?.[tipo]) {
        const f = req.files[tipo][0];
        await client.query('INSERT INTO documentos (venda_id,tipo,arquivo_path,arquivo_original) VALUES ($1,$2,$3,$4)',
          [vid, tipo, f.filename, f.originalname]);
      }
    }

    const nomeComprador = d.c1_nome || 'cliente';
    await logAtiv(req.user.id, 'sales', `Venda de ${nomeComprador} enviada para conferencia.`, vid);
    await client.query('COMMIT');
    res.json({ success: true, venda_id: vid });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.get('/api/vendas', auth, async (req, res) => {
  const { status } = req.query;
  let q = `SELECT v.*, c1.nome as comprador_nome, c1.email as comprador_email, c1.telefone1 as comprador_tel,
    uc.nome as captador_nome, uc.cnpj as captador_cnpj,
    ucons.nome as consultor_nome, ucons.cnpj as consultor_cnpj,
    ufec.nome as fechador_nome, ufec.cnpj as fechador_cnpj
    FROM vendas v
    LEFT JOIN compradores c1 ON c1.venda_id=v.id AND c1.is_segundo=false
    LEFT JOIN users uc ON uc.id=v.captador_id
    LEFT JOIN users ucons ON ucons.id=v.consultor_id
    LEFT JOIN users ufec ON ufec.id=v.fechador_id WHERE 1=1`;
  const params = [];
  if (status && status !== 'todos') { params.push(status); q += ` AND v.status=$${params.length}`; }
  q += ' ORDER BY v.created_at DESC';
  res.json((await pool.query(q, params)).rows);
});

app.get('/api/vendas/minhas', auth, async (req, res) => {
  const { status } = req.query;
  let q = `SELECT v.*, c1.nome as comprador_nome, uc.nome as captador_nome, ucons.nome as consultor_nome, ufec.nome as fechador_nome
    FROM vendas v
    LEFT JOIN compradores c1 ON c1.venda_id=v.id AND c1.is_segundo=false
    LEFT JOIN users uc ON uc.id=v.captador_id
    LEFT JOIN users ucons ON ucons.id=v.consultor_id
    LEFT JOIN users ufec ON ufec.id=v.fechador_id
    WHERE (v.captador_id=$1 OR v.consultor_id=$1 OR v.fechador_id=$1)`;
  const params = [req.user.id];
  if (status && status !== 'todos') { params.push(status); q += ` AND v.status=$${params.length}`; }
  q += ' ORDER BY v.created_at DESC';
  res.json((await pool.query(q, params)).rows);
});

app.get('/api/vendas/:id', auth, async (req, res) => {
  const [venda, compradores, endereco, docs, conf] = await Promise.all([
    pool.query(`SELECT v.*, uc.nome as captador_nome, uc.cnpj as captador_cnpj, ucons.nome as consultor_nome, ucons.cnpj as consultor_cnpj, ufec.nome as fechador_nome, ufec.cnpj as fechador_cnpj FROM vendas v LEFT JOIN users uc ON uc.id=v.captador_id LEFT JOIN users ucons ON ucons.id=v.consultor_id LEFT JOIN users ufec ON ufec.id=v.fechador_id WHERE v.id=$1`, [req.params.id]),
    pool.query('SELECT * FROM compradores WHERE venda_id=$1 ORDER BY is_segundo', [req.params.id]),
    pool.query('SELECT * FROM enderecos WHERE venda_id=$1 LIMIT 1', [req.params.id]),
    pool.query('SELECT * FROM documentos WHERE venda_id=$1', [req.params.id]),
    pool.query('SELECT * FROM conferencias WHERE venda_id=$1 LIMIT 1', [req.params.id])
  ]);
  if (!venda.rows.length) return res.status(404).json({ error: 'Venda nao encontrada' });
  res.json({ venda: venda.rows[0], compradores: compradores.rows, endereco: endereco.rows[0]||{}, documentos: docs.rows, conferencia: conf.rows[0]||{} });
});

app.delete('/api/vendas/:id', auth, async (req, res) => {
  const r = await pool.query('SELECT id FROM vendas WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Venda nao encontrada' });
  await pool.query('DELETE FROM vendas WHERE id=$1', [req.params.id]);
  await logAtiv(req.user.id, 'sales', `Venda ${req.params.id} foi excluida.`, req.params.id);
  res.json({ success: true });
});

// Reenviar doc
app.post('/api/vendas/:id/documentos', auth, upload.single('arquivo'), async (req, res) => {
  const { tipo } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' });
  await pool.query('DELETE FROM documentos WHERE venda_id=$1 AND tipo=$2', [req.params.id, tipo]);
  await pool.query('INSERT INTO documentos (venda_id,tipo,arquivo_path,arquivo_original) VALUES ($1,$2,$3,$4)',
    [req.params.id, tipo, req.file.filename, req.file.originalname]);
  res.json({ success: true });
});

// ── CONFERÊNCIA ──────────────────────────────────────────────
app.post('/api/conferencias', auth, async (req, res) => {
  const { venda_id, inicio, termino, check_bloqueio, check_atendimento, check_doc_cliente, check_comprovante, check_negociacao, check_doc_segundo, check_dados_cliente, status, obs_admin } = req.body;
  try {
    await pool.query(`INSERT INTO conferencias (venda_id,admin_id,inicio,termino,check_bloqueio,check_atendimento,check_doc_cliente,check_comprovante,check_negociacao,check_doc_segundo,check_dados_cliente,obs_admin)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (venda_id) DO UPDATE SET admin_id=$2,inicio=COALESCE($3,conferencias.inicio),termino=COALESCE($4,conferencias.termino),check_bloqueio=$5,check_atendimento=$6,check_doc_cliente=$7,check_comprovante=$8,check_negociacao=$9,check_doc_segundo=$10,check_dados_cliente=$11,obs_admin=$12,updated_at=NOW()`,
      [venda_id,req.user.id,inicio||null,termino||null,check_bloqueio||'OK',check_atendimento||'OK',check_doc_cliente||'OK',check_comprovante||'OK',check_negociacao||'OK',check_doc_segundo||'Nao se aplica',check_dados_cliente||'OK',obs_admin||null]);
    if (status) {
      const old = await pool.query('SELECT status, id FROM vendas WHERE id=$1', [venda_id]);
      if (old.rows.length) {
        const v = old.rows[0];
        await pool.query('UPDATE vendas SET status=$1, obs_admin=$2, updated_at=NOW() WHERE id=$3', [status, obs_admin||null, venda_id]);
        if (v.status !== status) await logAtiv(req.user.id, 'conference', `Status alterado\n${v.comprador_nome || venda_id}: ${v.status} -> ${status}.`, venda_id);
      }
    }
    await logAtiv(req.user.id, 'conference', `Conferencia salva.`, venda_id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RELATÓRIOS / ATIVIDADES ──────────────────────────────────
app.get('/api/relatorios/dashboard', auth, async (req, res) => {
  const [total, aprovadas, pendentes, reprovadas, porUsuario, resumoVendas] = await Promise.all([
    pool.query('SELECT COUNT(*) as total FROM vendas'),
    pool.query("SELECT COUNT(*) as total FROM vendas WHERE status='Aprovado'"),
    pool.query("SELECT COUNT(*) as total FROM vendas WHERE status NOT IN ('Aprovado','Reprovado','Finalizado')"),
    pool.query("SELECT COUNT(*) as total FROM vendas WHERE status='Reprovado'"),
    pool.query(`SELECT u.nome, COUNT(v.id) as total_vendas FROM users u
      LEFT JOIN vendas v ON (v.captador_id=u.id OR v.consultor_id=u.id OR v.fechador_id=u.id)
      WHERE u.status='Ativo' GROUP BY u.id,u.nome HAVING COUNT(v.id)>0 ORDER BY total_vendas DESC LIMIT 10`),
    pool.query(`SELECT v.*, c1.nome as comprador_nome FROM vendas v
      LEFT JOIN compradores c1 ON c1.venda_id=v.id AND c1.is_segundo=false ORDER BY v.created_at DESC LIMIT 50`)
  ]);
  res.json({ total: total.rows[0].total, aprovadas: aprovadas.rows[0].total, pendentes: pendentes.rows[0].total, reprovadas: reprovadas.rows[0].total, porUsuario: porUsuario.rows, resumoVendas: resumoVendas.rows });
});

app.get('/api/relatorios/atividades', auth, async (req, res) => {
  const { data_inicial, data_final, setor, user_id, tipo } = req.query;
  let q = `SELECT a.*, u.nome as user_nome, u.area_atuacao FROM atividades a LEFT JOIN users u ON u.id=a.user_id WHERE 1=1`;
  const params = []; let i = 1;
  if (data_inicial) { q += ` AND a.created_at >= $${i++}`; params.push(data_inicial); }
  if (data_final) { q += ` AND a.created_at <= $${i++}`; params.push(data_final + ' 23:59:59'); }
  if (user_id && user_id !== 'todos') { q += ` AND a.user_id=$${i++}`; params.push(user_id); }
  if (setor && setor !== 'todos') { q += ` AND u.setor=$${i++}`; params.push(setor); }
  if (tipo && tipo !== 'todos') { q += ` AND a.tipo=$${i++}`; params.push(tipo); }
  q += ' ORDER BY a.created_at DESC LIMIT 500';
  const r = await pool.query(q, params);
  // Métricas
  const acessos = r.rows.filter(x=>x.tipo==='access').length;
  const vendas = r.rows.filter(x=>x.tipo==='sales').length;
  const conferencias = r.rows.filter(x=>x.tipo==='conference').length;
  const documentos = r.rows.filter(x=>x.tipo==='documents').length;
  // Ranking
  const rankMap = {};
  r.rows.forEach(a => {
    if (!rankMap[a.user_id]) rankMap[a.user_id] = { nome: a.user_nome, area: a.area_atuacao, acessos:0, vendas:0, conferencias:0, docs:0 };
    if (a.tipo==='access') rankMap[a.user_id].acessos++;
    if (a.tipo==='sales') rankMap[a.user_id].vendas++;
    if (a.tipo==='conference') rankMap[a.user_id].conferencias++;
    if (a.tipo==='documents') rankMap[a.user_id].docs++;
  });
  const ranking = Object.values(rankMap).sort((a,b)=>(b.acessos+b.vendas+b.conferencias)-(a.acessos+a.vendas+a.conferencias));
  res.json({ atividades: r.rows, metricas: { acessos, vendas, conferencias, documentos }, ranking });
});

app.get('/api/relatorios/auditoria', auth, async (req, res) => {
  const r = await pool.query(`SELECT a.*, u.nome as user_nome FROM atividades a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 200`);
  res.json(r.rows);
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

async function start() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Banco inicializado');
  } catch (e) { console.error('⚠️ Erro DB:', e.message); }
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Porta ${PORT}`));
}
start();
