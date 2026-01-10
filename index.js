const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const FILE = 'data.json';
const PASSWORD = '367208';

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

    <pre class="content" id="content-${d}">${data[d]}</pre>

    <div class="actions">
      <button onclick="edit('${d}')">修改</button>
      <button onclick="removeDay('${d}')">删除</button>
    </div>
  </div>
`).join('');
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>三日打卡</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
    background: #f5f6f8;
    padding: 40px;
  }
  .card {
    max-width: 700px;
    margin: auto;
    background: white;
    padding: 24px;
    border-radius: 12px;
  }
  textarea {
    width: 100%;
    height: 80px;
    margin-bottom: 12px;
  }
  .history {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.history .date {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.history .content {
  white-space: pre-wrap;
  font-size: 14px;
  margin: 0;
｝

.today {
  background: #eef2ff;
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
}

.today-label {
  font-size: 13px;
  color: #4338ca;
  margin-bottom: 6px;
｝

.actions {
  margin-top: 6px;
}

.actions button {
  font-size: 12px;
  margin-right: 6px;
｝
</style>
</head>
<body>

<div class="card">
  <h3>📅 三日打卡</h3>

  <!-- 历史记录 -->
  ${blocks}

  <!-- 今天 -->
  <div class="today">
    <div class="today-label">✏️ 今天（${today()}）</div>
    <textarea id="today"></textarea>

    <div style="margin-top:8px;">
      <input id="pwd" placeholder="密码">
      <button id="saveBtn">保存</button>
    </div>
  </div>
</div>

<script>
document.getElementById('saveBtn').onclick = function () {
  fetch('/save', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      pwd: document.getElementById('pwd').value,
      text: document.getElementById('today').value
    })
  }).then(() => location.reload());
};

// ✏️ 修改
function edit(day) {
  const oldText = document.getElementById('content-' + day).innerText;
  const newText = prompt('修改记录：', oldText);
  if (newText === null) return;

  fetch('/edit', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      pwd: document.getElementById('pwd').value,
      day,
      text: newText
    })
  }).then(() => location.reload());
}

// 🗑️ 删除
function removeDay(day) {
  if (!confirm(`确定要删除 ${day} 的记录吗？`)) return;

  fetch('/delete', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      pwd: document.getElementById('pwd').value,
      day
    })
  }).then(() => location.reload());
}
</script>

</body>
</html>
`);
});

// ✏️ 修改某一天
app.post('/edit', (req, res) => {
  if (req.body.pwd !== PASSWORD) return res.sendStatus(403);

  const data = loadData();
  data[req.body.day] = req.body.text;
  saveData(data);

  res.send('ok');
});

// 🗑️ 删除某一天
app.post('/delete', (req, res) => {
  if (req.body.pwd !== PASSWORD) return res.sendStatus(403);

  const data = loadData();
  delete data[req.body.day];
  saveData(data);

  res.send('ok');
});

app.listen(process.env.PORT || 3000);
