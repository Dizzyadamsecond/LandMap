import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import app from './index.js';
import { getAuctionSnapshot, subscribeAuctionStream } from './routes/auctions.js';
import { buildSnapshot, buildTick } from './history40.js';

const port = parseInt(process.env.PORT ?? '4000', 10);

console.log(`[landmap-api] starting on :${port}`);

const server = createServer((req, res) => {
  Promise.resolve(app.fetch(new Request(`http://${req.headers.host ?? `localhost:${port}`}${req.url ?? '/'}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
  }))).then(async (response) => {
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(await response.text());
  }).catch(() => {
    res.writeHead(500);
    res.end('Internal Server Error');
  });
});

const wss = new WebSocketServer({ noServer: true });
const h40wss = new WebSocketServer({ noServer: true });
const clients = new Set<WebSocket>();
const h40Clients = new Set<WebSocket>();

function send(client: WebSocket, payload: unknown) {
  if (client.readyState === 1) client.send(JSON.stringify(payload));
}

wss.on('connection', (client) => {
  clients.add(client);
  send(client, { type: 'snapshot', region: 'BR', items: getAuctionSnapshot(undefined, 120) });
  client.on('close', () => clients.delete(client));
});

subscribeAuctionStream((item) => {
  for (const client of clients) send(client, { type: 'auction.updated', item });
});

// History40 — 40 anos de macro real (Bacen SGS), snapshot + tick periódico
h40wss.on('connection', (client) => {
  h40Clients.add(client);
  send(client, buildSnapshot());
  client.on('close', () => h40Clients.delete(client));
});

setInterval(() => {
  const tick = buildTick();
  for (const client of h40Clients) send(client, tick);
}, 5000);

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).pathname;
  if (pathname === '/ws/auctions') {
    wss.handleUpgrade(request, socket, head, (client) => wss.emit('connection', client, request));
  } else if (pathname === '/ws/history40') {
    h40wss.handleUpgrade(request, socket, head, (client) => h40wss.emit('connection', client, request));
  } else {
    socket.destroy();
  }
});

server.listen(port, () => {
  console.log(`[landmap-api] websocket ready on /ws/auctions and /ws/history40`);
});
