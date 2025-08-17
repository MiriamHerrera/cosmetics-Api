# Cosmetics API Backend

Backend API para el sistema de gestión de cosméticos con funcionalidades de inventario, carrito, apartados y encuestas.

## 🚀 Características

- **Autenticación JWT** con roles de usuario y administrador
- **Gestión de productos** con categorías y tipos
- **Sistema de carrito** y apartados
- **Encuestas** para próximos inventarios
- **Estadísticas** de clientes frecuentes
- **Búsqueda avanzada** con filtros múltiples
- **Validación de datos** con Joi
- **Seguridad** con Helmet, CORS y rate limiting
- **Base de datos MySQL** con pool de conexiones

## 📋 Requisitos

- Node.js 18+ 
- MySQL 8.0+
- HeidiSQL (recomendado para gestión de BD)

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   cd backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar `.env` con tus credenciales:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=cosmetics_db
   JWT_SECRET=tu_clave_secreta_jwt
   ```

4. **Crear la base de datos**
   - Usar HeidiSQL para crear `cosmetics_db`
   - Ejecutar el script SQL proporcionado

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se iniciará en `http://localhost:8000`

## 📚 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `GET /api/auth/profile` - Obtener perfil (protegido)
- `PUT /api/auth/profile` - Actualizar perfil (protegido)
- `POST /api/auth/logout` - Logout (protegido)

### Productos
- `GET /api/products` - Listar productos con filtros
- `GET /api/products/search` - Búsqueda de productos
- `GET /api/products/categories` - Obtener categorías
- `GET /api/products/categories/:id/types` - Tipos por categoría
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)

### Health Check
- `GET /api/health` - Estado del servidor

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación:

1. **Registro/Login** para obtener token
2. **Incluir token** en header: `Authorization: Bearer <token>`
3. **Roles disponibles**: `client`, `admin`

## 🗄️ Estructura de la Base de Datos

- **users** - Usuarios del sistema
- **categories** - Categorías de productos
- **product_types** - Tipos de producto por categoría
- **products** - Productos del inventario
- **carts** - Carritos de compra
- **cart_items** - Items en carrito
- **reservations** - Apartados de productos
- **surveys** - Encuestas de productos
- **survey_options** - Opciones de encuesta
- **survey_votes** - Votos de usuarios
- **inventory_schedule** - Próximos inventarios
- **client_statistics** - Estadísticas de clientes

## 🔍 Filtros de Productos

- **Búsqueda por texto** (`q`)
- **Filtro por categoría** (`category_id`)
- **Filtro por tipo** (`product_type_id`)
- **Rango de precios** (`min_price`, `max_price`)
- **Solo en stock** (`in_stock`)
- **Ordenamiento** (`sort_by`, `sort_order`)
- **Paginación** (`page`, `limit`)

## 🛡️ Seguridad

- **Helmet** - Headers de seguridad
- **CORS** - Control de acceso entre dominios
- **Rate Limiting** - Protección contra spam
- **Validación Joi** - Sanitización de datos
- **JWT** - Autenticación segura
- **bcrypt** - Encriptación de contraseñas

## 📝 Logs

El servidor registra:
- Todas las peticiones HTTP
- Errores de base de datos
- Errores de autenticación
- Errores no manejados

## 🧪 Próximas Funcionalidades

- [ ] Sistema de carrito completo
- [ ] Gestión de apartados
- [ ] Sistema de encuestas
- [ ] Notificaciones WhatsApp
- [ ] Estadísticas avanzadas
- [ ] Panel administrativo
- [ ] Tests automatizados

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles. 