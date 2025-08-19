# Sistema de Login Modal con Migración de Carrito

## Descripción

Este sistema permite a los usuarios autenticarse sin perder los productos que han agregado a su carrito en modo invitado. Cuando un usuario se autentica, su carrito de invitado se migra automáticamente al servidor.

## Componentes Principales

### 1. LoginModal
- **Ubicación**: `src/components/ui/LoginModal.tsx`
- **Funcionalidad**: Modal que permite login y registro de usuarios
- **Características**:
  - Cambio entre modo login y registro
  - Validación de formularios
  - Manejo de errores
  - Indicador de modo invitado activo

### 2. LoginButton
- **Ubicación**: `src/components/ui/LoginButton.tsx`
- **Funcionalidad**: Botón que abre el modal de login
- **Características**:
  - Diferentes variantes (default, outline, ghost)
  - Diferentes tamaños (sm, md, lg)
  - Texto personalizable
  - Se oculta automáticamente si el usuario está autenticado

### 3. useCartMigration
- **Ubicación**: `src/hooks/useCartMigration.ts`
- **Funcionalidad**: Hook para manejar la migración del carrito
- **Características**:
  - Migra automáticamente el carrito de invitado al servidor
  - Limpia el carrito local después de la migración
  - Manejo de errores durante la migración

## Uso

### Implementación Básica

```tsx
import { LoginButton, LoginModal } from '@/components/ui';

function MyComponent() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <LoginButton 
        variant="default" 
        size="md"
        onClick={() => setIsLoginModalOpen(true)}
      >
        Iniciar Sesión
      </LoginButton>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          console.log('Login exitoso, carrito migrado');
        }}
      />
    </>
  );
}
```

### En el Header

```tsx
import { LoginButton } from '@/components/ui';

function Header() {
  return (
    <header>
      <div className="flex items-center space-x-4">
        <LoginButton 
          variant="default"
          size="md"
          className="bg-gradient-to-r from-rose-400 to-pink-500"
        >
          Iniciar Sesión
        </LoginButton>
      </div>
    </header>
  );
}
```

### En el CartModal

El botón de login se muestra automáticamente en el modal del carrito cuando el usuario está en modo invitado:

```tsx
// Se incluye automáticamente en CartModal
// No requiere configuración adicional
```

## Flujo de Migración del Carrito

1. **Usuario en modo invitado**: Agrega productos al carrito local
2. **Usuario hace clic en login**: Se abre el modal de login
3. **Usuario se autentica**: El sistema automáticamente:
   - Valida las credenciales
   - Crea la sesión del usuario
   - Migra los productos del carrito local al servidor
   - Limpia el carrito local
4. **Usuario autenticado**: Ve su carrito en el servidor con todos los productos

## Configuración

### Variantes del Botón

- **default**: Botón azul sólido
- **outline**: Botón con borde
- **ghost**: Botón transparente

### Tamaños

- **sm**: Pequeño (px-3 py-1.5)
- **md**: Mediano (px-4 py-2) - Por defecto
- **lg**: Grande (px-6 py-3)

### Personalización

```tsx
<LoginButton 
  variant="outline"
  size="lg"
  className="w-full border-2 border-blue-500"
  showIcon={false}
>
  Texto Personalizado
</LoginButton>
```

## Integración con el Sistema Existente

### Hooks Utilizados

- `useAuth`: Maneja la autenticación
- `useGuestMode`: Detecta si el usuario está en modo invitado
- `useLocalCart`: Maneja el carrito local
- `useCart`: Maneja el carrito del servidor
- `useCartMigration`: Coordina la migración

### Store

El sistema se integra con el store global (`useStore`) para:
- Estado del usuario autenticado
- Estado del carrito
- Persistencia de datos

## Manejo de Errores

- **Errores de validación**: Se muestran debajo de cada campo
- **Errores de API**: Se muestran en la parte superior del modal
- **Errores de migración**: Se registran en consola pero no fallan el login

## Consideraciones de Seguridad

- Las contraseñas se envían al backend para validación
- Los tokens JWT se almacenan en localStorage
- La migración del carrito solo ocurre después de una autenticación exitosa

## Personalización

### Estilos

Los componentes usan Tailwind CSS y pueden ser personalizados mediante:
- Clases CSS personalizadas en la prop `className`
- Modificación de las clases base en los componentes
- Uso de CSS modules o styled-components

### Comportamiento

El comportamiento puede ser personalizado mediante:
- Props del componente
- Callbacks personalizados
- Modificación de los hooks

## Troubleshooting

### El carrito no se migra

1. Verificar que el usuario esté autenticado
2. Verificar que haya productos en el carrito local
3. Revisar la consola para errores de migración
4. Verificar que la API esté funcionando

### El modal no se abre

1. Verificar que el componente esté importado correctamente
2. Verificar que el estado `isOpen` esté configurado
3. Verificar que no haya errores de JavaScript

### Errores de validación

1. Verificar que todos los campos requeridos estén completos
2. Verificar que las contraseñas coincidan en el registro
3. Verificar que la contraseña tenga al menos 6 caracteres 