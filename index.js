const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PASSWORD = '367208';
const DB_FILE = '/data/data.json';

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

/* ---------- 回家页 ---------- */
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>回家</title>
<style>
body{
  margin:0;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;
  background:linear-gradient(120deg,#c7e5ff,#fce7f3);
}
.glass{
  width:90%;
  max-width:420px;
  background:rgba(255,255,255,.6);
  backdrop-filter:blur(20px);
  border-radius:28px;
  padding:40px 28px;
  text-align:center;
  box-shadow:0 10px 30px rgba(0,0,0,.1);
}
.top-nav{
  position:fixed;
  top:16px;
  left:50%;
  transform:translateX(-50%);
  display:flex;
  gap:14px;
  padding:10px 14px;
  background:rgba(255,255,255,.55);
  backdrop-filter:blur(18px);
  border-radius:18px;
}
.nav-btn{
  width:40px;
  height:40px;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:12px;
  color:#333;
  opacity:.75;
}
.nav-btn:hover{opacity:1}
.enter{
  display:inline-block;
  margin-top:24px;
  padding:12px 26px;
  border-radius:16px;
  background:rgba(255,255,255,.75);
  text-decoration:none;
  color:#333;
}
</style>
</head>
<body>

<div class="top-nav">
  <a href=" " class="nav-btn">🏠</a >
  <a href="/records" class="nav-btn">📒</a >
</div>

<div class="glass">
  <h2>回家了</h2>
  <div style="opacity:.6;margin-top:8px">这里是一个只属于你的地方</div>
  <a class="enter" href="/records">进入记录</a >
</div>

</body>
</html>`);
});

/* ---------- 记录页 ---------- */
app.get('/records', (req, res) => {
  const db = loadDB();

  const list = db.records.map((r,i)=>`
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
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;
  background:linear-gradient(120deg,#c7e5ff,#fce7f3);
}
.container{max-width:800px;margin:auto;padding:24px}
.glass{
  background:rgba(255,255,255,.6);
  backdrop-filter:blur(20px);
  border-radius:18px;
  box-shadow:0 10px 30px rgba(0,0,0,.1);
}
.card{padding:16px;margin-bottom:16px}
.small{font-size:12px;color:#555}
button{
  border:none;border-radius:10px;padding:8px 14px;
  background:rgba(255,255,255,.8);cursor:pointer
}
input,textarea{
  width:100%;border:none;border-radius:12px;
  padding:10px;margin-bottom:10px
}
.overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.4);
  display:none;align-items:center;justify-content:center
}
.modal{width:90%;max-width:420px}
</style>
</head>
<body>

<div class="container">
  <h2>📒 我的记录</h2>
  ${list}
  <button onclick="openNew()">➕ 新记录</button>

  <hr style="margin:40px 0;opacity:.3">
  <h3 style="font-weight:normal">☕ 朋友来坐过</h3>
  <div id="friends" style="opacity:.5"></div>
  <div style="margin-top:20px;font-size:13px;opacity:.6">
    <a href="/friends">朋友可以来坐一会儿 →</a >
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
let editIndex=null;

function openNew(){
  editIndex=null;
  overlay.style.display='flex';
  title.value='';content.value='';
}
function openEdit(i){
  const r=${JSON.stringify(db.records)};
  editIndex=i;
  title.value=r[i].title;
  content.value=r[i].content;
  overlay.style.display='flex';
}
function closeBox(){overlay.style.display='none'}
function save(){
  fetch('/save',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      pwd:pwd.value,index:editIndex,
      title:title.value,content:content.value
    })
  }).then(r=>{if(r.ok)location.reload();else alert('密码错误')})
}
function remove(i){
  const p=prompt('输入密码删除');
  fetch('/delete',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({pwd:p,index:i})
  }).then(r=>{if(r.ok)location.reload();else alert('密码错误')})
}

fetch('/friend/list').then(r=>r.json()).then(list=>{
  const box=document.getElementById('friends');
  if(!list.length){box.innerHTML='还没有朋友来坐过。';return}
  box.style.opacity=1;
  box.innerHTML=list.map(c=>`
    <div class="glass card">
      <div class="small">${c.name||'匿名'} · ${c.date}</div>
      <pre>${c.content}</pre>
    </div>
  `).join('');
});
</script>

</body>
</html>`);
});

/* ---------- 保存 / 删除 ---------- */
app.post('/save',(req,res)=>{
  if(!checkPassword(req,res))return;
  const db=loadDB();
  const item={
    title:req.body.title||'无标题',
    content:req.body.content||'',
    date:new Date().toLocaleString()
  };
  if(req.body.index==null) db.records.unshift(item);
  else db.records[req.body.index]=item;
  saveDB(db);res.sendStatus(200);
});

app.post('/delete',(req,res)=>{
  if(!checkPassword(req,res))return;
  const db=loadDB();
  db.records.splice(req.body.index,1);
  saveDB(db);res.sendStatus(200);
});

/* ---------- 朋友留言 ---------- */
app.get('/friends',(req,res)=>{
  res.send('<h2>朋友来坐一会儿（保留原版即可）</h2>');
});

app.post('/friend/submit',(req,res)=>{
  const db=loadDB();
  if(!req.body.content)return res.sendStatus(400);
  db.friendCards.unshift({
    name:req.body.name||'',
    content:req.body.content,
    date:new Date().toLocaleDateString(),
    approved:false
  });
  saveDB(db);res.sendStatus(200);
});

app.get('/friend/list',(req,res)=>{
  const db=loadDB();
  res.json(db.friendCards.filter(c=>c.approved));
});

app.listen(PORT,'0.0.0.0',()=>{
  console.log('Server running on',PORT);
});
