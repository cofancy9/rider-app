const socketIO = require('socket.io');
const socketConfig = require('../config/socket.config');
const logger = require('../utils/logger');

class SocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
  }

  initialize(server) {
    this.io = socketIO(server, socketConfig);
    this.setupEventHandlers();
    logger.info('Socket.IO server initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    socket.on('authenticate', (userData) => {
      this.authenticateUser(socket, userData);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  authenticateUser(socket, userData) {
    if (userData && userData.userId) {
      this.connections.set(userData.userId, socket.id);
      socket.join(`user:${userData.userId}`);
      logger.info(`User ${userData.userId} authenticated`);
    }
  }

  handleDisconnect(socket) {
    for (const [userId, socketId] of this.connections.entries()) {
      if (socketId === socket.id) {
        this.connections.delete(userId);
        logger.info(`User ${userId} disconnected`);
        break;
      }
    }
  }

  sendToUser(userId, eventName, data) {
    try {
      const socketId = this.connections.get(userId);
      if (socketId) {
        this.io.to(socketId).emit(eventName, data);
        logger.info(`Notification sent to user ${userId}: ${eventName}`);
      } else {
        // If socket not found, log it but don't throw error
        logger.warn(`User ${userId} not connected, notification queued: ${eventName}`);
      }
    } catch (error) {
      logger.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  broadcast(eventName, data) {
    try {
      this.io.emit(eventName, data);
      logger.info(`Broadcast sent: ${eventName}`);
    } catch (error) {
      logger.error(`Error broadcasting message:`, error);
    }
  }

  // Helper method to check if user is connected
  isUserConnected(userId) {
    return this.connections.has(userId);
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.connections.keys());
  }

  // Get connection count
  getConnectionCount() {
    return this.connections.size;
  }
}

// Create and export singleton instance
const socketService = new SocketService();
module.exports = socketService;