# Usar Node.js 18 específicamente
FROM node:18.19.0-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 8000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8000

# Comando de inicio
CMD ["npm", "start"]
