# 🚀 Guía de Deploy - Cosmetics API

## 📋 **Preparación del Proyecto**

### 1. **Variables de Entorno**
Copia el archivo `frontend/env.production.example` a `frontend/.env.production` y configura:

```bash
# Backend API URL (Railway, Heroku, etc.)
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app

# Número de WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=+1234567890

# Logs (deshabilitado en producción)
NEXT_PUBLIC_ENABLE_LOGS=false
```

### 2. **Build de Producción**
```bash
cd frontend
npm run build:prod
```

## 🌐 **Opciones de Hosting**

### **Opción 1: Vercel (Recomendado)**

#### **Ventajas:**
- ✅ **Gratis** para proyectos personales
- ✅ **Deploy automático** desde GitHub
- ✅ **Optimizado para Next.js**
- ✅ **SSL automático** y CDN global
- ✅ **Muy fácil de usar**

#### **Pasos:**
1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login a Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Configurar dominio personalizado** (opcional)

#### **Deploy Automático desde GitHub:**
1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. ¡Deploy automático en cada push!

---

### **Opción 2: Netlify**

#### **Ventajas:**
- ✅ **Gratis** para proyectos personales
- ✅ **Deploy automático** desde GitHub
- ✅ **Muy fácil de usar**
- ✅ **SSL automático**

#### **Pasos:**
1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
4. Configura las variables de entorno
5. ¡Deploy automático!

---

### **Opción 3: Railway (Backend + Frontend)**

#### **Ventajas:**
- ✅ **Backend + Frontend** en un solo lugar
- ✅ **Base de datos incluida**
- ✅ **Deploy automático**
- ✅ **SSL automático**

#### **Pasos:**
1. Ve a [railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Configura las variables de entorno
4. Deploy automático

---

## 🔧 **Configuración del Backend**

### **Railway (Recomendado para Backend):**

1. **Crear proyecto en Railway**
2. **Conectar repositorio** del backend
3. **Configurar variables de entorno:**
   ```bash
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=tu_url_de_base_de_datos
   JWT_SECRET=tu_jwt_secret_super_seguro
   ```

4. **Deploy automático**

### **Alternativas para Backend:**
- **Heroku** (gratis limitado)
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**

---

## 📱 **Configuración del Frontend**

### **Variables de Entorno Requeridas:**
```bash
# URL del backend en producción
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app

# Número de WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=+1234567890

# Ambiente
NODE_ENV=production
```

### **Build Commands:**
```bash
# Instalar dependencias
npm install

# Build de producción
npm run build:prod

# Iniciar en producción
npm run start:prod
```

---

## 🚀 **Pasos para Deploy Completo**

### **1. Preparar Backend:**
```bash
cd backend
# Configurar variables de entorno
# Deploy a Railway/Heroku
```

### **2. Preparar Frontend:**
```bash
cd frontend
# Configurar .env.production
# Deploy a Vercel/Netlify
```

### **3. Configurar Dominios:**
- **Backend:** `api.tudominio.com`
- **Frontend:** `tudominio.com`

### **4. Configurar CORS:**
En el backend, permitir tu dominio de frontend:
```javascript
app.use(cors({
  origin: ['https://tudominio.com', 'https://www.tudominio.com'],
  credentials: true
}));
```

---

## 🔒 **Seguridad en Producción**

### **Headers de Seguridad:**
- ✅ **X-Frame-Options:** DENY
- ✅ **X-Content-Type-Options:** nosniff
- ✅ **Referrer-Policy:** strict-origin-when-cross-origin

### **Variables de Entorno:**
- ✅ **Nunca** committear `.env` files
- ✅ **Usar** variables de entorno del hosting
- ✅ **JWT_SECRET** súper seguro

### **HTTPS:**
- ✅ **SSL automático** en Vercel/Netlify
- ✅ **Forzar HTTPS** en producción

---

## 📊 **Monitoreo y Analytics**

### **Vercel Analytics:**
- Métricas de rendimiento
- Análisis de usuarios
- Errores en tiempo real

### **Google Analytics:**
- Tracking de usuarios
- Comportamiento en el sitio
- Conversiones

---

## 🆘 **Solución de Problemas Comunes**

### **Error: Build Failed**
```bash
# Limpiar cache
npm run clean
rm -rf node_modules
npm install
npm run build
```

### **Error: API Connection**
- Verificar `NEXT_PUBLIC_API_URL`
- Verificar CORS en backend
- Verificar variables de entorno

### **Error: Database Connection**
- Verificar `DATABASE_URL`
- Verificar credenciales de base de datos
- Verificar firewall/red

---

## 🎯 **Recomendación Final**

### **Para tu proyecto, recomiendo:**

1. **Backend:** Railway (base de datos + API)
2. **Frontend:** Vercel (Next.js optimizado)
3. **Dominio:** Comprar dominio personalizado
4. **SSL:** Automático en ambos servicios

### **Ventajas de esta configuración:**
- ✅ **Totalmente gratuito** para empezar
- ✅ **Deploy automático** en cada cambio
- ✅ **Escalable** según necesidades
- ✅ **Muy fácil** de mantener
- ✅ **Profesional** y confiable

---

## 📞 **Soporte**

Si tienes problemas con el deploy:
1. Revisar logs del hosting
2. Verificar variables de entorno
3. Verificar configuración de CORS
4. Verificar conexión a base de datos

¡Con esta configuración tendrás tu proyecto funcionando en producción en minutos! 🚀
