'use client';

import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useGuestMode } from '@/hooks/useGuestMode';

export default function TestNavigationButton() {
  const { guardedPush } = useNavigationGuard();
  const { isGuestMode } = useGuestMode();

  const handleTestNavigation = () => {
    // Simular navegación a una página externa
    guardedPush('/test-exit');
  };

  const handleTestExternalLink = () => {
    // Simular click en enlace externo
    window.open('https://www.google.com', '_blank');
  };

  if (!isGuestMode) {
    return null; // Solo mostrar en modo invitado
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-900">🧪 Prueba de Navegación</h3>
        <div className="space-y-2">
          <button
            onClick={handleTestNavigation}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Probar Navegación Interna
          </button>
          <button
            onClick={handleTestExternalLink}
            className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Probar Enlace Externo
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Solo visible en modo invitado
        </p>
      </div>
    </div>
  );
} 