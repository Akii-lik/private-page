const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const FILE = 'data.txt';
const PASSWORD = '你自己设一个';

app.get('/', (req, res) => {
  res.send(`
    <h3>私人记录</h3>
    <textarea id="t" style="width:100%;height:200px"></textarea><br>
    <input id="p" placeholder="密码">
    <button onclick="save()">保存</button>
    <script>
      fetch('/load').then(r=>r.text()).then(x=>t.value=x)
      function save(){
        fetch('/save',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({pwd:p.value,text:t.value})
        })
      }
    </script>
  `);
});

app.get('/load', (req, res) => {
  if (!fs.existsSync(FILE)) return res.send('');
  res.send(fs.readFileSync(FILE,'utf8'));
});

app.post('/save', (req, res) => {
  if (req.body.pwd !== PASSWORD) return res.sendStatus(403);
  fs.writeFileSync(FILE, req.body.text);
  res.send('ok');
});

app.listen(process.env.PORT || 3000);
