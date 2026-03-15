const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 8787;
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDWYcb8zA6dco1K_QidJp2BXv0KU9UXfrw';
const CLIENT_TOKEN = process.env.CLIENT_TOKEN || 'solo-mi-pc-token';

let latest = { query: '', roast: '', at: '' };

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

async function generateRoast(query) {
  const prompt = `Responde en español, tono burlón ligero y creativo, máximo 18 palabras, sobre esta búsqueda: "${query}".`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    return `Error Gemini ${response.status}`;
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini no devolvió texto.';
}

function serveStatic(req, res) {
  const route = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, 'web', route);

  if (!filePath.startsWith(path.join(__dirname, 'web'))) {
    sendJson(res, 403, { error: 'forbidden' });
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      sendJson(res, 404, { error: 'not_found' });
      return;
    }

    const ext = path.extname(filePath);
    const mime = ext === '.html' ? 'text/html; charset=utf-8'
      : ext === '.css' ? 'text/css; charset=utf-8'
      : 'application/javascript; charset=utf-8';

    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.socket.remoteAddress !== '127.0.0.1' && req.socket.remoteAddress !== '::1') {
    sendJson(res, 403, { error: 'solo_localhost' });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/latest') {
    sendJson(res, 200, latest);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/search') {
    if (req.headers['x-client-token'] !== CLIENT_TOKEN) {
      sendJson(res, 401, { error: 'token_invalido' });
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const query = (data.query || '').trim();
        if (!query) {
          sendJson(res, 400, { error: 'query_requerida' });
          return;
        }

        const roast = await generateRoast(query);
        latest = {
          query,
          roast,
          at: new Date().toLocaleString('es-ES')
        };

        sendJson(res, 200, { ok: true, latest });
      } catch (error) {
        sendJson(res, 500, { error: String(error) });
      }
    });
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
});

server.listen(PORT, HOST, () => {
  console.log(`BurlonAI local server activo en http://${HOST}:${PORT}`);
});
