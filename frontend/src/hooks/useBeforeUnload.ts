import { useEffect, useCallback, useState } from 'react';
import { useCart } from './useCart';
import { useGuestMode } from './useGuestMode';

export const useBeforeUnload = () => {
  const { cartItemCount, clearCart } = useCart();
  const { isGuestMode } = useGuestMode();
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Función para marcar que se está procesando una orden
  const setOrderProcessing = useCallback((processing: boolean) => {
    setIsProcessingOrder(processing);
  }, []);

  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    // Solo mostrar advertencia si hay artículos en el carrito Y estamos en modo invitado
    // Y NO estamos procesando una orden
    if (isGuestMode && cartItemCount > 0 && !isProcessingOrder) {
      const message = 'Tienes artículos en tu carrito. Si sales de la página, perderás tu carrito y se restaurará el stock. ¿Estás seguro de que quieres salir?';
      event.preventDefault();
      event.returnValue = message;
      return message;
    }
  }, [cartItemCount, isGuestMode, isProcessingOrder]);

  const handleVisibilityChange = useCallback(() => {
    // Detectar cuando la página se oculta (usuario cambia de pestaña o minimiza)
    // Solo mostrar modal si NO estamos procesando una orden
    if (document.hidden && isGuestMode && cartItemCount > 0 && !isProcessingOrder) {
      // Usuario cambió de pestaña con artículos en carrito
      setShowExitModal(true);
    }
  }, [cartItemCount, isGuestMode, isProcessingOrder]);

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
      // Limpiar carrito de invitado antes de salir
      clearCart();
      
      // Ejecutar la acción pendiente después de limpiar
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
      
      setShowExitModal(false);
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
    hasItemsInCart: isGuestMode && cartItemCount > 0,
    setOrderProcessing
  };
}; 