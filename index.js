const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PASSWORD = '367208';
const DB_FILE = '/data/data.json'; // ⚠️ 如果你还没用 Volume，可先改成 './data.json'

/* ---------- 工具 ---------- */
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { records: [], friendCards: [] };
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    db.records = db.records || [];
    db.friendCards = db.friendCards || [];
    return db;
  } catch {
    return { records: [], friendCards: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function checkPassword(req, res) {
  if (String(req.body.pwd || '').trim() !== PASSWORD) {
    res.status(403).send('密码错误');
    return false;
  }
  return true;
}

/* ---------- 新首页 ---------- */
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>回家</title>
<style>
body{
  margin:0;
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
  background:linear-gradient(120deg,#c7e5ff,#fce7f3);
}
.glass{
  background:rgba(255,255,255,.6);
  backdrop-filter:blur(20px);
  border-radius:24px;
  padding:40px 50px;
  text-align:center;
  box-shadow:0 10px 30px rgba(0,0,0,.1);
}
a{
  display:inline-block;
  margin-top:20px;
  text-decoration:none;
  color:#333;
  opacity:.8;
}
</style>
</head>
<body>

<div class="glass">
  <h2>回家了</h2>
  <div style="opacity:.6; margin-top:8px">
    这里是一个只属于你的地方
  </div>
  <a href="/records">进入记录 →</a>
</div>

</body>
</html>
  `);
});

/* ---------- 首页 ---------- */
app.get('/records', (req, res) => {
  const db = loadDB();

  const list = db.records.map((r, i) => `
    <div class="glass card">
      <h4 onclick="openEdit(${i})">${r.title}</h4>
      <div class="small">${r.date}</div>
      <pre>${r.content}</pre>
      <button onclick="remove(${i})">删除</button>
    </div>
  `).join('');

  res.send(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>我的记录</title>
<style>
body{
  margin:0;
  font-family:-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
  background:linear-gradient(120deg,#c7e5ff,#fce7f3);
}

.container{
  max-width:800px;
  margin:auto;
  padding:24px;
}

.glass{
  background:rgba(255,255,255,.6);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border-radius:18px;
  box-shadow:0 10px 30px rgba(0,0,0,.1);
}

.card{
  padding:16px;
  margin-bottom:16px;
}

.small{
  font-size:12px;
  color:#555;
}

button{
  border:none;
  border-radius:10px;
  padding:8px 14px;
  cursor:pointer;
  background:rgba(255,255,255,.8);
}

input, textarea{
  width:100%;
  box-sizing:border-box;   /* ⭐ 防止溢出的关键 */
  border:none;
  border-radius:12px;
  padding:10px;
  margin-bottom:10px;
  background:rgba(255,255,255,.85);
  font-family:inherit;
}

textarea{
  min-height:120px;
  resize:vertical;
}

.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:none;
  align-items:center;
  justify-content:center;
  z-index:10;
}

.modal{
  width:90%;
  max-width:420px;
}
</style>
</head>
<body>

<div class="container">
  <h2>📒 我的记录</h2>
  ${list}
  <button onclick="openNew()">➕ 新记录</button>

<hr style="margin:40px 0; opacity:.3">

<h3 style="font-weight:normal">喜欢的图</h3>

<div class="glass card">
  <img src="https://files.catbox.moe/7p4mqe.jpeg"
       style="max-width:100%; border-radius:14px;">
  <div class="small">漂亮宝宝</div>
</div>

<h3 style="font-weight:normal">☕ 朋友来坐过</h3>

<div id="friends" style="opacity:.5">
  <!-- 这里以后会显示朋友的留言 -->
</div>

  <!-- 👇 这里是新加的 -->
  <div style="margin-top:40px; font-size:13px; opacity:.6">
    <a href="/friends">朋友可以来坐一会儿 →</a>
  </div>
</div>

<div class="overlay" id="overlay">
  <div class="glass modal card">
    <input id="title" placeholder="标题">
    <textarea id="content" rows="6" placeholder="内容"></textarea>
    <input id="pwd" placeholder="密码">
    <button onclick="save()">保存</button>
    <button onclick="closeBox()">取消</button>
  </div>
</div>

<script>
let editIndex = null;

function openNew(){
  editIndex = null;
  overlay.style.display='flex';
  title.value = '';
  content.value = '';
}

function openEdit(i){
  const r = ${JSON.stringify(db.records)};
  editIndex = i;
  title.value = r[i].title;
  content.value = r[i].content;
  overlay.style.display='flex';
}

function closeBox(){
  overlay.style.display='none';
}

function save(){
  fetch('/save', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      pwd: pwd.value,
      index: editIndex,
      title: title.value,
      content: content.value
    })
  }).then(r=>{
    if(r.ok) location.reload();
    else alert('密码错误');
  });
}

function remove(i){
  const p = prompt('输入密码删除');
  fetch('/delete', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ pwd:p, index:i })
  }).then(r=>{
    if(r.ok) location.reload();
    else alert('密码错误');
  });
}

(function () {
  fetch('/friend/list')
    .then(function (res) { return res.json(); })
    .then(function (list) {
      var box = document.getElementById('friends');
      if (!box) return;

      if (!Array.isArray(list) || list.length === 0) {
        box.innerHTML = '<div style="opacity:.5">还没有朋友来坐过。</div>';
        return;
      }

      var html = '';
      list.forEach(function (c) {
        html +=
          '<div class="glass card">' +
            '<div class="small">' +
              (c.name || '匿名') +
              (c.relation ? ' · ' + c.relation : '') +
              ' · ' + c.date +
            '</div>' +
            '<pre>' + c.content + '</pre>' +
          '</div>';
      });

      box.innerHTML = html;
    })
    .catch(function () {
      var box = document.getElementById('friends');
      if (box) {
        box.innerHTML = '<div style="opacity:.5">留言暂时无法加载。</div>';
      }
    });
})();
</script>

</body>
</html>`);
});

