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
  const isInitialized = useRef(false);
  
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
    // Evitar sincronizaciones muy frecuentes (mínimo 3 segundos entre sincronizaciones)
    const now = Date.now();
    if (!force && (now - lastSyncRef.current) < 3000) {
      if (DEBUG_MODE) {
        log('Sincronización muy reciente, omitiendo...', 'warn');
      }
      return false;
    }

    if (isSyncing.current) {
      if (DEBUG_MODE) {
        log('Sincronización en progreso, omitiendo...', 'warn');
      }
      return false;
    }

    try {
      isSyncing.current = true;
      hasPendingSync.current = false;
      lastSyncRef.current = now;
      
      if (DEBUG_MODE) {
        log(force ? 'Sincronización forzada iniciada...' : 'Iniciando sincronización de stock...');
      }
      
      const response = await publicProductsApi.getPublicProducts({ page: 1, limit: 1000 });
      
      if (response.success && response.data) {
        if (DEBUG_MODE) {
          log(`${response.data.length} productos recibidos del servidor`);
        }
        
        // Sincronizar stock en el store
        syncAllStock(response.data);
        
        if (DEBUG_MODE) {
          log('Stock sincronizado exitosamente');
        }
        return true;
      } else {
        if (DEBUG_MODE) {
          log(`Respuesta de API no exitosa: ${response.message}`, 'warn');
        }
        return false;
      }
    } catch (err) {
      if (DEBUG_MODE) {
        log(`Error sincronizando stock: ${err}`, 'error');
      }
      return false;
    } finally {
      isSyncing.current = false;
    }
  }, [syncAllStock, DEBUG_MODE]);

  // Sincronización automática cada 60 segundos (reducido de 30s)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return; // No ejecutar en el primer render
    }

    syncIntervalRef.current = setInterval(() => {
      // Solo ejecutar si no hay sincronización en progreso y no hay una pendiente
      if (!isSyncing.current && !hasPendingSync.current) {
        hasPendingSync.current = true;
        if (DEBUG_MODE) {
          log('Sincronización automática de stock...');
        }
        syncStock();
      }
    }, 60000); // 60 segundos

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [syncStock, DEBUG_MODE]);

  // Sincronización inicial al montar (solo una vez y después de 3 segundos)
  useEffect(() => {
    if (hasInitialSync.current || products.length === 0) return;

    const initialSync = setTimeout(() => {
      if (products.length > 0 && !hasInitialSync.current) {
        hasInitialSync.current = true;
        if (DEBUG_MODE) {
          log('Sincronización inicial de stock...');
        }
        syncStock(true);
      }
    }, 3000); // Aumentado a 3 segundos

    return () => clearTimeout(initialSync);
  }, [products.length, syncStock, DEBUG_MODE]);

  return {
    syncStock,
    isSyncing: isSyncing.current,
    lastSync: lastSyncRef.current
  };
};
