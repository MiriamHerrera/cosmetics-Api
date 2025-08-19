import { useState, useCallback, useEffect } from 'react';
import { usersApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useCartMigration } from './useCartMigration';
import type { User, ApiResponse } from '@/types';

export const useAuth = () => {
  const { user, setUser } = useStore();
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
  
          
          // Verificar el perfil del usuario con el token
          const response: ApiResponse<User> = await usersApi.getProfile();
          
          if (response.success && response.data) {

            setUser(response.data);
          } else {

            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {

        localStorage.removeItem('auth_token');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [user, setUser]);

  // Login
  const login = useCallback(async (phone: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      

      
      const response: ApiResponse<{ user: User; token: string }> = await usersApi.login(phone, password);
      

      
      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        

        
        // Guardar token en localStorage
        localStorage.setItem('auth_token', token);
        
        // Actualizar estado del usuario
        setUser(userData);
        
        // Migrar carrito de invitado si existe
        try {
          await migrateGuestCart();
        } catch (error) {
          console.error('Error migrando carrito:', error);
          // No fallar el login si la migración falla
        }
        
        return true;
      } else {

        setError(response.error || 'Error en el login');
        return false;
      }
    } catch (err) {

      setError('Error de conexión en el login');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser, migrateGuestCart]);

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
        setError(response.error || 'Error en el registro');
        return false;
      }
    } catch (err) {
      setError('Error de conexión en el registro');
      console.error('Error during registration:', err);
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
      
      // El token ya se elimina en la API
      
      return true;
    } catch (err) {
      console.error('Error during logout:', err);
      // Aún así, limpiar el estado local
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

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
        setError(response.error || 'Error al obtener perfil');
        return false;
      }
    } catch (err) {
      setError('Error de conexión al obtener perfil');
      console.error('Error getting profile:', err);
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