# Script simple para aplicar fix de encuestas en Railway
Write-Host "🔧 Fix para Tablas de Encuestas en Railway" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Verificar directorio
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encontró package.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Directorio correcto" -ForegroundColor Green

# Verificar archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Creando archivo .env..." -ForegroundColor Yellow
    
    $envContent = "DB_HOST=mysql.railway.internal`nDB_USER=root`nDB_PASSWORD=tu_password_aqui`nDB_NAME=railway`nDB_PORT=3306"
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "📝 Archivo .env creado. Edítalo con tus credenciales de Railway" -ForegroundColor Yellow
    Write-Host "🔑 Encuentra las credenciales en Railway > Variables" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Presiona Enter cuando hayas configurado .env..."
}

# Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules/mysql2")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install mysql2 dotenv
} else {
    Write-Host "✅ Dependencias ya instaladas" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Opciones:" -ForegroundColor Green
Write-Host "1. Fix específico para Railway" -ForegroundColor Cyan
Write-Host "2. Inicialización completa" -ForegroundColor Cyan
Write-Host "3. Verificar conexión" -ForegroundColor Cyan
Write-Host "4. Salir" -ForegroundColor Cyan
Write-Host ""

$opcion = Read-Host "Selecciona opción (1-4)"

if ($opcion -eq "1") {
    Write-Host "🔧 Ejecutando fix específico..." -ForegroundColor Green
    node scripts/fix-surveys-railway-only.js
}
elseif ($opcion -eq "2") {
    Write-Host "🚀 Ejecutando inicialización completa..." -ForegroundColor Green
    node scripts/initialize-database-railway.js
}
elseif ($opcion -eq "3") {
    Write-Host "🔍 Verificando conexión..." -ForegroundColor Green
    node -e "const mysql = require('mysql2/promise'); require('dotenv').config(); const dbConfig = { host: process.env.DB_HOST || 'mysql.railway.internal', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'railway', port: process.env.DB_PORT || 3306 }; console.log('Configuración:', dbConfig); mysql.createConnection(dbConfig).then(conn => { console.log('✅ Conexión exitosa'); return conn.query('SHOW TABLES'); }).then(([tables]) => { const names = tables.map(r => Object.values(r)[0]); console.log('Tablas:', names); const surveys = names.filter(n => n.includes('survey')); console.log('Tablas de encuestas:', surveys); process.exit(0); }).catch(err => { console.error('❌ Error:', err.message); process.exit(1); });"
}
elseif ($opcion -eq "4") {
    Write-Host "👋 ¡Hasta luego!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "❌ Opción no válida" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Green
Write-Host "1. Reinicia tu aplicación en Railway" -ForegroundColor Cyan
Write-Host "2. Verifica que el error haya desaparecido" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presiona Enter para salir"
