# Script simple para aplicar fix de Railway
# Sin errores de sintaxis

Write-Host "🔧 Fix para Railway - Creando tablas de encuestas" -ForegroundColor Green
Write-Host ""

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "scripts/fix-railway-sequential.js")) {
    Write-Host "❌ Error: Debes ejecutar este script desde el directorio 'backend'" -ForegroundColor Red
    Write-Host "   Directorio actual: $(Get-Location)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Solución: cd backend" -ForegroundColor Cyan
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar si existe .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host "   Creando archivo .env con configuración de Railway..." -ForegroundColor Cyan
    
    # Crear .env básico
    @"
# Configuración de Railway
DB_HOST=mysql.railway.internal
DB_USER=root
DB_PASSWORD=
DB_NAME=railway
DB_PORT=3306
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
    Write-Host "   IMPORTANTE: Edita el archivo .env con tus credenciales reales de Railway" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules/mysql2")) {
    Write-Host "   Instalando mysql2..." -ForegroundColor Yellow
    npm install mysql2 dotenv
} else {
    Write-Host "   ✅ mysql2 ya está instalado" -ForegroundColor Green
}

Write-Host ""

# Ejecutar el fix
Write-Host "🚀 Ejecutando fix secuencial..." -ForegroundColor Green
Write-Host "   Este script creará las tablas en el orden correcto:" -ForegroundColor Cyan
Write-Host "   1. users (base)" -ForegroundColor White
Write-Host "   2. categories (base)" -ForegroundColor White
Write-Host "   3. product_types (base)" -ForegroundColor White
Write-Host "   4. products (base)" -ForegroundColor White
Write-Host "   5. surveys (depende de users)" -ForegroundColor White
Write-Host "   6. survey_options (depende de surveys y users)" -ForegroundColor White
Write-Host "   7. survey_votes (depende de surveys, options y users)" -ForegroundColor White
Write-Host ""

try {
    node scripts/fix-railway-sequential.js
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "🎉 ¡Fix aplicado exitosamente!" -ForegroundColor Green
        Write-Host "✅ Las tablas de encuestas están listas en Railway" -ForegroundColor Green
        Write-Host "🔄 Reinicia tu aplicación en Railway para que funcione" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ El fix falló con código de salida: $exitCode" -ForegroundColor Red
        Write-Host "   Revisa los errores arriba y verifica tu configuración" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error ejecutando el script: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Resumen:" -ForegroundColor Cyan
Write-Host "   - Script ejecutado: fix-railway-sequential.js" -ForegroundColor White
Write-Host "   - Base de datos objetivo: Railway" -ForegroundColor White
Write-Host "   - Tablas creadas: users, categories, product_types, products, surveys, survey_options, survey_votes" -ForegroundColor White

Write-Host ""
Read-Host "Presiona Enter para salir"
