const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config/env');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Basic Authentication middleware for Socket.IO
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.user.id}`);
      
      // Join a personal room based on user ID for targeted notifications
      socket.join(socket.user.id);

      // Role based rooms
      socket.join(socket.user.role);

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.user.id}`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
