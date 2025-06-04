import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { NextApiResponse } from 'next';

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!res.socket) {
    res.status(400).end();
    return;
  }
  if (!(res.socket as any).server.io) {
    const io = new Server(res.socket.server);
    (res.socket as any).server.io = io;
    io.on('connection', (socket) => {
      socket.on('join', (room: string) => {
        socket.join(room);
      });
      socket.on('message', (room: string, msg: any) => {
        socket.to(room).emit('message', msg);
      });
    });
  }
  res.end();
};

export default ioHandler;
export const config = {
  api: {
    bodyParser: false,
  },
};
