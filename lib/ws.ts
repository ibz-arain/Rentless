export type Listener = (data: any) => void;

export class WSClient {
  private ws: WebSocket;
  private listeners: Map<string, Set<Listener>> = new Map();

  constructor(path: string, query: Record<string, string | number>) {
    const url = new URL(path, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    url.protocol = url.protocol.replace('http', 'ws');
    this.ws = new WebSocket(url.toString());
    this.ws.addEventListener('message', (e) => {
      try {
        const parsed = JSON.parse(e.data);
        const { type, ...rest } = parsed;
        this.listeners.get(type)?.forEach((cb) => cb(rest));
      } catch (_) {}
    });
  }

  on(type: string, cb: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(cb);
  }

  off(type: string, cb: Listener) {
    this.listeners.get(type)?.delete(cb);
  }

  emit(type: string, data: any = {}) {
    this.ws.send(JSON.stringify({ type, ...data }));
  }

  close() {
    this.ws.close();
  }
} 