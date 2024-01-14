import { load } from 'std/dotenv/mod.ts';
import { Client } from './types.ts';

const { PORT, IP_CLIENTS_LIMIT, IP_MESSAGE_RATE, TOTAL_MESSAGE_RATE } = await load();

if (typeof Number(PORT) !== 'number') throw new Error('PORT env. variable number must be defined.');
if (IP_CLIENTS_LIMIT !== undefined && typeof Number(IP_CLIENTS_LIMIT) !== 'number')
  throw new Error('IP_CLIENTS_LIMIT env. variable must be number or undefined.');
// if (typeof Number(IP_MESSAGE_RATE) !== 'number') throw new Error('IP_MESSAGE_RATE env. variable must be number.'); // messages/sec.
// if (typeof Number(TOTAL_MESSAGE_RATE) !== 'number') throw new Error('TOTAL_MESSAGE_RATE env. variable must be number.'); // messages/sec.

let clients: Client[] = [];

Deno.serve({ port: Number(PORT) }, req => {
  console.log(req.headers)
  
  try {
    if (req.headers.get('upgrade') !== 'websocket') {
      return new Response(undefined, { status: 400, statusText: 'Server supports only WebSocket upgrade connection.' });
    }

    if (IP_CLIENTS_LIMIT && clients.length >= Number(IP_CLIENTS_LIMIT)) {
      return new Response(undefined, { status: 503, statusText: 'Too many WebSocket clients.' });
    }

    const res = addClient(req);

    return res;
  } catch (err) {
    console.error(err);
    return new Response(undefined, { status: 500, statusText: 'Internal server error.' });
  }
});

const addClient = (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (typeof id !== 'string' && typeof id !== 'number') {
    return new Response(undefined, { status: 400, statusText: 'Client id must be string or number.' });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const client: Client = { id, socket };

  socket.onopen = () => {
    if (!clients.some(client => client.id === id)) {
      clients.push(client);
    }
  };

  socket.onmessage = e => {
    // synchronize clients, save to db, ...
    
    for (const client of clients) {
      if (client.id === id) continue;

      client.socket.send(e.data);
    }
  };

  socket.onclose = () => {
    clients = clients.filter(client => client.id !== id);
  };

  socket.onerror = (e) => {
    console.error(e);
  };

  return response;
};
