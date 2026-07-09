const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config/env');
const Project = require('./models/Project');

let io;

// In-memory state for tracking collaboration room participants
const collabRooms = {}; 
// Format: { [projectId]: { [socketId]: { id, name, status, role } } }

// In-memory state for ad-hoc room metadata and secure passwords
const adHocRoomsInfo = {};
// Format: { [roomId]: { projectName, topic, hostName, pin, createdAt } }

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000', 'https://d-evaluation-platform-teal.vercel.app'],
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

      // --- COLLABORATION ROOM LOGIC ---
      socket.on('create-adhoc-room', ({ projectName, topic, hostName }, callback) => {
        try {
          // Generate 6-char alphanumeric room code
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let roomId = '';
          for (let i = 0; i < 6; i++) roomId += chars.charAt(Math.floor(Math.random() * chars.length));
          
          // Generate secure 4-digit PIN
          const pin = Math.floor(1000 + Math.random() * 9000).toString();

          adHocRoomsInfo[roomId] = {
            projectName: projectName || 'Ad-Hoc Collaboration',
            topic,
            hostName,
            pin,
            createdAt: new Date()
          };
          
          console.log(`[ADHOC] Created room ${roomId} with PIN ${pin}`);
          if (callback) callback({ success: true, roomId, pin });
        } catch (error) {
          console.error('[ADHOC ERROR]', error);
          if (callback) callback({ success: false, message: 'Server error creating room' });
        }
      });

      socket.on('join-collab-room', async ({ projectId, userName, pin, type }) => {
        try {
          if (type !== 'adhoc') {
            const project = await Project.findById(projectId);
            if (!project) {
              return socket.emit('join-collab-error', { message: 'Project not found' });
            }

            console.log(`[COLLAB PIN DEBUG] DB PIN: '${project.collabPin}' (${typeof project.collabPin}), Input PIN: '${pin}' (${typeof pin})`);
            if (project.collabPin && project.collabPin.toString().trim() !== String(pin).trim()) {
              return socket.emit('join-collab-error', { message: 'Invalid Collaboration PIN' });
            }
          } else {
            // Ad-hoc room validation
            const adHocRoom = adHocRoomsInfo[projectId];
            if (!adHocRoom) {
              return socket.emit('join-collab-error', { message: 'Room does not exist or has expired' });
            }
            if (adHocRoom.pin !== String(pin).trim()) {
              return socket.emit('join-collab-error', { message: 'Invalid Room Password' });
            }
          }

          const roomName = `collab_${projectId}`;
          
          // Check capacity
          const room = io.sockets.adapter.rooms.get(roomName);
          const currentSize = room ? room.size : 0;

          if (currentSize >= 3) {
            return socket.emit('join-collab-error', { message: 'Collaboration room is full (max 3 users)' });
          }

          socket.join(roomName);
          console.log(`User ${userName} (${socket.user.id}) joined collab room ${roomName}`);

          // Track participant
          if (!collabRooms[projectId]) collabRooms[projectId] = {};
          collabRooms[projectId][socket.id] = {
            id: socket.user.id,
            name: userName,
            status: 'online', // 'online' | 'idle'
            role: socket.user.role
          };

          const responsePayload = { projectId, message: 'Joined workspace' };
          if (type === 'adhoc' && adHocRoomsInfo[projectId]) {
            responsePayload.projectName = adHocRoomsInfo[projectId].projectName;
          }
          
          socket.emit('join-collab-success', responsePayload);
          
          socket.to(roomName).emit('user-joined-collab', { 
            userId: socket.user.id, 
            userName,
            socketId: socket.id
          });

          // Broadcast participant list
          io.to(roomName).emit('room-participants', Object.values(collabRooms[projectId]));

        } catch (error) {
          console.error(error);
          socket.emit('join-collab-error', { message: 'Server error joining room' });
        }
      });

      socket.on('leave-collab-room', ({ projectId, userName }) => {
        const roomName = `collab_${projectId}`;
        socket.leave(roomName);
        
        // Remove participant
        if (collabRooms[projectId] && collabRooms[projectId][socket.id]) {
          delete collabRooms[projectId][socket.id];
          io.to(roomName).emit('room-participants', Object.values(collabRooms[projectId]));
        }

        socket.to(roomName).emit('user-left-collab', { 
          userId: socket.user.id, 
          userName 
        });
      });

      // --- USER STATUS ---
      socket.on('user-status-change', ({ projectId, status }) => {
        if (collabRooms[projectId] && collabRooms[projectId][socket.id]) {
          collabRooms[projectId][socket.id].status = status;
          const roomName = `collab_${projectId}`;
          io.to(roomName).emit('room-participants', Object.values(collabRooms[projectId]));
        }
      });

      // --- CODE SYNC LOGIC ---
      socket.on('file-content-change', ({ projectId, fileId, content }) => {
        const roomName = `collab_${projectId}`;
        socket.to(roomName).emit('file-content-change', { fileId, content });
      });

      socket.on('file-system-sync', ({ projectId, files }) => {
        const roomName = `collab_${projectId}`;
        socket.to(roomName).emit('file-system-sync', files);
      });

      socket.on('cursor-move', ({ projectId, position, userName }) => {
        const roomName = `collab_${projectId}`;
        socket.to(roomName).emit('cursor-sync', { 
          socketId: socket.id, 
          position, 
          userName 
        });
      });

      // --- WEBRTC SIGNALING LOGIC ---
      socket.on('webrtc-offer', ({ to, offer, userName }) => {
        // 'to' is the socket.id of the target peer
        io.to(to).emit('webrtc-offer', {
          from: socket.id,
          userName,
          offer
        });
      });

      socket.on('webrtc-answer', ({ to, answer }) => {
        io.to(to).emit('webrtc-answer', {
          from: socket.id,
          answer
        });
      });

      socket.on('webrtc-ice-candidate', ({ to, candidate }) => {
        io.to(to).emit('webrtc-ice-candidate', {
          from: socket.id,
          candidate
        });
      });

      // --- CHAT LOGIC ---
      socket.on('chat-message', ({ projectId, userName, text, messageId }) => {
        const roomName = `collab_${projectId}`;
        io.to(roomName).emit('chat-message', {
          id: messageId,
          userId: socket.user.id,
          userName,
          text,
          timestamp: new Date().toISOString(),
          isEdited: false
        });
      });

      socket.on('chat-edit-message', ({ projectId, messageId, text }) => {
        const roomName = `collab_${projectId}`;
        io.to(roomName).emit('chat-edit-message', {
          id: messageId,
          text
        });
      });

      socket.on('chat-delete-message', ({ projectId, messageId, userName }) => {
        const roomName = `collab_${projectId}`;
        io.to(roomName).emit('chat-delete-message', {
          id: messageId,
          userName
        });
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.user.id}`);
        // Clean up from all collab rooms
        for (const projectId in collabRooms) {
          if (collabRooms[projectId][socket.id]) {
            delete collabRooms[projectId][socket.id];
            const roomName = `collab_${projectId}`;
            io.to(roomName).emit('room-participants', Object.values(collabRooms[projectId]));
            io.to(roomName).emit('user-left-collab', { 
              userId: socket.user.id, 
              socketId: socket.id 
            });
          }
        }
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
