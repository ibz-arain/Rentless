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

  // Track connected users and their rooms
  const connectedUsers = new Map();
  const userRooms = new Map();

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    // Store user information from query params
    const userId = socket.handshake.query.userId;
    const conversationId = socket.handshake.query.conversationId;
    
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Track which rooms this user is in
      if (!userRooms.has(userId)) {
        userRooms.set(userId, new Set());
      }
      
      // If conversationId is provided, automatically join that room
      if (conversationId) {
        const roomName = `conversation_${conversationId}`;
        socket.join(roomName);
        userRooms.get(userId).add(roomName);
        console.log(`User ${userId} automatically joined room: ${roomName}`);
      }
    }
    
    socket.on('join', (conversationId) => {
      if (!conversationId) return;
      
      const roomName = `conversation_${conversationId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joining room: ${roomName}`);
      
      // Track this room for the user
      if (userId && userRooms.has(userId)) {
        userRooms.get(userId).add(roomName);
      }
    });
    
    socket.on('message', (message) => {
      console.log('Socket received message event:', message);
      if (!message || !message.conversation_id) {
        console.error('Invalid message format:', message);
        return;
      }
      
      const roomName = `conversation_${message.conversation_id}`;
      
      // Broadcast to everyone in the room including sender (for consistency)
      io.to(roomName).emit('message', message);
      console.log(`Message broadcast to room ${roomName}`);
    });
    
    socket.on('typing', (data) => {
      console.log('Typing event:', data);
      if (!data || !data.conversationId) {
        console.error('Invalid typing data:', data);
        return;
      }
      
      const roomName = `conversation_${data.conversationId}`;
      // Broadcast to everyone in the room except the sender
      socket.to(roomName).emit('typing', {
        userId: userId,
        isTyping: data.isTyping
      });
      console.log(`Typing event broadcast to room ${roomName}`);
    });
    
    socket.on('message_status', (data) => {
      console.log('Message status update:', data);
      if (!data || !data.conversationId || !data.messageId || !data.status) {
        console.error('Invalid message status data:', data);
        return;
      }
      
      const roomName = `conversation_${data.conversationId}`;
      io.to(roomName).emit('message_status', {
        messageId: data.messageId,
        status: data.status
      });
      console.log(`Message status update broadcast to room ${roomName}`);
    });
    
    socket.on('read_messages', (data) => {
      console.log('Read messages event:', data);
      if (!data || !data.conversationId || !data.messageIds || !data.messageIds.length) {
        console.error('Invalid read messages data:', data);
        return;
      }
      
      const roomName = `conversation_${data.conversationId}`;
      io.to(roomName).emit('messages_read', {
        messageIds: data.messageIds
      });
      console.log(`Read messages event broadcast to room ${roomName}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      // Remove user from connected users
      if (userId) {
        connectedUsers.delete(userId);
        userRooms.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server listening on http://${hostname}:${port}`);
  });
}); 