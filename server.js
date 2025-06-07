const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create native HTTP server to share between Next.js and Socket.IO
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Attach Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('join', (conversationId) => {
      console.log(`Socket ${socket.id} joining room: conversation_${conversationId}`);
      socket.join(`conversation_${conversationId}`);
    });
    socket.on('message', (message) => {
      console.log('Socket received message event:', message);
      io.to(`conversation_${message.conversation_id}`).emit('message', message);
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server listening on http://${hostname}:${port}`);
  });
}); 