'use client';

import { RefreshCw } from 'lucide-react';
import { usePageReloadGuard } from '@/hooks/usePageReloadGuard';

export default function ProtectedReloadButton() {
  const { reloadWithConfirmation, isGuestMode } = usePageReloadGuard();

  const handleReload = async () => {
    await reloadWithConfirmation();
  };

  if (!isGuestMode) {
    return null; // Solo mostrar para usuarios invitados
  }

  return (
    <button
      onClick={handleReload}
      className="
        fixed bottom-4 left-4 z-40
        bg-blue-600 hover:bg-blue-700 
        text-white font-medium
        px-4 py-3 rounded-lg
        shadow-lg hover:shadow-xl
        transition-all duration-300
        flex items-center gap-2
        transform hover:scale-105
      "
      title="Recargar página (con confirmación si hay items en carrito)"
    >
      <RefreshCw className="w-5 h-5" />
      <span className="hidden sm:inline">Recargar</span>
    </button>
  );
} 