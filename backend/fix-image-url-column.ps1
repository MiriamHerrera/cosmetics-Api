# Script de PowerShell para agregar la columna image_url a la tabla products
# Ejecutar este script desde el directorio backend

Write-Host "🔧 Agregando columna image_url a la tabla products..." -ForegroundColor Yellow

try {
    # Ejecutar el script JavaScript
    Write-Host "📝 Ejecutando migración JavaScript..." -ForegroundColor Cyan
    node scripts/add-image-url-column.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migración completada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error en la migración JavaScript" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error ejecutando la migración: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Proceso completado. La columna image_url ha sido agregada a la tabla products." -ForegroundColor Green
