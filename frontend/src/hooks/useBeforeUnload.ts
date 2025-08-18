import { useEffect, useCallback, useState } from 'react';
import { useCart } from './useCart';
import { useGuestMode } from './useGuestMode';

export const useBeforeUnload = () => {
  const { cartItemCount, clearCart } = useCart();
  const { isGuestMode } = useGuestMode();
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    // Solo mostrar advertencia si hay artículos en el carrito Y estamos en modo invitado
    if (isGuestMode && cartItemCount > 0) {
      const message = 'Tienes artículos en tu carrito. Si sales de la página, perderás tu carrito y se restaurará el stock. ¿Estás seguro de que quieres salir?';
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  }, [cartItemCount, isGuestMode]);

  const handleVisibilityChange = useCallback(() => {
    // Detectar cuando la página se oculta (usuario cambia de pestaña o minimiza)
    if (document.hidden && isGuestMode && cartItemCount > 0) {
      console.log('⚠️ Usuario invitado cambió de pestaña con artículos en carrito');
    }
  }, [cartItemCount, isGuestMode]);

  useEffect(() => {
    // Solo agregar event listeners si estamos en modo invitado
    if (!isGuestMode) return;

    // Agregar event listener para beforeunload
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Agregar event listener para visibilitychange
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Limpiar event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleBeforeUnload, handleVisibilityChange, isGuestMode]);

  // Función para confirmar salida y limpiar carrito
  const confirmAndClearCart = useCallback(async (action?: () => void) => {
    // Solo mostrar modal si estamos en modo invitado y hay artículos
    if (isGuestMode && cartItemCount > 0) {
      if (action) {
        setPendingAction(() => action);
      }
      setShowExitModal(true);
      return false; // Prevenir acción hasta confirmación
    }
    return true; // No hay artículos o no es modo invitado, permitir acción
  }, [cartItemCount, isGuestMode]);

  // Función para confirmar la salida
  const handleConfirmExit = useCallback(async () => {
    try {
      console.log('🧹 Limpiando carrito de invitado antes de salir...');
      
      // Limpiar carrito y restaurar stock
      await clearCart();
      
      console.log('✅ Carrito de invitado limpiado y stock restaurado exitosamente');
      setShowExitModal(false);
      
      // Ejecutar la acción pendiente si existe
      if (pendingAction) {
        console.log('🚀 Ejecutando acción pendiente después de limpiar carrito...');
        pendingAction();
        setPendingAction(null);
      }
      
      // Mostrar mensaje de confirmación
      console.log('✅ Usuario confirmó salida, carrito limpiado y stock restaurado');
      
    } catch (error) {
      console.error('❌ Error al limpiar carrito de invitado:', error);
      
      // En caso de error, mostrar mensaje pero permitir salida
      console.warn('⚠️ Error limpiando carrito, pero permitiendo salida para evitar bloqueo');
      setShowExitModal(false);
      
      // Ejecutar acción pendiente incluso con error
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    }
  }, [clearCart, pendingAction]);

  // Función para cancelar la salida
  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
    setPendingAction(null);
  }, []);

  return {
    showExitModal,
    confirmAndClearCart,
    handleConfirmExit,
    handleCancelExit,
    hasItemsInCart: isGuestMode && cartItemCount > 0
  };
}; 