// ===== 朋友来坐一会儿 =====
app.get('/friends', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>来坐一会儿</title>
<style>
body{
  font-family:-apple-system;
  background:linear-gradient(120deg,#c7e5ff,#fce7f3);
  padding:40px;
}
.card{
  max-width:420px;
  margin:auto;
  background:rgba(255,255,255,.6);
  backdrop-filter:blur(20px);
  border-radius:18px;
  padding:20px;
}
input,textarea{
  width:100%;
  box-sizing:border-box;
  border:none;
  border-radius:12px;
  padding:10px;
  margin-bottom:10px;
}
button{
  border:none;
  border-radius:10px;
  padding:8px 14px;
}
</style>
</head>
<body>

<div class="card">
  <p>
    你可以在这里留下一点话。<br>
    不用写得很好，也不需要解释。<br>
    如果你愿意留下名字，那会更好。<br>
    我会看到，也会认真读。<br>
    谢谢你来坐一会儿。
  </p>

  <input id="name" placeholder="你的名字">
  <input id="relation" placeholder="关系（可选）">
  <textarea id="content" rows="4" placeholder="想说的话"></textarea>

 <button onclick="submit()" style="position:relative; z-index:10;">
  放在这里 ☁️
</button>
</div>

<script>
function submit(){
  const nameEl = document.getElementById('name');
  const relationEl = document.getElementById('relation');
  const contentEl = document.getElementById('content');

  if (!contentEl.value.trim()) {
    alert('你还没有写想说的话。');
    return;
  }

  fetch('/friend/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: nameEl.value.trim(),
      relation: relationEl.value.trim(),
      content: contentEl.value.trim()
    })
  })
  .then(r => {
    if (!r.ok) throw new Error('提交失败');
    alert('已经放好了。');
    nameEl.value = '';
    relationEl.value = '';
    contentEl.value = '';
  })
  .catch(err => {
    alert('刚刚没有成功放下，再试一次吧。');
    console.error(err);
  });
}
</script>

</body>
</html>
`);
});

// ===== 朋友提交留言 =====
app.post('/friend/submit', (req, res) => {
  const db = loadDB();

  const name = (req.body.name || '').trim();
  const relation = (req.body.relation || '').trim();
  const content = (req.body.content || '').trim();

  if (!content) {
    return res.status(400).send('缺少内容');
  }

  db.friendCards.unshift({
    name,
    relation,
    content,
    date: new Date().toLocaleDateString(),
    approved: false
  });

  saveDB(db);
  res.sendStatus(200);
});

// ===== 朋友留言管理页（仅你自己）=====
app.get('/friend/admin', (req, res) => {
  const db = loadDB();

  res.send(`
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>朋友留言管理</title>
<style>
body{
  font-family:-apple-system;
  background:#f5f6f8;
  padding:40px;
}
.card{
  max-width:600px;
  margin:auto;
}
.item{
  border:1px solid #ddd;
  border-radius:10px;
  padding:12px;
  margin-bottom:12px;
  background:white;
}
small{color:#666}
button{margin-right:8px}
</style>
</head>
<body>

<div class="card">
  <h2>🗂 朋友留言管理</h2>

  ${db.friendCards.map((c, i) => `
    <div class="item">
      <b>${c.name}</b> ${c.relation || ''} <br>
      <small>${c.date}</small>
      <pre>${c.content}</pre>

      状态：${c.approved ? '✅ 已展示' : '⏳ 未展示'}
      <br><br>

      <input id="pwd${i}" placeholder="密码">

      ${!c.approved ? `
        <button onclick="approve(${i})">通过</button>
      ` : ''}

      <button onclick="remove(${i})">删除</button>
    </div>
  `).join('')}
</div>

<script>
function approve(i){
  const pwd = document.getElementById('pwd'+i).value;
  fetch('/friend/approve',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ pwd, index:i })
  }).then(r=>{
    if(r.ok) location.reload();
    else alert('密码错误');
  });
}

function remove(i){
  const pwd = document.getElementById('pwd'+i).value;
  fetch('/friend/delete',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ pwd, index:i })
  }).then(r=>{
    if(r.ok) location.reload();
    else alert('密码错误');
  });
}
</script>

</body>
</html>
`);
});

// ===== 审核通过朋友留言 =====
app.post('/friend/approve', (req, res) => {
  if (!checkPassword(req, res)) return;

  const db = loadDB();
  const index = req.body.index;

  if (db.friendCards[index]) {
    db.friendCards[index].approved = true;
    saveDB(db);
    res.sendStatus(200);
  } else {
    res.status(400).send('不存在的留言');
  }
});

// ===== 删除朋友留言 =====
app.post('/friend/delete', (req, res) => {
  if (!checkPassword(req, res)) return;

  const db = loadDB();
  const index = req.body.index;

  if (db.friendCards[index]) {
    db.friendCards.splice(index, 1);
    saveDB(db);
    res.sendStatus(200);
  } else {
    res.status(400).send('不存在的留言');
  }
});

// ===== 获取已展示的朋友留言 =====
app.get('/friend/list', (req, res) => {
  const db = loadDB();
  res.json(db.friendCards.filter(c => c.approved));
});

/* ---------- 启动 ---------- */
app.listen(PORT,'0.0.0.0',()=>{
  console.log('Server running on',PORT);
});
