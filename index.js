const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const FILE = 'data.json';
const PASSWORD = '你自己设的密码';

// 工具：获取今天日期 YYYY-MM-DD
function today() {
  return new Date().toISOString().slice(0, 10);
}

// 工具：读取数据
function loadData() {
  if (!fs.existsSync(FILE)) return {};
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

// 工具：保存数据
function saveData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// 页面
app.get('/', (req, res) => {
  const data = loadData();
  const days = Object.keys(data).sort().slice(-3);

  const blocks = days.map(d => `
    <h4>${d}</h4>
    <textarea data-day="${d}" style="width:100%;height:80px">${data[d]}</textarea>
  `).join('');

 res.send(`
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                 "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: #f5f6f8;
    padding: 40px;
  }

  .card {
    max-width: 700px;
    margin: auto;
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  }

  h3 {
    margin-top: 0;
  }

  h4 {
    margin-bottom: 6px;
    color: #555;
  }

  textarea {
    width: 100%;
    border-radius: 8px;
    border: 1px solid #ddd;
    padding: 10px;
    font-size: 14px;
    resize: vertical;
  }

  input {
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #ccc;
  }

  button {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
  }

  button:hover {
    background: #4338ca;
  }
</style>

<div class="card">
  <h3>📅 三日打卡</h3>

  ${blocks}

  <h4>${today()}</h4>
  <textarea id="today"></textarea>

  <div style="margin-top:12px;">
    <input id="pwd" placeholder="密码">
    <button onclick="save()">保存</button>
  </div>
</div>

<script>
  function save() {
    fetch('/save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        pwd: pwd.value,
        text: today.value
      })
    }).then(()=>location.reload());
  }
</script>
`);

// 保存今天的打卡
app.post('/save', (req, res) => {
  if (req.body.pwd !== PASSWORD) return res.sendStatus(403);

  const data = loadData();
  data[today()] = req.body.text;

  // 只保留最近 3 天
  const keys = Object.keys(data).sort();
  while (keys.length > 3) {
    delete data[keys.shift()];
  }

  saveData(data);
  res.send('ok');
});

app.listen(process.env.PORT || 3000);
