import { useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { publicProductsApi } from '@/lib/api';

export const useStockSync = () => {
  const { syncAllStock, products } = useStore();
  const isSyncing = useRef(false);
  const lastSyncRef = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para sincronizar stock desde el servidor
  const syncStock = useCallback(async (force = false) => {
    // Evitar sincronizaciones muy frecuentes (mínimo 2 segundos entre sincronizaciones)
    const now = Date.now();
    if (!force && (now - lastSyncRef.current) < 2000) {
      console.log('⏱️ [useStockSync] Sincronización muy reciente, omitiendo...');
      return false;
    }

    if (isSyncing.current) {
      console.log('⏳ [useStockSync] Sincronización en progreso, omitiendo...');
      return false;
    }

    try {
      isSyncing.current = true;
      lastSyncRef.current = now;
      console.log('🔄 [useStockSync] Iniciando sincronización de stock...');
      
      const response = await publicProductsApi.getAll({ page: 1, limit: 1000 });
      
      if (response.success && response.data) {
        console.log(`✅ [useStockSync] ${response.data.length} productos recibidos del servidor`);
        
        // Sincronizar stock en el store
        syncAllStock(response.data);
        
        console.log('✅ [useStockSync] Stock sincronizado exitosamente');
        return true;
      } else {
        console.warn('⚠️ [useStockSync] Respuesta de API no exitosa:', response.message);
        return false;
      }
    } catch (err) {
      console.error('❌ [useStockSync] Error sincronizando stock:', err);
      return false;
    } finally {
      isSyncing.current = false;
    }
  }, [syncAllStock]);

  // Sincronización automática cada 30 segundos
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      if (!isSyncing.current) {
        console.log('🔄 [useStockSync] Sincronización automática de stock...');
        syncStock();
      }
    }, 30000); // 30 segundos

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncStock]);

  // Sincronización inicial al montar
  useEffect(() => {
    // Sincronizar stock después de 2 segundos para permitir que se carguen los productos
    const initialSync = setTimeout(() => {
      if (products.length > 0) {
        console.log('🚀 [useStockSync] Sincronización inicial de stock...');
        syncStock(true);
      }
    }, 2000);

    return () => clearTimeout(initialSync);
  }, [products.length, syncStock]);

  return {
    syncStock,
    isSyncing: isSyncing.current,
    lastSync: lastSyncRef.current
  };
};
