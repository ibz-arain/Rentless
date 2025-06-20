import { WSClient } from './ws';

export function io(url?: string, opts?: { query?: Record<string, any> }) {
  const path = url || process.env.NEXT_PUBLIC_SOCKET_URL || '/api/socket';
  const query = opts?.query || {};
  const client = new WSClient(path, query);
  const api = {
    on: (event: string, cb: any) => client.on(event, cb),
    off: (event: string, cb: any) => client.off(event, cb),
    emit: (event: string, data: any) => client.emit(event, data),
    disconnect: () => client.close(),
  } as any; // cast to any to satisfy existing Socket type usage

  return api;
} 