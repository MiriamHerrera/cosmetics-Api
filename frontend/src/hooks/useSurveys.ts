import { useState, useEffect, useCallback } from 'react';
import type { Survey, SurveyOption, SurveyVote } from '@/types';

interface UseSurveysReturn {
  // Estado
  surveys: Survey[];
  activeSurveys: Survey[];
  pendingOptions: SurveyOption[];
  loading: boolean;
  error: string | null;
  
  // Funciones para usuarios
  loadActiveSurveys: () => Promise<void>;
  loadSurveyById: (id: number) => Promise<Survey | null>;
  addSurveyOption: (surveyId: number, optionText: string, description?: string) => Promise<boolean>;
  voteInSurvey: (surveyId: number, optionId: number) => Promise<boolean>;
  changeVote: (surveyId: number, newOptionId: number) => Promise<boolean>;
  
  // Funciones para administradores
  loadAllSurveys: () => Promise<void>;
  loadPendingOptions: () => Promise<void>;
  createSurvey: (question: string, description?: string) => Promise<boolean>;
  approveSurveyOption: (optionId: number, isApproved: boolean, adminNotes?: string) => Promise<boolean>;
  approveSurvey: (surveyId: number, adminNotes?: string) => Promise<boolean>;
  closeSurvey: (surveyId: number) => Promise<boolean>;
  
  // Utilidades
  clearError: () => void;
}

export const useSurveys = (): UseSurveysReturn => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [pendingOptions, setPendingOptions] = useState<SurveyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:8000/api/enhanced-surveys';

  // Función helper para hacer llamadas API
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('API call error:', err);
      throw err;
    }
  }, []);

  // Cargar encuestas activas (públicas)
  const loadActiveSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/active`);
      if (!response.ok) {
        throw new Error('Error cargando encuestas activas');
      }
      
      const data = await response.json();
      if (data.success) {
        setActiveSurveys(data.data);
      } else {
        throw new Error(data.message || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar encuesta específica
  const loadSurveyById = useCallback(async (id: number): Promise<Survey | null> => {
    try {
      const response = await fetch(`${API_BASE}/active/${id}`);
      if (!response.ok) {
        throw new Error('Error cargando encuesta');
      }
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    }
  }, []);

  // Agregar opción a encuesta (usuarios)
  const addSurveyOption = useCallback(async (
    surveyId: number, 
    optionText: string, 
    description?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiCall('/options', {
        method: 'POST',
        body: JSON.stringify({
          survey_id: surveyId,
          option_text: optionText,
          description: description || ''
        })
      });

      if (response.success) {
        // Recargar la encuesta para mostrar la nueva opción
        await loadSurveyById(surveyId);
        return true;
      } else {
        throw new Error(response.message || 'Error agregando opción');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [apiCall, loadSurveyById]);

  // Votar en encuesta
  const voteInSurvey = useCallback(async (surveyId: number, optionId: number): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiCall('/vote', {
        method: 'POST',
        body: JSON.stringify({
          survey_id: surveyId,
          option_id: optionId
        })
      });

      if (response.success) {
        // Recargar la encuesta para mostrar el nuevo estado
        await loadSurveyById(surveyId);
        // También recargar encuestas activas para actualizar conteos
        await loadActiveSurveys();
        return true;
      } else {
        throw new Error(response.message || 'Error registrando voto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [apiCall, loadSurveyById, loadActiveSurveys]);

  // Cambiar voto
  const changeVote = useCallback(async (surveyId: number, newOptionId: number): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiCall('/change-vote', {
        method: 'PUT',
        body: JSON.stringify({
          survey_id: surveyId,
          new_option_id: newOptionId
        })
      });

      if (response.success) {
        // Recargar la encuesta para mostrar el voto actualizado
        await loadSurveyById(surveyId);
        return true;
      } else {
        throw new Error(response.message || 'Error cambiando voto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [apiCall, loadSurveyById]);

  // Cargar todas las encuestas (admin)
  const loadAllSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall('');
      if (response.success) {
        setSurveys(response.data);
      } else {
        throw new Error(response.message || 'Error cargando encuestas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Cargar opciones pendientes de aprobación (admin)
  const loadPendingOptions = useCallback(async () => {
    try {
      setError(null);
      
      const response = await apiCall('/pending-options');
      if (response.success) {
        setPendingOptions(response.data);
      } else {
        throw new Error(response.message || 'Error cargando opciones pendientes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, [apiCall]);

  // Crear encuesta (admin)
  const createSurvey = useCallback(async (question: string, description?: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiCall('', {
        method: 'POST',
        body: JSON.stringify({
          question,
          description: description || ''
        })
      });

      if (response.success) {
        // Recargar la lista de encuestas
        await loadAllSurveys();
        return true;
      } else {
        throw new Error(response.message || 'Error creando encuesta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [apiCall, loadAllSurveys]);

  // Aprobar/rechazar opción de encuesta (admin)
  const approveSurveyOption = useCallback(async (
    optionId: number, 
    isApproved: boolean, 
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiCall(`/options/${optionId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({
          is_approved: isApproved,
          admin_notes: adminNotes || ''
        })
      });

      if (response.success) {
        // Recargar opciones pendientes
        await loadPendingOptions();
        return true;
      } else {
        throw new Error(response.message || 'Error aprobando opción');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [apiCall, loadPendingOptions]);

  // Aprobar encuesta (admin)
  const approveSurvey = useCallback(async (
    surveyId: number, 
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiCall(`/${surveyId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({
          admin_notes: adminNotes || ''
        })
      });

      if (response.success) {
        // Recargar la lista de encuestas
        await loadAllSurveys();
        return true;
      } else {
        throw new Error(response.message || 'Error aprobando encuesta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [apiCall, loadAllSurveys]);

  // Cerrar encuesta (admin)
  const closeSurvey = useCallback(async (surveyId: number): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await apiCall(`/${surveyId}/close`, {
        method: 'PUT'
      });

      if (response.success) {
        // Recargar la lista de encuestas
        await loadAllSurveys();
        return true;
      } else {
        throw new Error(response.message || 'Error cerrando encuesta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [apiCall, loadAllSurveys]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar encuestas activas al montar el hook
  useEffect(() => {
    loadActiveSurveys();
  }, [loadActiveSurveys]);

  return {
    // Estado
    surveys,
    activeSurveys,
    pendingOptions,
    loading,
    error,
    
    // Funciones para usuarios
    loadActiveSurveys,
    loadSurveyById,
    addSurveyOption,
    voteInSurvey,
    changeVote,
    
    // Funciones para administradores
    loadAllSurveys,
    loadPendingOptions,
    createSurvey,
    approveSurveyOption,
    approveSurvey,
    closeSurvey,
    
    // Utilidades
    clearError
  };
}; 