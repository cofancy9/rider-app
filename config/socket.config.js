module.exports = {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true
  },
  connectionTimeout: 60000,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6
};
const logger = require('../utils/logger');

const getSocketConfig = () => {
  const config = {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization"],
      credentials: true
    },
    path: '/socket.io',
    serveClient: false,
    connectionTimeout: 60000,
    pingTimeout: process.env.NODE_ENV === 'production' ? 120000 : 60000,
    pingInterval: process.env.NODE_ENV === 'production' ? 30000 : 25000,
    maxHttpBufferSize: process.env.NODE_ENV === 'production' ? 5e5 : 1e6,
    transports: process.env.NODE_ENV === 'production' ? ['websocket'] : ['websocket', 'polling'],
    cookie: {
      name: 'rider_socket',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  };

  if (process.env.NODE_ENV === 'production') {
    config.cors.origin = process.env.CORS_ORIGIN;
    config.allowUpgrades = false;
    config.perMessageDeflate = {
      threshold: 1024
    };
  }

  return config;
};

const socketHandlers = {
  onConnection: (socket) => {
    logger.info(`New client connected: ${socket.id}`);
    
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  },

  onError: (err) => {
    logger.error('Socket.IO error:', err);
  }
};

const authMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                 socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.warn(`Socket connection attempt without token: ${socket.id}`);
      return next(new Error('Authentication required'));
    }
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

module.exports = {
  getSocketConfig,
  socketHandlers,
  authMiddleware
};
