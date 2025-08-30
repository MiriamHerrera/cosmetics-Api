#!/bin/bash

# Script de deploy para Railway con inicialización de base de datos
# Este script se ejecuta después del deploy para asegurar que la BD esté lista

echo "🚀 Iniciando deploy en Railway..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio backend."
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar que las variables de entorno estén configuradas
echo "🔍 Verificando variables de entorno..."
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  Advertencia: Algunas variables de entorno de BD no están configuradas"
    echo "   DB_HOST: ${DB_HOST:-'NO CONFIGURADO'}"
    echo "   DB_USER: ${DB_USER:-'NO CONFIGURADO'}"
    echo "   DB_PASSWORD: ${DB_PASSWORD:+'CONFIGURADO'}"
else
    echo "✅ Variables de entorno de BD configuradas"
fi

# Esperar un poco para que MySQL esté listo
echo "⏳ Esperando que MySQL esté listo..."
sleep 10

# Intentar inicializar la base de datos
echo "🔧 Inicializando base de datos..."
if node scripts/initialize-database-railway.js; then
    echo "✅ Base de datos inicializada correctamente"
else
    echo "⚠️  Error inicializando BD, intentando fix específico..."
    if node scripts/fix-surveys-railway.js; then
        echo "✅ Fix de encuestas aplicado correctamente"
    else
        echo "❌ Error aplicando fix de encuestas"
        echo "⚠️  Continuando con el deploy..."
    fi
fi

# Verificar que el servidor pueda iniciar
echo "🔍 Verificando que el servidor pueda iniciar..."
if timeout 30s node -e "
const { testConnection } = require('./src/config/database');
testConnection().then(connected => {
    if (connected) {
        console.log('✅ Conexión a BD exitosa');
        process.exit(0);
    } else {
        console.log('❌ Conexión a BD falló');
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
"; then
    echo "✅ Servidor puede conectarse a la BD"
else
    echo "❌ Error: Servidor no puede conectarse a la BD"
    echo "⚠️  El deploy continuará pero puede fallar al iniciar"
fi

# Iniciar el servidor
echo "🚀 Iniciando servidor..."
exec node server.js
