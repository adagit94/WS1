import { parseEndpoints } from './utils.ts';

const { PORT, ENDPOINTS } = Deno.env.toObject();

if (typeof Number(PORT) !== 'number') throw new Error('PORT env. variable number must be defined.');

const endpoints = parseEndpoints(ENDPOINTS);

Deno.serve({ port: Number(PORT) }, async req => {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response(undefined, { status: 400, statusText: 'Server supports only WebSocket upgrade connection.' });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.

  // socket.onmessage =

  return response;
});

const;
