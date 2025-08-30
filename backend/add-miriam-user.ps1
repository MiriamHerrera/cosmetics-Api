# Script de PowerShell para agregar usuario Miriam Herrera
# Ejecutar este script desde el directorio backend

Write-Host "👤 Agregando usuario Miriam Herrera..." -ForegroundColor Yellow

try {
    # Ejecutar el script JavaScript
    Write-Host "📝 Ejecutando script de creación de usuario..." -ForegroundColor Cyan
    node scripts/add-miriam-user.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Usuario Miriam Herrera creado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Error creando el usuario" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error ejecutando el script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Proceso completado. El usuario Miriam Herrera ha sido agregado a la base de datos." -ForegroundColor Green
