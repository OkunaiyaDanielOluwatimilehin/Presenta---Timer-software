import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { WebSocketServer, type WebSocket } from 'ws';

type Role = 'unknown' | 'host' | 'controller';

type ClientMeta = {
  role: Role;
  authed: boolean;
};

type RemoteInfo = {
  port: number;
  pairingCode: string;
  addresses: string[];
};

const port = Number(process.env.PP_REMOTE_PORT || 4587);
const pairingCode = String(process.env.PP_REMOTE_CODE || Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0'));

const controllerHtmlPath = path.resolve(process.cwd(), 'remote', 'controller.html');
const controllerHtml = fs.readFileSync(controllerHtmlPath, 'utf8');

const webRoot = path.resolve(process.env.PP_WEB_ROOT || path.resolve(process.cwd(), 'dist'));
const webIndexPath = path.join(webRoot, 'index.html');

function listAddresses(): string[] {
  const nets = os.networkInterfaces();
  const out: string[] = [];
  for (const name of Object.keys(nets)) {
    const entries = nets[name] || [];
    for (const entry of entries) {
      if (!entry || entry.internal) continue;
      if (entry.family !== 'IPv4') continue;
      out.push(entry.address);
    }
  }
  out.sort();
  return Array.from(new Set(out));
}

function json(res: http.ServerResponse, code: number, data: unknown) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(data));
}

function text(res: http.ServerResponse, code: number, data: string, contentType = 'text/plain; charset=utf-8') {
  res.statusCode = code;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(data);
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.ico':
      return 'image/x-icon';
    case '.woff2':
      return 'font/woff2';
    case '.woff':
      return 'font/woff';
    case '.ttf':
      return 'font/ttf';
    case '.map':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function safeResolveWebPath(urlPathname: string): string | null {
  const raw = decodeURIComponent(urlPathname || '/');
  const cleaned = raw.replace(/\0/g, '');
  const rel = cleaned.replace(/^\/+/, '');
  const full = path.resolve(webRoot, rel);
  const rootWithSep = webRoot.endsWith(path.sep) ? webRoot : `${webRoot}${path.sep}`;
  if (full === webRoot) return webIndexPath;
  if (!full.startsWith(rootWithSep) && full !== webIndexPath) return null;
  return full;
}

let hostSocket: WebSocket | null = null;
let lastStateJson: unknown | null = null;
const controllers = new Set<WebSocket>();
const meta = new WeakMap<WebSocket, ClientMeta>();

function sendWs(ws: WebSocket, msg: unknown) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(msg));
}

