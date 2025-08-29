# Usar Node.js 18 Alpine para un container ligero
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar solo los archivos del backend
COPY package*.json ./
COPY src/ ./src/
COPY server.js ./
COPY debug-startup.js ./

# Instalar dependencias
RUN npm ci --only=production

# Exponer puerto (Railway lo maneja automáticamente)
EXPOSE 8000

# Ejecutar diagnóstico primero, luego iniciar servidor
CMD ["sh", "-c", "node debug-startup.js && node server.js"]
