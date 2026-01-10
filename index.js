const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PASSWORD = '367208';
const DB_FILE = '/data/data.json'; // ⚠️ 如果你还没用 Volume，可先改成 './data.json'

/* ---------- 工具 ---------- */
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { records: [] };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { records: [] };
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

/* ---------- 首页 ---------- */
app.get('/', (req, res) => {
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
  font-family:-apple-system;
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
  border-radius:18px;
  box-shadow:0 10px 30px rgba(0,0,0,.1);
}
.card{
  padding:16px;
  margin-bottom:16px;
}
.small{font-size:12px;color:#555;}
button{
  border:none;
  border-radius:10px;
  padding:6px 12px;
  cursor:pointer;
}
input,textarea{
  width:100%;
  border:none;
  border-radius:12px;
  padding:10px;
  margin-bottom:10px;
}
.overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.4);
  display:none;
  align-items:center;
  justify-content:center;
}
.modal{
  width:360px;
}
</style>
</head>
<body>

<div class="container">
  <h2>📒 我的记录</h2>
  ${list}
  <button onclick="openNew()">➕ 新记录</button>
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
</script>

</body>
</html>`);
});

/* ---------- 保存 ---------- */
app.post('/save', (req,res)=>{
  if(!checkPassword(req,res)) return;

  const db = loadDB();
  const item = {
    title: req.body.title || '无标题',
    content: req.body.content || '',
    date: new Date().toLocaleString()
  };

  if(req.body.index === null || req.body.index === undefined){
    db.records.unshift(item);
  }else{
    db.records[req.body.index] = item;
  }

  saveDB(db);
  res.sendStatus(200);
});

/* ---------- 删除 ---------- */
app.post('/delete', (req,res)=>{
  if(!checkPassword(req,res)) return;

  const db = loadDB();
  db.records.splice(req.body.index,1);
  saveDB(db);
  res.sendStatus(200);
});

/* ---------- 启动 ---------- */
app.listen(PORT,'0.0.0.0',()=>{
  console.log('Server running on',PORT);
});
