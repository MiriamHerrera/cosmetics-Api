# Usar Node.js 18 Alpine para un container ligero
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar solo los archivos del backend
COPY package*.json ./
COPY src/ ./src/
COPY server.js ./

# Instalar dependencias
RUN npm ci --only=production

# Exponer puerto (Railway lo maneja automáticamente)
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
