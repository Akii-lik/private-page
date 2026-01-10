const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PASSWORD = '367208';
const DB_FILE = './data.json';

/* ---------- 工具 ---------- */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { checkin: {}, articles: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { checkin: {}, articles: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ---------- 页面 ---------- */
app.get('/', (req, res) => {
  const db = loadDB();
  const days = Object.keys(db.checkin).sort();
  const recent3 = days.slice(-3);

  const recentHTML = recent3.map(d => `
    <div class="glass card">
      <div class="small">${d}</div>
      <pre>${db.checkin[d]}</pre>
    </div>
  `).join('');

  const allHTML = days.map(d => `
    <div class="glass card">
      <div class="small">${d}</div>
      <pre>${db.checkin[d]}</pre>
    </div>
  `).join('');

  const articlesHTML = db.articles.map((a, i) => `
    <div class="glass card clickable" onclick="openArticle(${i})">
      <h4>${a.title}</h4>
      <div class="small">${a.date}</div>
    </div>
  `).join('');

  res.send(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>我的玻璃博客</title>
<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC";
  background: linear-gradient(120deg,#c7e5ff,#fce7f3);
}
.container {
  max-width: 820px;
  margin: auto;
  padding: 24px;
}
.glass {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(18px);
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.card {
  padding: 16px;
  margin-bottom: 16px;
}
.small {
  font-size: 12px;
  color: #555;
}
button {
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
}
.clickable { cursor: pointer; }
.hidden { display:none; }
textarea, input {
  width: 100%;
  border-radius: 12px;
  border: none;
  padding: 10px;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display:none;
  align-items:center;
  justify-content:center;
}
.modal {
  width: 320px;
}
</style>
</head>

<body>
<div class="container">

  <div class="glass card">
    <h2>🖼 图片展示</h2>
    < img src="https://placekitten.com/800/300" style="width:100%;border-radius:14px">
  </div>

  <div class="glass card">
    <h2>📅 三日打卡</h2>
    ${recentHTML}
    <button onclick="toggleAll()">查看全部</button>
    <div id="all" class="hidden">${allHTML}</div>

    <textarea id="checkin"></textarea>
    <button onclick="edit('checkin')">✏ 编辑</button>
  </div>

  <div class="glass card">
    <h2>📚 文章记录</h2>
    ${articlesHTML}
    <button onclick="edit('article')">✏ 新文章</button>
  </div>

</div>

<div class="overlay" id="overlay">
  <div class="glass modal card">
    <input id="pwd" placeholder="输入密码">
    <button onclick="confirm()">确认</button>
  </div>
</div>

<script>
let mode = '';

function toggleAll() {
  document.getElementById('all').classList.toggle('hidden');
}

function edit(m) {
  if(m === 'article'){
    location.href = '/editor';
  }else{
    mode = m;
    document.getElementById('overlay').style.display='flex';
  }
}

function confirm() {
  fetch('/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pwd: document.getElementById('pwd').value.trim(),
      text: document.getElementById('checkin').value
    })
  }).then(r => {
    if (r.ok) location.reload();
    else alert('密码错误');
  });
}

function openArticle(i){
  location.href='/article/'+i;
}
</script>
</body>
</html>`);
});

app.get('/editor', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>写文章</title>
<style>
body{
  margin:0;
  font-family:-apple-system;
  background:linear-gradient(120deg,#c7e5ff,#fce7f3);
}
.glass{
  background:rgba(255,255,255,.6);
  backdrop-filter:blur(20px);
  border-radius:18px;
  padding:20px;
  max-width:700px;
  margin:40px auto;
}
input,textarea{
  width:100%;
  border:none;
  border-radius:12px;
  padding:12px;
  margin-bottom:12px;
}
button{
  border:none;
  padding:10px 16px;
  border-radius:12px;
  cursor:pointer;
}
</style>
</head>
<body>

<div class="glass">
  <h2>✍ 写文章</h2>
  <input id="title" placeholder="文章标题">
  <textarea id="content" rows="10" placeholder="正文内容"></textarea>
  <input id="pwd" placeholder="密码">
  <button onclick="save()">保存</button>
</div>

<script>
function save(){
  fetch('/article', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      title: title.value,
      content: content.value,
      pwd: pwd.value
    })
  }).then(r=>{
    if(r.ok){
      location.href='/';
    }else{
      alert('密码错误');
    }
  });
}
</script>

</body>
</html>
`);
});

/* ---------- 接口 ---------- */
app.post('/article', (req, res) => {
  // ⭐ 统一密码校验（和三日打卡一模一样）
  if (String(req.body.pwd || '').trim() !== PASSWORD) {
    return res.status(403).send('密码错误');
  }

  const db = loadDB();

  db.articles.unshift({
    title: req.body.title || '无标题',
    content: req.body.content || '',
    date: today()
  });

  saveDB(db);
  res.sendStatus(200);
});

app.get('/article/:id',(req,res)=>{
  const db = loadDB();
  const a = db.articles[req.params.id];
  if(!a) return res.send('Not found');
  res.send(`<h1>${a.title}</h1><pre>${a.content}</pre>`);
});

/* ---------- 启动 ---------- */
app.listen(PORT,'0.0.0.0',()=>{
  console.log('Server running on',PORT);
});
