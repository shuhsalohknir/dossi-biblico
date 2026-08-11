const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'chave-secreta-do-jogo',
  resave: false,
  saveUninitialized: true
}));

const codigos = {
  'NIVEL2-OK': 2,
  'NIVEL3-OK': 3
};

async function loadUsers() {
  try {
    const exists = await fs.pathExists(USERS_FILE);
    if (!exists) {
      await fs.writeJson(USERS_FILE, []);
      return [];
    }
    return await fs.readJson(USERS_FILE);
  } catch (err) {
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeJson(USERS_FILE, users, { spaces: 2 });
}

// Login
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Cadastro
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
  const { email, password, confirm } = req.body;

  if (password !== confirm) {
    return res.send(`
      <div style="background:#0c0a09;color:#fef3c7;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
        <div style="text-align:center;">
          <h2 style="color:#f59e0b;">As senhas não coincidem</h2>
          <a href="/register" style="color:#f59e0b;">Tentar novamente</a>
        </div>
      </div>
    `);
  }

  const users = await loadUsers();
  const exists = users.find(u => u.email === email);

  if (exists) {
    return res.send(`
      <div style="background:#0c0a09;color:#fef3c7;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
        <div style="text-align:center;">
          <h2 style="color:#f59e0b;">Este email já está cadastrado</h2>
          <a href="/" style="color:#f59e0b;">Fazer login</a>
        </div>
      </div>
    `);
  }

  users.push({ email, password, nivelLiberado: 1 });
  await saveUsers(users);

  res.send(`
    <div style="background:#0c0a09;color:#fef3c7;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
      <div style="text-align:center;">
        <h2 style="color:#22c55e;">Conta criada com sucesso!</h2>
        <a href="/" style="color:#f59e0b;">Fazer login</a>
      </div>
    </div>
  `);
});

