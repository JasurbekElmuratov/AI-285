import { createServer } from 'node:http';
import { handleApi } from './app.ts';
import { productionDependencies } from './runtime.ts';

if (process.argv.includes('--demo')) {
  process.env.BACKEND_DATA_MODE = 'demo';
  process.env.ALLOW_DEMO_DATA = 'true';
}
const deps = productionDependencies();
const port = Number(process.env.API_PORT ?? 8787);
createServer(async (incoming, outgoing) => {
  const parts: Buffer[] = [];
  let size = 0;
  for await (const chunk of incoming) {
    size += chunk.length;
    if (size > 16384) {
      outgoing.writeHead(413, { 'Content-Type': 'application/json' });
      outgoing.end(JSON.stringify({ error: { code: 'BODY_TOO_LARGE', message: 'Request body is too large.' } }));
      return;
    }
    parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = parts.length ? Buffer.concat(parts) : undefined;
  const url = 'http://localhost:' + port + (incoming.url ?? '/');
  const request = new Request(url, {
    method: incoming.method,
    headers: incoming.headers as HeadersInit,
    body: incoming.method === 'GET' || incoming.method === 'HEAD' ? undefined : body
  });
  const response = await handleApi(request, deps);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, '127.0.0.1', () => {
  console.log('Our Ground API listening on http://localhost:' + port + '/api/v1/health');
});