function broadcastToControllers(msg: unknown) {
  for (const ws of controllers) sendWs(ws, msg);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && (url.pathname === '/controller' || url.pathname === '/controller/' || url.pathname === '/controller.html')) {
    return text(res, 200, controllerHtml, 'text/html; charset=utf-8');
  }

  if (req.method === 'GET' && url.pathname === '/info') {
    const info: RemoteInfo = { port, pairingCode, addresses: listAddresses() };
    return json(res, 200, info);
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.end();
  }

  // Serve the web app (built Vite output) so end users can run fully offline on the local network.
  // This avoids HTTPS mixed-content issues with a hosted website trying to talk to a local ws:// server.
  if (req.method === 'GET') {
    const hasWeb = fs.existsSync(webIndexPath);
    if (!hasWeb) {
      return text(
        res,
        200,
        [
          '<!doctype html>',
          '<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>',
          '<title>Presenta Pro Helper</title>',
          '<style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0a0a0a;color:#f0f0f0}a{color:#34d399}</style>',
          '</head><body>',
          '<div style="max-width:820px;margin:0 auto;padding:18px">',
          '<h1 style="margin:0 0 6px">Presenta Pro Helper</h1>',
          '<p style="opacity:.8;margin:0 0 12px">Web app build not found.</p>',
          `<p style="opacity:.8;margin:0 0 12px">Expected: <code>${webIndexPath}</code></p>`,
          '<p style="opacity:.8;margin:0 0 12px">For developers: run <code>npm run build</code> then restart the helper.</p>',
          '<p style="margin:0 0 12px"><a href="/controller">Open controller</a></p>',
          '</div>',
          '</body></html>',
        ].join(''),
        'text/html; charset=utf-8',
      );
    }

    const resolved = safeResolveWebPath(url.pathname);
    if (!resolved) return text(res, 400, 'Bad path');

    let filePath = resolved;
    try {
      if (url.pathname === '/' || url.pathname === '/index.html') {
        filePath = webIndexPath;
      } else if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        filePath = path.join(resolved, 'index.html');
      } else if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        // SPA fallback (hash routing, etc.)
        filePath = webIndexPath;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', getContentType(filePath));
      res.setHeader('Access-Control-Allow-Origin', '*');
      fs.createReadStream(filePath).pipe(res);
      return;
    } catch {
      return text(res, 500, 'Failed to serve file');
    }
  }

  return text(res, 404, 'Not found');
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  meta.set(ws, { role: 'unknown', authed: false });
  sendWs(ws, { type: 'HELLO', requiresAuth: true });

  ws.on('message', (raw) => {
    let msg: any;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

    const type = String(msg?.type || '');
    const m = meta.get(ws) || { role: 'unknown', authed: false };

    if (type === 'HOST_ATTACH') {
      const code = String(msg?.code || '').trim();
      if (code !== pairingCode) {
        return sendWs(ws, { type: 'ERROR', message: 'Wrong code' });
      }

      if (hostSocket && hostSocket !== ws) {
        try {
          hostSocket.close();
        } catch {}
      }

      m.role = 'host';
      m.authed = true;
      meta.set(ws, m);
      hostSocket = ws;
      sendWs(ws, { type: 'HOST_OK' });

      if (lastStateJson) {
        sendWs(ws, { type: 'STATE', payload: (lastStateJson as any).payload ?? lastStateJson });
      }
      return;
    }

    if (type === 'AUTH') {
      const code = String(msg?.code || '').trim();
      if (code !== pairingCode) {
        return sendWs(ws, { type: 'AUTH_FAIL' });
      }

      m.role = 'controller';
      m.authed = true;
      meta.set(ws, m);
      controllers.add(ws);

      return sendWs(ws, { type: 'AUTH_OK', port, state: lastStateJson });
    }

    if (!m.authed) {
      return sendWs(ws, { type: 'ERROR', message: 'Not authorized' });
    }

    if (m.role === 'host') {
      if (type === 'STATE') {
        lastStateJson = msg;
        broadcastToControllers(msg);
      }
      return;
    }

    if (m.role === 'controller') {
      if (type === 'GET_STATE') {
        return sendWs(ws, { type: 'STATE', payload: (lastStateJson as any)?.payload ?? null });
      }

      if (!hostSocket || hostSocket.readyState !== hostSocket.OPEN) {
        return sendWs(ws, { type: 'ERROR', message: 'Host is offline' });
      }

      hostSocket.send(JSON.stringify(msg));
    }
  });

  ws.on('close', () => {
    const m = meta.get(ws);
    if (m?.role === 'controller') controllers.delete(ws);
    if (ws === hostSocket) hostSocket = null;
  });
});

server.listen(port, '0.0.0.0', () => {
  const addrs = listAddresses();
  const appUrls = addrs.length ? addrs.map((a) => `http://${a}:${port}/`) : [`http://localhost:${port}/`];
  const controllerUrls = addrs.length
    ? addrs.map((a) => `http://${a}:${port}/controller`)
    : [`http://localhost:${port}/controller`];
  // eslint-disable-next-line no-console
  console.log(`[presenta-pro] remote server on :${port}`);
  // eslint-disable-next-line no-console
  console.log(`[presenta-pro] pairing code: ${pairingCode}`);
  // eslint-disable-next-line no-console
  console.log(`[presenta-pro] app URLs:\n${appUrls.join('\n')}`);
  // eslint-disable-next-line no-console
  console.log(`[presenta-pro] controller URLs:\n${controllerUrls.join('\n')}`);
});
