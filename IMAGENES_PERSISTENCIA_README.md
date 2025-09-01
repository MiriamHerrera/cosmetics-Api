# 🖼️ Persistencia de Imágenes en Deploys

## Problema Identificado

**Las imágenes se eliminan automáticamente después de aprobar un Pull Request y hacer deploy en Railway.**

### Causas:
1. **Dockerfile no incluye uploads**: El container se recrea desde cero en cada deploy
2. **No hay persistencia de archivos**: Railway no mantiene archivos entre deploys
3. **Imágenes no están en Git**: El directorio `uploads/` no se versiona

## Soluciones Implementadas

### 1. ✅ Dockerfile Modificado
- Incluye `COPY uploads/ ./uploads/`
- Crea directorio `uploads/products/` en el container

### 2. ✅ .dockerignore Actualizado
- Excluye explícitamente `uploads/` del ignore
- Asegura que las imágenes se incluyan en el build

### 3. ✅ Scripts de Backup/Restore
- `backup-images.sh`: Hace backup antes del deploy
- `restore-images.sh`: Restaura imágenes después del deploy
- Integrado en `deploy-railway.sh`

## 🔄 Flujo de Trabajo Recomendado

### Antes de hacer Push/Deploy:
```bash
cd backend
chmod +x scripts/backup-images.sh
./scripts/backup-images.sh
git add .
git commit -m "Backup de imágenes antes del deploy"
git push
```

### Después del Deploy:
- El script `deploy-railway.sh` automáticamente restaura las imágenes
- Las imágenes se restauran desde el backup más reciente

## 📁 Estructura de Directorios

```
backend/
├── uploads/
│   └── products/          # Imágenes de productos
├── image-backups/         # Backups automáticos
│   └── YYYYMMDD_HHMMSS/  # Timestamp del backup
├── scripts/
│   ├── backup-images.sh   # Script de backup
│   └── restore-images.sh  # Script de restore
└── deploy-railway.sh      # Deploy con restore automático
```

## 🚀 Comandos Útiles

### Hacer backup manual:
```bash
cd backend
./scripts/backup-images.sh
```

### Restaurar manualmente:
```bash
cd backend
./scripts/restore-images.sh
```

### Verificar imágenes:
```bash
cd backend
find uploads/products -type f | wc -l
ls -la uploads/products/
```

## ⚠️ Consideraciones Importantes

1. **Tamaño de backup**: Las imágenes pueden ocupar mucho espacio
2. **Frecuencia de backup**: Se recomienda hacer backup antes de cada deploy
3. **Limpieza**: Considerar limpiar backups antiguos periódicamente
4. **Git LFS**: Para proyectos grandes, considerar usar Git LFS para imágenes

## 🔧 Solución Alternativa: Almacenamiento Externo

Para una solución más robusta, considerar:
- **AWS S3**: Almacenamiento en la nube
- **Cloudinary**: Servicio de imágenes optimizado
- **Railway Volumes**: Volúmenes persistentes de Railway

## 📝 Notas de Implementación

- Los scripts están configurados para ejecutarse automáticamente
- El backup se hace con timestamp para evitar conflictos
- La restauración se ejecuta durante el deploy de Railway
- Se mantiene compatibilidad con el sistema existente

## 🆘 Troubleshooting

### Si las imágenes no se restauran:
1. Verificar que existe el directorio `image-backups/`
2. Ejecutar manualmente: `./scripts/restore-images.sh`
3. Verificar permisos de los scripts: `chmod +x scripts/*.sh`

### Si el backup falla:
1. Verificar espacio en disco
2. Verificar permisos de escritura
3. Ejecutar con `bash -x` para debug detallado
