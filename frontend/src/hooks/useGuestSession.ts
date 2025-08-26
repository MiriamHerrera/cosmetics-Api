import { useState, useEffect, useCallback } from 'react';

export const useGuestSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generar o recuperar sessionId del localStorage
  useEffect(() => {
    const storedSessionId = localStorage.getItem('guest_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      // Generar nuevo sessionId
      const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Limpiar sesión de invitado
  const clearGuestSession = useCallback(() => {
    localStorage.removeItem('guest_session_id');
    setSessionId(null);
  }, []);

  // Renovar sesión de invitado
  const renewGuestSession = useCallback(() => {
    const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest_session_id', newSessionId);
    setSessionId(newSessionId);
    return newSessionId;
  }, []);

  return {
    sessionId,
    clearGuestSession,
    renewGuestSession
  };
};
