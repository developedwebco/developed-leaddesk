const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3456;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  // Optional proxy endpoint for Google Places Text Search / Details if user configures API key
  if (parsedUrl.pathname === '/api/places-search' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { apiKey, textQuery, locationBias } = JSON.parse(body);
        if (!apiKey) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing Google Places API Key' }));
        }

        const payload = JSON.stringify({
          textQuery,
          ...(locationBias ? { locationBias } : {})
        });

        const options = {
          hostname: 'places.googleapis.com',
          path: '/v1/places:searchText',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName,places.types',
            'Content-Length': Buffer.byteLength(payload)
          }
        };

        const apiReq = https.request(options, apiRes => {
          let data = '';
          apiRes.on('data', d => { data += d; });
          apiRes.on('end', () => {
            res.writeHead(apiRes.statusCode || 200, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        });

        apiReq.on('error', err => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        });

        apiReq.write(payload);
        apiReq.end();
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  let filePath = path.join(PUBLIC_DIR, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  const ext = path.extname(filePath).toLowerCase();

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404);
            return res.end('Not found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fallback);
        });
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
});

const os = require('os');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`DevEloped LeadDesk running on Desktop: http://localhost:${PORT}`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`Open on Phone (same Wi-Fi): http://${net.address}:${PORT}`);
      }
    }
  }
});
