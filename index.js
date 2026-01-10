const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const FILE = 'data.json';
const PASSWORD = '你的密码'; // ← 改成你自己的

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadData() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

app.get('/', (req, res) => {
  const data = loadData();
  const days = Object.keys(data).sort().slice(-3);

  const blocks = days.map(d => `
    <div class="history" data-day="${d}">
      <div class="date">${d}</div>
      <pre class="content">${data[d]}</pre>
      <div class="actions">
        <button class="edit-btn" data-day="${d}">修改</button>
        <button class="delete-btn" data-day="${d}">删除</button>
      </div>
    </div>
  `).join('');

  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>三日打卡</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
  padding: 40px;
  background:
    linear-gradient(120deg,
      #e0f2fe,
      #ede9fe,
      #fce7f3);
}

/* 主玻璃卡片 */
.card {
  max-width: 720px;
  margin: auto;
  padding: 24px;
  border-radius: 20px;

  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* 历史记录玻璃块 */
.history {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;

  border: 1px solid rgba(255, 255, 255, 0.4);
}

.date {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.content {
  white-space: pre-wrap;
  font-size: 14px;
  margin: 0;
}

/* 操作按钮 */
.actions {
  margin-top: 6px;
}

.actions button {
  font-size: 12px;
  margin-right: 6px;
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.6);
}

/* 今天 */
.today {
  background: rgba(238, 242, 255, 0.65);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  border-radius: 16px;
  padding: 14px;
  margin-top: 20px;

  border: 1px solid rgba(255, 255, 255, 0.45);
}

.today-label {
  font-size: 13px;
  color: #4338ca;
  margin-bottom: 6px;
}

textarea {
  width: 100%;
  height: 80px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.15);
  padding: 8px;
}

input {
  border-radius: 6px;
  border: 1px solid rgba(0,0,0,0.2);
  padding: 6px;
}

button {
  padding: 6px 10px;
}
</style>
</head>

<body>
<div class="card">
  <h3>📅 三日打卡</h3>

  ${blocks}

  <div class="today">
    <div class="today-label">✏️ 今天（${today()}）</div>
    <textarea id="today"></textarea>
    <input id="pwd" placeholder="密码">
    <button id="saveBtn">保存</button>
  </div>
</div>

<script>
document.getElementById('saveBtn').onclick = () => {
  fetch('/save', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      pwd: document.getElementById('pwd').value,
      text: document.getElementById('today').value
    })
  }).then(() => location.reload());
};

// 修改
document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.onclick = () => {
    const day = btn.dataset.day;
    const content = btn.parentElement.previousElementSibling.innerText;
    const text = prompt('修改记录：', content);
    if (text === null) return;

    fetch('/edit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        pwd: document.getElementById('pwd').value,
        day,
        text
      })
    }).then(() => location.reload());
  };
});

// 删除
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.onclick = () => {
    const day = btn.dataset.day;
    if (!confirm('确定删除 ' + day + ' 吗？')) return;

    fetch('/delete', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        pwd: document.getElementById('pwd').value,
        day
      })
    }).then(() => location.reload());
  };
});
</script>
</body>
</html>`);
});

// 保存今天
app.post('/save', (req, res) => {
  if (req.body.pwd !== PASSWORD) return res.sendStatus(403);

  const data = loadData();
  data[today()] = req.body.text;

  const keys = Object.keys(data).sort();
  while (keys.length > 3) delete data[keys.shift()];

  saveData(data);
  res.send('ok');
});

// 修改
app.post('/edit', (req, res) => {
  if (req.body.pwd !== PASSWORD) return res.sendStatus(403);

  const data = loadData();
  data[req.body.day] = req.body.text;
  saveData(data);
  res.send('ok');
});

// 删除
app.post('/delete', (req, res) => {
  if (req.body.pwd !== PASSWORD) return res.sendStatus(403);

  const data = loadData();
  delete data[req.body.day];
  saveData(data);
  res.send('ok');
});

app.listen(process.env.PORT || 3000);
