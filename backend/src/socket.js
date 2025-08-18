const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Unir al usuario a una sala específica (opcional)
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
    });

    // Unir al usuario a la sala de productos
    socket.on('join-products', () => {
      socket.join('products-room');
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io no está inicializado');
  }
  return io;
};

// Función para emitir cambios de productos
const emitProductChange = (changeType, data) => {
  if (io) {
    io.to('products-room').emit('product-change', {
      type: changeType, // 'added', 'updated', 'deleted', 'stock-changed'
      data: data
    });
  }
};

// Función para emitir cambios de carrito
const emitCartChange = (userId, cartData) => {
  if (io) {
    io.to(`user-${userId}`).emit('cart-change', cartData);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitProductChange,
  emitCartChange
}; 