import { useCallback } from 'react';
import { unifiedCartApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import { useGuestSession } from './useGuestSession';

export const useCartMigration = () => {
  const { user, syncServerCart } = useStore();
  const { sessionId, clearGuestSession } = useGuestSession();

  const migrateGuestCart = useCallback(async (): Promise<boolean> => {
    try {
      // Solo migrar si hay un usuario autenticado y una sesión de invitado
      if (!user?.id || !sessionId) {
        console.log('ℹ️ No hay usuario autenticado o sesión de invitado para migrar');
        return false;
      }

      console.log('🔄 Migrando carrito de invitado a usuario autenticado...');
      console.log('👤 Usuario ID:', user.id);
      console.log('🎭 Session ID:', sessionId);

      // Llamar a la API de migración
      const response = await unifiedCartApi.migrateGuestToUser(sessionId, user.id);

      if (response.success && response.data) {
        console.log('✅ Carrito migrado exitosamente:', response.data);
        
        // Sincronizar el carrito migrado con el store
        syncServerCart(response.data);
        
        // Limpiar la sesión de invitado ya que se migró
        clearGuestSession();
        
        return true;
      } else {
        console.log('⚠️ No se pudo migrar el carrito:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error migrando carrito:', error);
      return false;
    }
  }, [user?.id, sessionId, syncServerCart, clearGuestSession]);

  return {
    migrateGuestCart
  };
};
