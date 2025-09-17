# Gestión de Disponibilidad - Panel de Administración

## Descripción

Se ha implementado una nueva funcionalidad en el panel de administración para gestionar los horarios y lugares de disponibilidad para las entregas. Esta funcionalidad permite a los administradores:

- **Crear, editar y eliminar lugares de entrega**
- **Gestionar horarios de disponibilidad por lugar y día de la semana**
- **Habilitar/deshabilitar lugares y horarios**
- **Visualizar la disponibilidad de manera organizada**

## Componentes Implementados

### Frontend

#### 1. AvailabilityManagement.tsx
- **Ubicación**: `frontend/src/components/ui/AvailabilityManagement.tsx`
- **Funcionalidad**: Componente principal para la gestión de disponibilidad
- **Características**:
  - Interfaz con pestañas para lugares de entrega y horarios
  - Modales para crear/editar lugares y horarios
  - Funciones para habilitar/deshabilitar elementos
  - Validación de formularios
  - Manejo de errores

#### 2. Integración en AdminPanel.tsx
- **Ubicación**: `frontend/src/components/ui/AdminPanel.tsx`
- **Cambios**:
  - Nueva pestaña "Disponibilidad" con icono de reloj
  - Importación del componente AvailabilityManagement
  - Integración en el sistema de pestañas existente

### Backend

#### 1. availabilityController.js
- **Ubicación**: `backend/src/controllers/availabilityController.js`
- **Funcionalidad**: Controlador para manejar todas las operaciones de disponibilidad
- **Endpoints implementados**:

##### Lugares de Entrega:
- `GET /api/admin/delivery-locations` - Obtener todos los lugares
- `POST /api/admin/delivery-locations` - Crear nuevo lugar
- `PUT /api/admin/delivery-locations/:id` - Actualizar lugar
- `DELETE /api/admin/delivery-locations/:id` - Eliminar lugar
- `PATCH /api/admin/delivery-locations/:id/toggle-status` - Cambiar estado

##### Horarios de Disponibilidad:
- `GET /api/admin/time-slots` - Obtener todos los horarios
- `POST /api/admin/time-slots` - Crear nuevo horario
- `PUT /api/admin/time-slots/:id` - Actualizar horario
- `DELETE /api/admin/time-slots/:id` - Eliminar horario
- `PATCH /api/admin/time-slots/:id/toggle-status` - Cambiar estado
- `GET /api/admin/time-slots/available/:locationId` - Horarios disponibles por lugar

#### 2. availability.js (Rutas)
- **Ubicación**: `backend/src/routes/availability.js`
- **Funcionalidad**: Definición de rutas con middleware de autenticación y autorización
- **Seguridad**: Todas las rutas requieren autenticación y rol de administrador

#### 3. Integración en app.js
- **Ubicación**: `backend/src/app.js`
- **Cambios**:
  - Importación de las rutas de disponibilidad
  - Registro de rutas bajo `/api/admin`

## Estructura de Base de Datos

### Tabla: delivery_locations
```sql
CREATE TABLE delivery_locations (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  address text NOT NULL,
  description text DEFAULT NULL,
  is_active tinyint(1) DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id)
);
```

### Tabla: delivery_time_slots
```sql
CREATE TABLE delivery_time_slots (
  id int(11) NOT NULL AUTO_INCREMENT,
  location_id int(11) NOT NULL,
  day_of_week int(11) NOT NULL COMMENT '0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado',
  time_slot time NOT NULL COMMENT 'Horario específico disponible',
  is_active tinyint(1) DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY unique_location_day_time (location_id, day_of_week, time_slot),
  KEY idx_location_day_time (location_id, day_of_week, time_slot)
);
```

## Scripts de Datos de Ejemplo

### seed-availability-data.js
- **Ubicación**: `backend/scripts/seed-availability-data.js`
- **Funcionalidad**: Script para insertar datos de ejemplo
- **Datos incluidos**:
  - 4 lugares de entrega de ejemplo
  - Horarios completos para cada lugar (Lunes-Domingo)
  - Configuración de horarios por día de la semana

## Uso

### Para Administradores

1. **Acceder al Panel de Administración**:
   - Iniciar sesión como administrador
   - Abrir el panel de administración
   - Seleccionar la pestaña "Disponibilidad"

2. **Gestionar Lugares de Entrega**:
   - Ver lista de lugares existentes
   - Crear nuevos lugares con nombre, dirección y descripción
   - Editar información de lugares existentes
   - Habilitar/deshabilitar lugares
   - Eliminar lugares (solo si no tienen horarios asociados)

3. **Gestionar Horarios**:
   - Ver lista de horarios por lugar y día
   - Crear nuevos horarios seleccionando lugar, día y hora
   - Editar horarios existentes
   - Habilitar/deshabilitar horarios
   - Eliminar horarios

### Para Desarrolladores

1. **Ejecutar Script de Datos de Ejemplo**:
   ```bash
   cd backend
   node scripts/seed-availability-data.js
   ```

2. **Probar Endpoints**:
   ```bash
   # Obtener lugares de entrega
   GET /api/admin/delivery-locations
   
   # Crear nuevo lugar
   POST /api/admin/delivery-locations
   {
     "name": "Nuevo Lugar",
     "address": "Dirección completa",
     "description": "Descripción opcional",
     "is_active": true
   }
   
   # Obtener horarios
   GET /api/admin/time-slots
   
   # Crear nuevo horario
   POST /api/admin/time-slots
   {
     "location_id": 1,
     "day_of_week": 1,
     "time_slot": "09:00",
     "is_active": true
   }
   ```

## Características Técnicas

### Frontend
- **Framework**: React con TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Estado**: useState y useEffect hooks
- **Validación**: Validación de formularios en el cliente
- **Manejo de Errores**: Mensajes de error contextuales

### Backend
- **Framework**: Node.js con Express
- **Base de Datos**: MySQL
- **Autenticación**: JWT con middleware de autorización
- **Validación**: Validación de datos en el servidor
- **Manejo de Errores**: Respuestas JSON estructuradas

### Seguridad
- Todas las rutas requieren autenticación JWT
- Solo usuarios con rol 'admin' pueden acceder
- Validación de datos en frontend y backend
- Prevención de duplicados con constraints de base de datos

## Próximas Mejoras

1. **Filtros Avanzados**: Filtros por estado, fecha, lugar
2. **Búsqueda**: Búsqueda de lugares y horarios
3. **Importación/Exportación**: Funciones para importar/exportar configuraciones
4. **Horarios Especiales**: Gestión de horarios para días festivos
5. **Notificaciones**: Alertas cuando se desactivan lugares con pedidos pendientes
6. **Estadísticas**: Reportes de uso de lugares y horarios

## Solución de Problemas

### Error: "Lugar no se puede eliminar porque tiene horarios asociados"
- **Causa**: El lugar tiene horarios de disponibilidad configurados
- **Solución**: Eliminar primero todos los horarios asociados al lugar

### Error: "Ya existe un horario para ese lugar, día y hora"
- **Causa**: Intento de crear un horario duplicado
- **Solución**: Verificar que no exista ya ese horario o editar el existente

### Error: "Lugar de entrega no encontrado"
- **Causa**: El ID del lugar no existe en la base de datos
- **Solución**: Verificar que el lugar existe y está activo

## Contacto

Para soporte técnico o preguntas sobre esta funcionalidad, contactar al equipo de desarrollo.
