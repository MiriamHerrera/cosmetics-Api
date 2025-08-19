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

    const canProceed = await confirmAndClearCart(() => {
      window.location.reload();
    });

    if (canProceed) {
      window.location.reload();
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

    const canProceed = await confirmAndClearCart(() => {
      if (url) {
        window.location.href = url;
      } else {
        window.close();
      }
    });

    if (canProceed) {
      if (url) {
        window.location.href = url;
      } else {
        window.close();
      }
    }
  }, [confirmAndClearCart, isGuestMode]);

  // Interceptar eventos de recarga del navegador
  useEffect(() => {
    if (!isGuestMode) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isGuestMode) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const handleUnload = () => {
      // Este evento se maneja en useBeforeUnload
      // Solo agregamos logging adicional aquí
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