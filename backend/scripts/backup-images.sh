#!/bin/bash

# Script para hacer backup de imágenes antes del deploy
# Este script debe ejecutarse antes de hacer push a producción

echo "🖼️  Iniciando backup de imágenes..."

# Crear directorio de backup si no existe
BACKUP_DIR="image-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Verificar si existe el directorio de uploads
if [ -d "uploads/products" ]; then
    echo "📁 Copiando imágenes de productos..."
    
    # Crear backup de todas las imágenes
    cp -r uploads/products "$BACKUP_DIR/"
    
    # Contar imágenes
    IMAGE_COUNT=$(find uploads/products -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \) | wc -l)
    
    echo "✅ Backup completado: $IMAGE_COUNT imágenes respaldadas en $BACKUP_DIR"
    echo "📁 Ubicación del backup: $BACKUP_DIR"
    
    # Crear archivo de información del backup
    echo "Backup creado: $(date)" > "$BACKUP_DIR/backup-info.txt"
    echo "Imágenes respaldadas: $IMAGE_COUNT" >> "$BACKUP_DIR/backup-info.txt"
    echo "Directorio original: uploads/products" >> "$BACKUP_DIR/backup-info.txt"
    
else
    echo "⚠️  No se encontró el directorio uploads/products"
    echo "ℹ️  Creando directorio vacío para el backup..."
    mkdir -p "$BACKUP_DIR/products"
    echo "Backup vacío creado: $(date)" > "$BACKUP_DIR/backup-info.txt"
fi

echo "🎯 Backup listo para deploy"
