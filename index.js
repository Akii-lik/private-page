const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const FILE = 'data.json';
const PASSWORD = '你自己设的密码';

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
    <h4>${d}</h4>
    <textarea>${data[d]}</textarea>
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
</style>
</head>
<body>

<div class="card">
  <h3>📅 三日打卡</h3>
  ${blocks}
  <h4>${today()}</h4>
  <textarea id="today"></textarea>
  <input id="pwd" placeholder="密码">
  <button id="saveBtn">保存</button>
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
</script>

</body>
</html>
`);
});

app.post('/save', (req, res) => {
  if (req.body.pwd !== PASSWORD) return res.sendStatus(403);

  const data = loadData();
  data[today()] = req.body.text;

  const keys = Object.keys(data).sort();
  while (keys.length > 3) delete data[keys.shift()];

  saveData(data);
  res.send('ok');
});

app.listen(process.env.PORT || 3000);
