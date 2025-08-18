import { useEffect, useCallback } from 'react';
import { useBeforeUnload } from './useBeforeUnload';
import { useGuestMode } from './useGuestMode';

export const usePageReloadGuard = () => {
  const { confirmAndClearCart } = useBeforeUnload();
  const { isGuestMode } = useGuestMode();

  // Función para recargar página con confirmación
  const reloadWithConfirmation = useCallback(async () => {
    if (!isGuestMode) {
      // Usuario autenticado, recargar directamente
      window.location.reload();
      return;
    }

    console.log('🔄 Usuario invitado intentando recargar página...');
    
    const canProceed = await confirmAndClearCart(() => {
      console.log('✅ Usuario confirmó recarga, ejecutando...');
      window.location.reload();
    });

    if (canProceed) {
      console.log('🚀 Recarga permitida inmediatamente');
      window.location.reload();
    } else {
      console.log('⏳ Recarga en espera de confirmación del usuario');
    }
  }, [confirmAndClearCart, isGuestMode]);

  // Función para salir de la página con confirmación
  const exitWithConfirmation = useCallback(async (url?: string) => {
    if (!isGuestMode) {
      // Usuario autenticado, salir directamente
      if (url) {
        window.location.href = url;
      } else {
        window.close();
      }
      return;
    }

    console.log('🚪 Usuario invitado intentando salir de la página...');
    
    const canProceed = await confirmAndClearCart(() => {
      console.log('✅ Usuario confirmó salida, ejecutando...');
      if (url) {
        window.location.href = url;
      } else {
        window.close();
      }
    });

    if (canProceed) {
      console.log('🚀 Salida permitida inmediatamente');
      if (url) {
        window.location.href = url;
      } else {
        window.close();
      }
    } else {
      console.log('⏳ Salida en espera de confirmación del usuario');
    }
  }, [confirmAndClearCart, isGuestMode]);

  // Interceptar eventos de recarga del navegador
  useEffect(() => {
    if (!isGuestMode) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Este evento se maneja en useBeforeUnload
      // Solo agregamos logging adicional aquí
      console.log('🔄 Evento beforeunload detectado para usuario invitado');
    };

    const handleUnload = () => {
      console.log('🚪 Usuario invitado saliendo de la página');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [isGuestMode]);

  return {
    reloadWithConfirmation,
    exitWithConfirmation,
    isGuestMode
  };
}; 