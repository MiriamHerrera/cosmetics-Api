import React from 'react';
import { useStockSync } from '@/hooks/useStockSync';
import { useStore } from '@/store/useStore';

export const StockSyncStatus: React.FC = () => {
  const { products } = useStore();
  const { syncStock, isSyncing, lastSync } = useStockSync();

  const handleManualSync = async () => {
    await syncStock(true);
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca';
    const date = new Date(lastSync);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Estado de Sincronización del Stock
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Productos en store:</span>
          <span className="font-medium">{products.length}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Última sincronización:</span>
          <span className="font-medium">{formatLastSync()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Estado:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isSyncing 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {isSyncing ? 'Sincronizando...' : 'Sincronizado'}
          </span>
        </div>
        
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isSyncing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>Nota:</strong> El stock se sincroniza automáticamente cada 30 segundos 
          y después de cada operación del carrito para mantener la consistencia.
        </p>
      </div>
    </div>
  );
};
