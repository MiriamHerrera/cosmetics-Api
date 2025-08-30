# Script para arreglar la tabla users en Railway
Write-Host "🔧 Fix para tabla users en Railway" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "scripts/fix-users-table.js")) {
    Write-Host "❌ Error: Debes ejecutar este script desde el directorio 'backend'" -ForegroundColor Red
    Write-Host "   Directorio actual: $(Get-Location)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Solución: cd backend" -ForegroundColor Cyan
    Read-Host "Presiona Enter para salir"
    exit 1
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
Write-Host "🚀 Ejecutando fix de tabla users..." -ForegroundColor Green
Write-Host "   Este script verificará y arreglará la estructura de la tabla users:" -ForegroundColor Cyan
Write-Host "   - Agregará columna phone si falta" -ForegroundColor White
Write-Host "   - Agregará columna email si falta" -ForegroundColor White
Write-Host "   - Agregará columna username si falta" -ForegroundColor White
Write-Host "   - Agregará columna role si falta" -ForegroundColor White
Write-Host "   - Agregará columna is_active si falta" -ForegroundColor White
Write-Host "   - Agregará columna updated_at si falta" -ForegroundColor White
Write-Host ""

try {
    node scripts/fix-users-table.js
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "🎉 ¡Fix aplicado exitosamente!" -ForegroundColor Green
        Write-Host "✅ La tabla users está lista en Railway" -ForegroundColor Green
        Write-Host "🔄 Ahora puedes probar el login nuevamente" -ForegroundColor Cyan
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
Write-Host "   - Script ejecutado: fix-users-table.js" -ForegroundColor White
Write-Host "   - Base de datos objetivo: Railway" -ForegroundColor White
Write-Host "   - Tabla arreglada: users" -ForegroundColor White

Write-Host ""
Read-Host "Presiona Enter para salir"
