import { useState, useEffect, useCallback } from 'react';
import { useGuestMode } from './useGuestMode';

const GUEST_SESSION_KEY = 'cosmetics_guest_session';

export const useGuestSession = () => {
  const { isGuestMode } = useGuestMode();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generar sessionId único
  const generateSessionId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `guest_${timestamp}_${random}`;
  }, []);

  // Obtener o crear sessionId
  const getOrCreateSessionId = useCallback(() => {
    if (!isGuestMode) return null;

    let currentSessionId = sessionId;
    
    if (!currentSessionId) {
      // Verificar que localStorage esté disponible (cliente)
      if (typeof window !== 'undefined' && window.localStorage) {
        // Intentar obtener del localStorage
        currentSessionId = localStorage.getItem(GUEST_SESSION_KEY);
        
        if (!currentSessionId) {
          // Crear nuevo sessionId
          currentSessionId = generateSessionId();
          localStorage.setItem(GUEST_SESSION_KEY, currentSessionId);
          console.log('🆔 Nuevo sessionId de invitado creado:', currentSessionId);
        } else {
          // Solo log en desarrollo para evitar spam
          if (process.env.NODE_ENV === 'development') {
            console.log('🆔 SessionId de invitado recuperado:', currentSessionId);
          }
        }
      } else {
        // En SSR, generar un sessionId temporal
        currentSessionId = generateSessionId();
        console.log('🆔 SessionId temporal generado para SSR:', currentSessionId);
      }
      
      setSessionId(currentSessionId);
    }
    
    return currentSessionId;
  }, [isGuestMode, sessionId, generateSessionId]);

  // Limpiar sessionId (cuando se convierte en usuario autenticado)
  const clearSessionId = useCallback(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(GUEST_SESSION_KEY);
    }
    setSessionId(null);
    console.log('🧹 SessionId de invitado limpiado');
  }, []);

  // Inicializar sessionId
  useEffect(() => {
    if (isGuestMode) {
      getOrCreateSessionId();
    } else {
      clearSessionId();
    }
  }, [isGuestMode, getOrCreateSessionId, clearSessionId]);

  return {
    sessionId: getOrCreateSessionId(),
    generateSessionId,
    clearSessionId,
    isGuestMode
  };
}; 