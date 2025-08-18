# 🛡️ Sistema de Protección de Navegación para Usuarios Invitados

## Descripción

Este sistema implementa una protección completa para usuarios invitados que tienen artículos en su carrito, previniendo la pérdida accidental de productos y asegurando que el stock se restaure correctamente.

## 🎯 Funcionalidades

### 1. **Detección de Salida de Página**
- Intercepta eventos `beforeunload` (recarga, cierre de pestaña)
- Detecta cambios de visibilidad (`visibilitychange`)
- Solo activo para usuarios en modo invitado

### 2. **Modal de Confirmación Elegante**
- Interfaz moderna y responsive
- Muestra cantidad de artículos en carrito
- Advertencias claras sobre pérdida de datos
- Botones de confirmación y cancelación

### 3. **Restauración Automática de Stock**
- Limpia el carrito del usuario invitado
- Restaura el stock de todos los productos
- Manejo de errores robusto

### 4. **Protección de Navegación**
- Intercepta navegación programática
- Protege enlaces externos
- Navegación del navegador (back/forward)

## 🏗️ Arquitectura

### Hooks Principales

#### `useBeforeUnload`
```typescript
const {
  showExitModal,
  confirmAndClearCart,
  handleConfirmExit,
  handleCancelExit,
  hasItemsInCart
} = useBeforeUnload();
```

#### `useNavigationGuard`
```typescript
const {
  guardedPush,
  guardedReplace,
  guardedBack,
  guardedForward
} = useNavigationGuard();
```

#### `useGuestMode`
```typescript
const { isGuestMode, user } = useGuestMode();
```

### Componentes

#### `NavigationGuard`
- Componente de nivel superior
- Se renderiza en el layout principal
- Controla la lógica de protección

#### `ExitConfirmationModal`
- Modal de confirmación personalizado
- Diseño responsive y accesible
- Animaciones suaves

#### `TestNavigationButton`
- Componente de prueba para desarrollo
- Solo visible en modo invitado
- Permite probar la funcionalidad

## 🚀 Uso

### 1. **Implementación Automática**
El sistema se activa automáticamente cuando:
- El usuario no está autenticado (modo invitado)
- Hay artículos en el carrito
- Se detecta intento de salida

### 2. **Navegación Protegida**
```typescript
import { useNavigationGuard } from '@/hooks/useNavigationGuard';

const { guardedPush } = useNavigationGuard();

// En lugar de router.push('/ruta')
guardedPush('/ruta');
```

### 3. **Confirmación Manual**
```typescript
import { useBeforeUnload } from '@/hooks/useBeforeUnload';

const { confirmAndClearCart } = useBeforeUnload();

const handleAction = async () => {
  const canProceed = await confirmAndClearCart(() => {
    // Acción que se ejecutará después de confirmar
  });
  
  if (canProceed) {
    // Ejecutar acción inmediatamente
  }
};
```

## 🔧 Configuración

### Variables de Entorno
```env
# No se requieren variables adicionales
# El sistema funciona con la configuración existente
```

### Dependencias
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "zustand": "^4.0.0"
  }
}
```

## 📱 Responsive Design

- **Mobile**: Modal optimizado para pantallas pequeñas
- **Tablet**: Adaptación automática de tamaños
- **Desktop**: Experiencia completa con animaciones

## 🧪 Testing

### Componente de Prueba
El `TestNavigationButton` permite:
- Probar navegación interna protegida
- Simular enlaces externos
- Verificar comportamiento del modal

### Casos de Uso
1. **Usuario invitado con carrito vacío**: Sin protección
2. **Usuario invitado con artículos**: Protección activa
3. **Usuario autenticado**: Sin protección (carrito persistente)
4. **Recarga de página**: Confirmación requerida
5. **Cierre de pestaña**: Confirmación requerida

## 🚨 Manejo de Errores

### Errores de API
- Fallback a confirmación básica del navegador
- Logs detallados en consola
- Modal no se cierra en caso de error

### Errores de Red
- Reintentos automáticos
- Mensajes de usuario claros
- Prevención de pérdida de datos

## 📊 Logs y Monitoreo

### Console Logs
```javascript
// Eventos detectados
⚠️ Usuario invitado cambió de pestaña con artículos en carrito

// Acciones exitosas
✅ Carrito de invitado limpiado y stock restaurado antes de salir

// Errores
❌ Error al limpiar carrito de invitado: [error]
```

### Métricas
- Intentos de salida interceptados
- Confirmaciones de salida
- Errores de limpieza de carrito

## 🔒 Seguridad

### Validaciones
- Solo usuarios invitados son afectados
- Verificación de permisos antes de limpiar carrito
- Sanitización de datos de entrada

### Prevención de Abuso
- Rate limiting implícito
- Validación de estado del carrito
- Logs de auditoría

## 🚀 Roadmap

### Versión 1.1
- [ ] Persistencia de preferencias de usuario
- [ ] Personalización de mensajes
- [ ] Integración con analytics

### Versión 1.2
- [ ] Protección para usuarios autenticados
- [ ] Backup automático de carritos
- [ ] Notificaciones push

### Versión 1.3
- [ ] Modo de desarrollo avanzado
- [ ] Tests automatizados
- [ ] Dashboard de monitoreo

## 🤝 Contribución

### Estándares de Código
- TypeScript estricto
- ESLint + Prettier
- Componentes funcionales con hooks
- Manejo de estado con Zustand

### Testing
- Componentes con React Testing Library
- Hooks con custom testing utilities
- E2E con Playwright (futuro)

## 📄 Licencia

Este código es parte del proyecto Cosmetics-Api y está sujeto a la misma licencia.

---

**Desarrollado con ❤️ para Cosmetics App** 