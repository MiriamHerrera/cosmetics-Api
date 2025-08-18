'use client';

import { useBeforeUnload } from '@/hooks/useBeforeUnload';
import { useCart } from '@/hooks/useCart';
import { ExitConfirmationModal } from '@/components/ui';

export default function NavigationGuard() {
  const { cartItemCount } = useCart();
  const {
    showExitModal,
    handleConfirmExit,
    handleCancelExit
  } = useBeforeUnload();



  // Solo renderizar el modal si hay artículos en el carrito
  if (cartItemCount === 0) {
    return null;
  }

  return (
    <ExitConfirmationModal
      isOpen={showExitModal}
      onConfirm={handleConfirmExit}
      onCancel={handleCancelExit}
      cartItemCount={cartItemCount}
    />
  );
} 