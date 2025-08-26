import { useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { publicProductsApi } from '@/lib/api';

export const useStockSync = () => {
  const { syncAllStock, products } = useStore();
  const isSyncing = useRef(false);
  const lastSyncRef = useRef<number>(0);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialSync = useRef(false);
  const hasPendingSync = useRef(false);
  
  // Configuración de logging (solo en desarrollo)
  const DEBUG_MODE = process.env.NODE_ENV === 'development';
  
  const log = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    if (DEBUG_MODE) {
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '🔄';
      console.log(`${prefix} [useStockSync] ${message}`);
    }
  };

  // Función para sincronizar stock desde el servidor
  const syncStock = useCallback(async (force = false) => {
    // Evitar sincronizaciones muy frecuentes (mínimo 2 segundos entre sincronizaciones)
    const now = Date.now();
    if (!force && (now - lastSyncRef.current) < 2000) {
      log('Sincronización muy reciente, omitiendo...');
      return false;
    }

    if (isSyncing.current) {
      log('Sincronización en progreso, omitiendo...');
      return false;
    }

    try {
      isSyncing.current = true;
      hasPendingSync.current = false;
      lastSyncRef.current = now;
      log('Iniciando sincronización de stock...');
      
      const response = await publicProductsApi.getAll({ page: 1, limit: 1000 });
      
      if (response.success && response.data) {
        log(`${response.data.length} productos recibidos del servidor`);
        
        // Sincronizar stock en el store
        syncAllStock(response.data);
        
        log('Stock sincronizado exitosamente');
        return true;
      } else {
        log(`Respuesta de API no exitosa: ${response.message}`, 'warn');
        return false;
      }
    } catch (err) {
      log(`Error sincronizando stock: ${err}`, 'error');
      return false;
    } finally {
      isSyncing.current = false;
    }
  }, [syncAllStock]);

  // Sincronización automática cada 30 segundos
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      // Solo ejecutar si no hay sincronización en progreso y no hay una pendiente
      if (!isSyncing.current && !hasPendingSync.current) {
        hasPendingSync.current = true;
        log('Sincronización automática de stock...');
        syncStock();
      } else {
        log('Omitiendo sincronización automática (sincronización en progreso o pendiente)');
      }
    }, 30000); // 30 segundos

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncStock]);

  // Sincronización inicial al montar (solo una vez)
  useEffect(() => {
    // Sincronizar stock después de 2 segundos para permitir que se carguen los productos
    const initialSync = setTimeout(() => {
      if (products.length > 0 && !hasInitialSync.current) {
        hasInitialSync.current = true;
        log('Sincronización inicial de stock...');
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
