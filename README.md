# 💄 Cosmetics App - Sistema de Inventario y Ventas

## 🚀 Stack Tecnológico
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Laravel 11 + PostgreSQL
- **Estado**: Zustand
- **Autenticación**: Laravel Sanctum
- **Notificaciones**: WhatsApp Business API

## 📁 Estructura del Proyecto
```
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/      # App Router (páginas)
│   │   ├── components/ # Componentes reutilizables
│   │   ├── lib/      # Utilidades y API
│   │   ├── store/    # Estado global (Zustand)
│   │   └── types/    # Tipos TypeScript
│   └── package.json
├── backend/           # Laravel API (próximamente)
├── docs/              # Documentación
└── README.md
```

## 🛠️ Desarrollo Local

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # http://localhost:3000
```

### Backend (Laravel) - Próximamente
```bash
cd backend
php artisan serve    # http://localhost:8000
```

## 🎯 Features Principales
- [x] **Inventario con filtros avanzados** - Gestión completa de productos
- [x] **Carrito con apartado (7 días)** - Sistema de reservas
- [x] **Integración WhatsApp automática** - Notificaciones automáticas
- [x] **Dashboard administrativo** - Panel de control completo
- [x] **Estadísticas de clientes** - Métricas y análisis
- [x] **Sistema de encuestas** - Feedback de usuarios
- [x] **Recordatorios automáticos** - Gestión de apartados

## 🚀 Deploy
- **Frontend**: Vercel
- **Backend**: DigitalOcean
- **Base de datos**: PostgreSQL (DO Managed)

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd Cosmetics-Api
```

### 2. Instalar dependencias del frontend
```bash
cd frontend
npm install
```

### 3. Configurar variables de entorno
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

## 🎨 Características del Frontend

### Estado Global (Zustand)
- Gestión de productos
- Carrito de compras
- Autenticación de usuarios
- Categorías y filtros

### API Client
- Axios con interceptores
- Manejo automático de tokens
- Endpoints para todas las funcionalidades
- Manejo de errores centralizado

### Componentes
- Diseño responsive con Tailwind CSS
- Iconos de Lucide React
- Componentes de Headless UI
- Sistema de notificaciones

## 🔧 Scripts Disponibles

### Desde la raíz del proyecto
```bash
npm run dev:frontend    # Ejecutar frontend
npm run dev:backend     # Ejecutar backend (cuando esté listo)
npm run build:frontend  # Build del frontend
npm run install:frontend # Instalar dependencias del frontend
npm run install:backend  # Instalar dependencias del backend
```

## 📱 Funcionalidades Implementadas

### ✅ Completado
- [x] Estructura del monorepo
- [x] Next.js 14 con TypeScript
- [x] Tailwind CSS configurado
- [x] Store de Zustand con persistencia
- [x] Tipos TypeScript completos
- [x] Cliente API con Axios
- [x] Landing page personalizada
- [x] Sistema de carrito funcional
- [x] Gestión de estado global

### 🚧 En Progreso
- [ ] Componentes de UI
- [ ] Páginas de productos
- [ ] Sistema de autenticación
- [ ] Dashboard administrativo

### 📋 Pendiente
- [ ] Backend con Laravel
- [ ] Base de datos PostgreSQL
- [ ] Integración WhatsApp
- [ ] Sistema de encuestas
- [ ] Deploy en producción

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Desarrollador**: Tu Nombre
- **Email**: tu-email@ejemplo.com
- **Proyecto**: [https://github.com/tu-usuario/cosmetics-app](https://github.com/tu-usuario/cosmetics-app)

---

⭐ Si te gusta este proyecto, ¡dale una estrella! 