#!/bin/bash

# Script para restaurar imágenes después del deploy
# Este script debe ejecutarse después del deploy en Railway

echo "🖼️  Iniciando restauración de imágenes..."

# Buscar el backup más reciente
LATEST_BACKUP=$(ls -t image-backups/ | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No se encontraron backups de imágenes"
    echo "ℹ️  Las imágenes se perderán en este deploy"
    exit 1
fi

BACKUP_PATH="image-backups/$LATEST_BACKUP"

echo "📁 Restaurando desde backup: $BACKUP_PATH"

# Verificar que el backup existe
if [ ! -d "$BACKUP_PATH/products" ]; then
    echo "❌ El backup no contiene imágenes válidas"
    exit 1
fi

# Crear directorio de uploads si no existe
mkdir -p uploads/products

# Restaurar imágenes
echo "📸 Restaurando imágenes..."
cp -r "$BACKUP_PATH/products/"* uploads/products/

# Contar imágenes restauradas
RESTORED_COUNT=$(find uploads/products -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \) | wc -l)

echo "✅ Restauración completada: $RESTORED_COUNT imágenes restauradas"
echo "📁 Imágenes disponibles en: uploads/products"

# Mostrar información del backup
if [ -f "$BACKUP_PATH/backup-info.txt" ]; then
    echo "📋 Información del backup:"
    cat "$BACKUP_PATH/backup-info.txt"
fi

echo "🎯 Restauración de imágenes completada"
