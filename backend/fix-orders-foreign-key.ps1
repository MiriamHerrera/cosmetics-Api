# Script para corregir incompatibilidad de tipos en tabla orders
# Problema: user_id y id tienen tipos incompatibles para foreign key

Write-Host "🔧 Corrigiendo incompatibilidad de tipos en tabla orders" -ForegroundColor Green
Write-Host ""

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "scripts/fix-orders-foreign-key.js")) {
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

# Explicar el problema
Write-Host "🚨 Problema identificado:" -ForegroundColor Red
Write-Host "   Error: 'Referencing column user_id and referenced column id in foreign key constraint orders_ibfk_1 are incompatible'" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Causa:" -ForegroundColor Yellow
Write-Host "   - La tabla users.id tiene un tipo de dato (ej: bigint)" -ForegroundColor White
Write-Host "   - La tabla orders.user_id tiene un tipo diferente (ej: int)" -ForegroundColor White
Write-Host "   - MySQL no puede crear la restricción de clave foránea" -ForegroundColor White
Write-Host ""

# Explicar la solución
Write-Host "🛠️  Solución:" -ForegroundColor Cyan
Write-Host "   1. Verificar tipos actuales de ambas columnas" -ForegroundColor White
Write-Host "   2. Modificar orders.user_id para que coincida con users.id" -ForegroundColor White
Write-Host "   3. Recrear la restricción de clave foránea" -ForegroundColor White
Write-Host "   4. Si falla, aplicar corrección alternativa" -ForegroundColor White
Write-Host ""

# Ejecutar la corrección
Write-Host "🚀 Ejecutando corrección..." -ForegroundColor Green

try {
    node scripts/fix-orders-foreign-key.js
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "🎉 ¡Corrección aplicada exitosamente!" -ForegroundColor Green
        Write-Host "✅ La restricción de clave foránea orders_ibfk_1 está funcionando" -ForegroundColor Green
        Write-Host "🔄 Reinicia tu aplicación para verificar que no hay más errores" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ La corrección falló con código de salida: $exitCode" -ForegroundColor Red
        Write-Host "   Revisa los errores arriba y verifica tu configuración" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error ejecutando el script: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Resumen de la corrección:" -ForegroundColor Cyan
Write-Host "   - Script ejecutado: fix-orders-foreign-key.js" -ForegroundColor White
Write-Host "   - Problema: Incompatibilidad de tipos en foreign key" -ForegroundColor White
Write-Host "   - Solución: Alinear tipos de user_id e id" -ForegroundColor White
Write-Host "   - Resultado: Restricción de clave foránea funcional" -ForegroundColor White

Write-Host ""
Write-Host "🔍 Para verificar manualmente:" -ForegroundColor Cyan
Write-Host "   - Conecta a Railway MySQL" -ForegroundColor White
Write-Host "   - Ejecuta: DESCRIBE users;" -ForegroundColor White
Write-Host "   - Ejecuta: DESCRIBE orders;" -ForegroundColor White
Write-Host "   - Verifica que user_id e id tengan tipos compatibles" -ForegroundColor White

Write-Host ""
Read-Host "Presiona Enter para salir"