// Processar Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = await loadUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    req.session.user = user.email;
    req.session.nivelLiberado = user.nivelLiberado || 1;
    res.redirect('/dashboard');
  } else {
    res.send(`
      <div style="background:#0c0a09;color:#fef3c7;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
        <div style="text-align:center;">
          <h2 style="color:#ef4444;">Email ou senha incorretos</h2>
          <a href="/" style="color:#f59e0b;">Tentar novamente</a>
        </div>
      </div>
    `);
  }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  const nivelLiberado = req.session.nivelLiberado || 1;

  function criarNivel(numero, titulo, descricao, link) {
    const liberado = nivelLiberado >= numero;
    const badgeClass = liberado ? 'liberado' : 'bloqueado';
    const badgeText = liberado ? 'Liberado' : 'Bloqueado';
    const btnClass = liberado ? 'btn' : 'btn disabled';
    const href = liberado ? link : '#';

    return `
      <div class="level">
        <div>
          <h3>Caso ${numero} — ${titulo}</h3>
          <p>${descricao}</p>
        </div>
        <div class="level-actions">
          <span class="badge ${badgeClass}">${badgeText}</span>
         <a href="${href}" class="${btnClass}">Investigar</a>
        </div>
      </div>
    `;
  }

  const niveisHTML = 
    criarNivel(1, 'O Restaurador de Ruínas', 'Inicie a investigação bíblica', 'https://aresistencia.my.canva.site/c-pia-de-growing-in-faith-and-spiritual-maturity-is-a-journey-that-begins-today') +
    criarNivel(2, 'A Investigação Continua', 'Aprofunde-se nas escrituras', 'https://aresistencia.my.canva.site/c-pia-de-growing-in-faith-and-spiritual-maturity-is-a-journey-that-begins-today/page-18') +
    criarNivel(3, 'Desafio Final', 'Prove seu conhecimento', '#');

  const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Dossiê Bíblico</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0c0a09;
      background-image: radial-gradient(ellipse at top, #1c1917 0%, #0c0a09 70%);
      color: #fef3c7;
      min-height: 100vh;
    }
    header {
      background: rgba(28, 25, 23, 0.9);
      border-bottom: 1px solid #44403c;
      padding: 18px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    header h1 {
      font-size: 20px;
      color: #f59e0b;
      letter-spacing: 1px;
    }
    header a {
      color: #a8a29e;
      text-decoration: none;
      font-size: 14px;
    }
    header a:hover { color: #f59e0b; }
    .container {
      max-width: 860px;
      margin: 40px auto;
      padding: 0 20px;
    }
    .welcome {
      margin-bottom: 32px;
    }
    .welcome h2 {
      font-size: 26px;
      color: #fef3c7;
      margin-bottom: 6px;
    }
    .welcome p {
      color: #a8a29e;
      font-size: 15px;
    }
    .unlock-box {
      background: rgba(28, 25, 23, 0.9);
      border: 1px solid #44403c;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .unlock-box h3 {
      color: #f59e0b;
      margin-bottom: 14px;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .unlock-form {
      display: flex;
      gap: 12px;
    }
    .unlock-form input {
      flex: 1;
      padding: 13px 16px;
      background: #1c1917;
      border: 1px solid #44403c;
      border-radius: 8px;
      color: #fef3c7;
      font-size: 15px;
    }
    .unlock-form input:focus {
      outline: none;
      border-color: #f59e0b;
    }
    .unlock-form button {
      background: linear-gradient(to right, #d97706, #b45309);
      color: #fffbeb;
      border: none;
      padding: 13px 22px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }
    .unlock-form button:hover {
      background: linear-gradient(to right, #f59e0b, #d97706);
    }
    .levels {
      display: grid;
      gap: 16px;
    }
    .level {
      background: rgba(28, 25, 23, 0.9);
      border: 1px solid #44403c;
      border-radius: 12px;
      padding: 22px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .level h3 {
      font-size: 17px;
      color: #fef3c7;
      margin-bottom: 4px;
    }
    .level p {
      color: #a8a29e;
      font-size: 13px;
    }
    .level-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .badge {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .liberado {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .bloqueado {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
    .btn {
      background: linear-gradient(to right, #d97706, #b45309);
      color: #fffbeb;
      border: none;
      padding: 9px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
    }
    .btn:hover {
      background: linear-gradient(to right, #f59e0b, #d97706);
    }
    .btn.disabled {
      background: #292524;
      color: #78716c;
      cursor: not-allowed;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <header>
    <h1>DOSSIÊ BÍBLICO</h1>
    <a href="/logout">Sair</a>
  </header>

  <div class="container">
    <div class="welcome">
      <h2>Olá, Investigador</h2>
      <p>${req.session.user}</p>
    </div>

    <div class="unlock-box">
      <h3>Liberar próximo caso</h3>
      <form class="unlock-form" action="/unlock" method="POST">
        <input type="text" name="codigo" placeholder="Digite o código da prova" required>
        <button type="submit">Liberar</button>
      </form>
    </div>

    <div class="levels">
      ${niveisHTML}
    </div>
  </div>
</body>
</html>
  `;

  res.send(html);
});

// Liberar nível
app.post('/unlock', async (req, res) => {
  if (!req.session.user) return res.redirect('/');

  const codigo = req.body.codigo.trim().toUpperCase();
  const nivel = codigos[codigo];

  if (nivel) {
    if (nivel > req.session.nivelLiberado) {
      req.session.nivelLiberado = nivel;

      const users = await loadUsers();
      const user = users.find(u => u.email === req.session.user);
      if (user) {
        user.nivelLiberado = nivel;
        await saveUsers(users);
      }

      res.send(`
        <div style="background:#0c0a09;color:#fef3c7;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
          <div style="text-align:center;">
            <h2 style="color:#22c55e;margin-bottom:16px;">Caso ${nivel} liberado com sucesso!</h2>
            <a href="/dashboard" style="color:#f59e0b;">Voltar ao Dashboard</a>
          </div>
        </div>
      `);
    } else {
      res.send(`
        <div style="background:#0c0a09;color:#fef3c7;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
          <div style="text-align:center;">
            <h2 style="margin-bottom:16px;">Este caso já estava liberado.</h2>
            <a href="/dashboard" style="color:#f59e0b;">Voltar ao Dashboard</a>
          </div>
        </div>
      `);
    }
  } else {
    res.send(`
      <div style="background:#0c0a09;color:#fef3c7;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
        <div style="text-align:center;">
          <h2 style="color:#ef4444;margin-bottom:16px;">Código inválido</h2>
          <a href="/dashboard" style="color:#f59e0b;">Tentar novamente</a>
        </div>
      </div>
    `);
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
