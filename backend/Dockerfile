# Usar Node.js 18 específicamente
FROM node:18.19.0-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production --silent

# Copiar código fuente
COPY . .

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Exponer puerto
EXPOSE 8000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8000

# Comando de inicio
CMD ["npm", "start"]
