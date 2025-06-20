import { NextRequest } from 'next/server';

export const runtime = 'edge';

// In-memory room registry. For production scale, back this with Redis/Upstash.
const rooms: Map<string, Set<WebSocket>> = new Map();

type WSData = {
  type: 'message' | 'typing' | 'status' | 'message_status' | 'joined' | 'left' | 'read_messages';
  [key: string]: any;
};

function broadcast(room: string, data: WSData, exclude?: WebSocket) {
  const peers = rooms.get(room);
  if (!peers) return;
  const payload = JSON.stringify(data);
  peers.forEach((ws) => {
    if (ws !== exclude && ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  });
}

export function GET(req: NextRequest) {
  if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Must be a websocket upgrade request', { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') ?? crypto.randomUUID();
  const conversationId = searchParams.get('conversationId') ?? 'lobby';
  const room = `conversation_${conversationId}`;

  // @ts-ignore – WebSocketPair is available in Edge runtime
  const pair = new WebSocketPair();
  const client = pair[0] as WebSocket;
  const server = pair[1] as WebSocket & { accept: () => void };

  // Register
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(server);

  // the `accept` method is specific to Vercel/Web Standard WebSocketPair
  server.accept();

  // Notify others
  broadcast(room, { type: 'joined', userId }, server);

  server.addEventListener('message', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string);
      const msgType: WSData['type'] = data.type;
      switch (msgType) {
        case 'typing':
          broadcast(room, { type: 'typing', userId, isTyping: data.isTyping }, server);
          break;
        case 'message':
          broadcast(room, { type: 'message', payload: data.payload });
          break;
        case 'message_status':
          broadcast(room, { type: 'message_status', payload: data.payload });
          break;
        case 'status':
          broadcast(room, { type: 'status', payload: data.payload });
          break;
        case 'read_messages':
          broadcast(room, { type: 'messages_read', ...data });
          break;
        default:
          break;
      }
    } catch (_) {
      // ignore invalid payloads
    }
  });

  server.addEventListener('close', () => {
    rooms.get(room)?.delete(server);
    broadcast(room, { type: 'left', userId });
  });

  // Cast to any because TypeScript DOM lib doesn't include `webSocket` in ResponseInit yet
  return new Response(null, {
    status: 101,
    // @ts-ignore
    webSocket: client,
  } as any);
} 