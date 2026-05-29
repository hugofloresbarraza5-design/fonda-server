const http = require('http');
const https = require('https');

const ACCOUNT_SID = 'ACca74795a63742b875ce630de764476bf';
const AUTH_TOKEN  = '4a83d0f27bfc93a1d9823798ffb4e767';
const FROM = 'whatsapp:+14155238886';
const TO   = 'whatsapp:+19157026699';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200); res.end(); return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let mensaje;
      try { mensaje = JSON.parse(body).body; }
      catch { res.writeHead(400); res.end('Bad Request'); return; }

      const params = new URLSearchParams({ From: FROM, To: TO, Body: mensaje }).toString();
      const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

      const options = {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(params)
        }
      };

      const twilioReq = https.request(options, twilioRes => {
        let data = '';
        twilioRes.on('data', chunk => data += chunk);
        twilioRes.on('end', () => {
          res.writeHead(twilioRes.statusCode, {'Content-Type': 'application/json'});
          res.end(data);
        });
      });
      twilioReq.on('error', e => { res.writeHead(500); res.end(e.message); });
      twilioReq.write(params);
      twilioReq.end();
    });
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
