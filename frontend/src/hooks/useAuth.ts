import { useState, useCallback, useEffect } from 'react';
import { usersApi, unifiedCartApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useCartMigration } from './useCartMigration';
import type { User, ApiResponse, Cart } from '@/types';

export const useAuth = () => {
  const { user, setUser, syncServerCart } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { migrateGuestCart } = useCartMigration();

  // Verificar y restaurar el estado de autenticación al inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (token && !user) {
          console.log('🔄 Restaurando sesión de usuario...');
          
          // Verificar el perfil del usuario con el token
          const response: ApiResponse<User> = await usersApi.getProfile();
          
          if (response.success && response.data) {
            console.log('✅ Usuario autenticado restaurado:', response.data.name);
            setUser(response.data);
            
            // Cargar carrito del servidor para usuario autenticado
            try {
              const cartResponse: ApiResponse<Cart> = await unifiedCartApi.getCart({ userId: response.data.id });
              if (cartResponse.success && cartResponse.data) {
                console.log('🛒 Carrito del servidor cargado:', cartResponse.data);
                syncServerCart(cartResponse.data);
              }
            } catch (cartError) {
              console.warn('⚠️ No se pudo cargar carrito del servidor:', cartError);
            }
          } else {
            console.log('❌ Token inválido, removiendo...');
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('❌ Error restaurando sesión:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [user, setUser, syncServerCart]);

  // Login
  const login = useCallback(async (phone: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Iniciando login para:', phone);
      
      const response: ApiResponse<{ user: User; token: string }> = await usersApi.login(phone, password);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        
        console.log('✅ Login exitoso para:', userData.name);
        
        // Guardar token en localStorage
        localStorage.setItem('auth_token', token);
        
        // Actualizar estado del usuario
        setUser(userData);
        
        // Migrar carrito de invitado si existe
        try {
          console.log('🔄 Iniciando migración del carrito...');
          const migrationSuccess = await migrateGuestCart();
          
          if (migrationSuccess) {
            console.log('✅ Carrito migrado exitosamente');
          } else {
            console.log('ℹ️ No hay carrito para migrar o ya se migró');
          }
        } catch (error) {
          console.error('❌ Error migrando carrito:', error);
          // No fallar el login si la migración falla
        }
        
        // Cargar carrito del servidor (con items migrados si los hay)
        try {
          console.log('🛒 Cargando carrito del servidor...');
          
          // Obtener sessionId del localStorage o estado local para migración
          const guestSessionId = localStorage.getItem('guest_session_id') || sessionStorage.getItem('guest_session_id');
          
          const cartResponse: ApiResponse<Cart> = await unifiedCartApi.getCart({ 
            userId: userData.id,
            sessionId: guestSessionId || undefined
          });
          
          if (cartResponse.success && cartResponse.data) {
            console.log('✅ Carrito del servidor cargado:', cartResponse.data);
            syncServerCart(cartResponse.data);
            
            // Limpiar sessionId de invitado después de migración exitosa
            if (guestSessionId) {
              localStorage.removeItem('guest_session_id');
              sessionStorage.removeItem('guest_session_id');
              console.log('🧹 SessionId de invitado limpiado después de migración');
            }
          }
        } catch (cartError) {
          console.warn('⚠️ No se pudo cargar carrito del servidor:', cartError);
        }
        
        return true;
      } else {
        console.log('❌ Login fallido:', response.message || response.error);
        setError(response.message || response.error || 'Error en el login');
        return false;
      }
    } catch (err: any) {
      // Manejar errores de la API que incluyen respuestas con códigos de error HTTP
      if (err.response && err.response.data) {
        // La API respondió con un error HTTP pero con datos
        const apiError = err.response.data;
        console.log('🔍 Error de API capturado:', apiError);
        
        if (apiError.message) {
          setError(apiError.message);
        } else if (apiError.error) {
          setError(apiError.error);
        } else {
          setError('Error en el login');
        }
      } else {
        // Error de conexión real
        console.error('❌ Error de conexión:', err);
        setError('Error de conexión en el login');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser, syncServerCart, migrateGuestCart]);

  // Registro
  const register = useCallback(async (userData: { name: string; password: string; phone: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<User> = await usersApi.register(userData);
      
      if (response.success && response.data) {
        setError(null);
        return true;
      } else {
        setError(response.message || response.error || 'Error en el registro');
        return false;
      }
    } catch (err: any) {
      // Manejar errores de la API que incluyen respuestas con códigos de error HTTP
      if (err.response && err.response.data) {
        // La API respondió con un error HTTP pero con datos
        const apiError = err.response.data;
        console.log('🔍 Error de API capturado en registro:', apiError);
        
        if (apiError.message) {
          setError(apiError.message);
        } else if (apiError.error) {
          setError(apiError.error);
        } else {
          setError('Error en el registro');
        }
      } else {
        // Error de conexión real
        console.error('❌ Error de conexión en registro:', err);
        setError('Error de conexión en el registro');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Llamar a la API de logout
      await usersApi.logout();
      
      // Limpiar estado local
      setUser(null);
      syncServerCart(null); // Limpiar carrito al cerrar sesión
      
      // El token ya se elimina en la API
      
      return true;
    } catch (err) {
      console.error('Error during logout:', err);
      // Aún así, limpiar el estado local
      setUser(null);
      syncServerCart(null); // Limpiar carrito al cerrar sesión
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser, syncServerCart]);

  // Obtener perfil del usuario
  const getProfile = useCallback(async () => {
    if (!user) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<User> = await usersApi.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
        return true;
      } else {
        setError(response.message || response.error || 'Error al obtener perfil');
        return false;
      }
    } catch (err: any) {
      // Manejar errores de la API que incluyen respuestas con códigos de error HTTP
      if (err.response && err.response.data) {
        // La API respondió con un error HTTP pero con datos
        const apiError = err.response.data;
        console.log('🔍 Error de API capturado en getProfile:', apiError);
        
        if (apiError.message) {
          setError(apiError.message);
        } else if (apiError.error) {
          setError(apiError.error);
        } else {
          setError('Error al obtener perfil');
        }
      } else {
        // Error de conexión real
        console.error('❌ Error de conexión en getProfile:', err);
        setError('Error de conexión al obtener perfil');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, setUser]);

  // Actualizar perfil
  const updateProfile = useCallback(async (userData: Partial<User>) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<User> = await usersApi.updateProfile(userData);
      
      if (response.success && response.data) {
        setUser(response.data);
        return true;
      } else {
        setError(response.error || 'Error al actualizar perfil');
        return false;
      }
    } catch (err) {
      setError('Error de conexión al actualizar perfil');
      console.error('Error updating profile:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, setUser]);

  // Verificar si el usuario está autenticado
  const isAuthenticated = !!user;
  


  // Verificar si el usuario es admin
  const isAdmin = user?.role === 'admin';

  return {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    error,
    isInitialized,
    login,
    register,
    logout,
    getProfile,
    updateProfile,
    clearError: () => setError(null)
  };
}; 