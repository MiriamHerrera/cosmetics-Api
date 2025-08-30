# Script de PowerShell para aplicar fix de encuestas en Railway
# Ejecutar este script desde PowerShell como administrador

Write-Host "🔧 Fix para Tablas de Encuestas en Railway - Windows" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio backend." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Directorio correcto detectado" -ForegroundColor Green

# Verificar si existe archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  No se encontró archivo .env" -ForegroundColor Yellow
    Write-Host "📝 Creando archivo .env de ejemplo..." -ForegroundColor Yellow
    
    $envContent = @"
# Variables de entorno para Railway
# Configura estos valores con tus credenciales reales de Railway

# Configuración de la base de datos de Railway
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=railway
DB_PORT=3306

# Otras variables de entorno
NODE_ENV=production
PORT=8000

# Configuración de JWT
JWT_SECRET=tu_jwt_secret_aqui
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "📝 Archivo .env creado. Por favor, edítalo con tus credenciales reales de Railway." -ForegroundColor Yellow
    Write-Host "🔑 Puedes encontrar estas credenciales en el dashboard de Railway > Variables" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Presiona Enter cuando hayas configurado el archivo .env..." -ForegroundColor Cyan
    Read-Host
}

# Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules/mysql2")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install mysql2 dotenv
} else {
    Write-Host "✅ Dependencias ya instaladas" -ForegroundColor Green
}

# Mostrar opciones
Write-Host ""
Write-Host "🚀 Opciones para aplicar el fix:" -ForegroundColor Green
Write-Host "1. Ejecutar script de fix específico para Railway" -ForegroundColor Cyan
Write-Host "2. Ejecutar inicialización completa de base de datos" -ForegroundColor Cyan
Write-Host "3. Solo verificar conexión a Railway" -ForegroundColor Cyan
Write-Host "4. Salir" -ForegroundColor Cyan
Write-Host ""

$opcion = Read-Host "Selecciona una opción (1-4)"

switch ($opcion) {
    "1" {
        Write-Host "🔧 Ejecutando fix específico para Railway..." -ForegroundColor Green
        node scripts/fix-surveys-railway-only.js
    }
    "2" {
        Write-Host "🚀 Ejecutando inicialización completa..." -ForegroundColor Green
        node scripts/initialize-database-railway.js
    }
    "3" {
        Write-Host "🔍 Verificando conexión a Railway..." -ForegroundColor Green
        node -e "
        const mysql = require('mysql2/promise');
        require('dotenv').config();
        
        const dbConfig = {
            host: process.env.DB_HOST || 'mysql.railway.internal',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'railway',
            port: process.env.DB_PORT || 3306
        };
        
        console.log('🔍 CONFIGURACIÓN DE BASE DE DATOS:');
        console.log('Host:', dbConfig.host);
        console.log('Usuario:', dbConfig.user);
        console.log('Base de datos:', dbConfig.database);
        console.log('Puerto:', dbConfig.port);
        console.log('¿Tiene contraseña?', dbConfig.password ? 'SÍ' : 'NO');
        
        mysql.createConnection(dbConfig)
            .then(connection => {
                console.log('✅ Conexión a MySQL de Railway establecida correctamente');
                return connection.query('SHOW TABLES');
            })
            .then(([tables]) => {
                const tableNames = tables.map(row => Object.values(row)[0]);
                console.log('📋 Tablas existentes en Railway:', tableNames);
                console.log('🔍 Buscando tablas de encuestas...');
                
                const surveyTables = tableNames.filter(name => name.includes('survey'));
                if (surveyTables.length > 0) {
                    console.log('✅ Tablas de encuestas encontradas:', surveyTables);
                } else {
                    console.log('❌ No se encontraron tablas de encuestas');
                }
                
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Error conectando a MySQL de Railway:', error.message);
                process.exit(1);
            });
        "
    }
    "4" {
        Write-Host "👋 ¡Hasta luego!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "❌ Opción no válida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Green
Write-Host "1. Si el script se ejecutó exitosamente, reinicia tu aplicación en Railway" -ForegroundColor Cyan
Write-Host "2. Verifica que el error de 'Table surveys doesn't exist' haya desaparecido" -ForegroundColor Cyan
Write-Host "3. Si tienes problemas, revisa los logs de Railway" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Enter para salir..." -ForegroundColor Cyan
Read-Host
