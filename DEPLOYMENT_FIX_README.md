# 🚀 Guía de Solución de Problemas de Despliegue

## 📋 Problemas Identificados y Solucionados

### ❌ **Problemas Críticos Encontrados:**

1. **Tabla `survey_options` faltante** - Se usaba en el código pero no se creaba
2. **Tabla `survey_votes` faltante** - Se usaba en el código pero no se creaba  
3. **Datos mínimos no se insertaban** - La base de datos quedaba vacía
4. **Configuración incompleta** - Faltaban tablas esenciales para el funcionamiento

### ✅ **Soluciones Implementadas:**

1. **Script completo de inicialización** - `backend/scripts/initialize-database.js`
2. **Tablas faltantes agregadas** - `survey_options` y `survey_votes`
3. **Datos mínimos automáticos** - Usuario admin, productos, encuestas
4. **Comandos npm agregados** - Para facilitar la inicialización

## 🔧 **Pasos para Solucionar el Despliegue**

### **Paso 1: Ejecutar Inicialización de Base de Datos**

En tu servidor Railway, ejecuta:

```bash
# Conectar al servidor Railway
railway login
railway link

# Ejecutar inicialización de base de datos
railway run npm run db:setup
```

### **Paso 2: Verificar Variables de Entorno**

Asegúrate de que estas variables estén configuradas en Railway:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=cosmetics_db
DB_PORT=3306

# JWT
JWT_SECRET=tu_super_secret_jwt_key_aqui
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### **Paso 3: Verificar Frontend**

En tu frontend de Vercel, asegúrate de que estas variables estén configuradas:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api
NEXT_PUBLIC_WHATSAPP_NUMBER=8124307494
NEXT_PUBLIC_BUSINESS_NAME=Cosméticos Store
```

## 🗄️ **Estructura de Base de Datos Completada**

### **Tablas Creadas:**
- ✅ `users` - Usuarios del sistema
- ✅ `categories` - Categorías de productos
- ✅ `product_types` - Tipos de productos
- ✅ `products` - Productos del catálogo
- ✅ `carts_unified` - Carritos unificados
- ✅ `cart_items_unified` - Items del carrito
- ✅ `delivery_locations` - Ubicaciones de entrega
- ✅ `orders` - Órdenes de compra
- ✅ `order_items` - Items de las órdenes
- ✅ `reservations` - Reservaciones de productos
- ✅ `surveys` - Encuestas del sistema
- ✅ `survey_options` - Opciones de encuesta
- ✅ `survey_votes` - Votos de encuesta

### **Datos Mínimos Insertados:**
- 👤 **Usuario Admin**: `admin` / `password` / `1234567890`
- 🏷️ **Categoría**: "Cosméticos"
- 📦 **Tipo**: "Maquillaje"
- 💄 **Producto**: "Labial de Prueba" ($19.99)
- 📊 **Encuesta**: "¿Te gusta el nuevo sistema?"
- 📍 **Ubicación**: "Oficina Central"

## 🚀 **Comandos Disponibles**

```bash
# Inicializar base de datos completa
npm run db:setup

# Inicializar solo base de datos
npm run db:init

# Iniciar servidor
npm start

# Modo desarrollo
npm run dev
```

## 🔍 **Verificación del Despliegue**

### **Backend (Railway):**
1. ✅ Base de datos MySQL funcionando
2. ✅ Servidor iniciado en puerto 8000
3. ✅ Limpieza automática de carritos activa
4. ✅ Todas las tablas creadas correctamente

### **Frontend (Vercel):**
1. ✅ Build completado exitosamente
2. ✅ Aplicación desplegada
3. ✅ Solo warnings menores (no críticos)

## 🐛 **Solución de Errores Comunes**

### **Error: "Table doesn't exist"**
```bash
# Ejecutar inicialización
npm run db:setup
```

### **Error: "Connection refused"**
- Verificar variables de entorno en Railway
- Verificar que MySQL esté corriendo

### **Error: "Cannot read property of undefined"**
- Verificar que las tablas tengan datos
- Ejecutar `npm run db:setup`

## 📱 **Credenciales de Acceso**

```
🔑 Panel de Administración:
   Usuario: admin
   Contraseña: password
   Teléfono: 1234567890
```

## 🔄 **Reinicio del Sistema**

Si persisten problemas:

1. **Reiniciar Railway:**
   ```bash
   railway restart
   ```

2. **Reiniciar Vercel:**
   - Ir a dashboard de Vercel
   - Hacer redeploy manual

3. **Verificar logs:**
   ```bash
   railway logs
   ```

## 📞 **Soporte**

Si los problemas persisten después de seguir esta guía:

1. Verificar logs completos de Railway
2. Verificar logs completos de Vercel
3. Revisar variables de entorno
4. Ejecutar script de inicialización

---

**🎯 Objetivo**: Con esta guía, tu aplicación debería funcionar correctamente en producción con todas las funcionalidades operativas.
