import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import app from './index.js';
import { getAuctionSnapshot, subscribeAuctionStream } from './routes/auctions.js';

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
const clients = new Set<WebSocket>();

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

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`).pathname;
  if (pathname !== '/ws/auctions') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (client) => wss.emit('connection', client, request));
});

server.listen(port, () => {
  console.log(`[landmap-api] websocket ready on /ws/auctions`);
});
