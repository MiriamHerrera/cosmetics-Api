import { useState, useEffect, useCallback } from 'react';
import type { Survey, SurveyOption, SurveyVote } from '@/types';
import { API_CONFIG, apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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

  // Función helper para hacer llamadas API
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
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

  // Función helper para hacer llamadas API públicas (sin autenticación)
  const publicApiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('Public API call error:', err);
      throw err;
    }
  }, []);

  // Cargar encuestas activas (con user_votes para usuarios logueados)
  const loadActiveSurveys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Usuario autenticado: usar ruta que incluye user_votes
        const response = await apiCall('/active');
        if (response.success) {
          console.log('📊 Encuestas cargadas con user_votes:', response.data);
          setActiveSurveys(response.data);
        } else {
          throw new Error(response.message || 'Error desconocido');
        }
      } else {
        // Usuario no autenticado: usar ruta pública
        const response = await publicApiCall('/surveys');
        if (response.success) {
          console.log('📊 Encuestas cargadas (modo público):', response.data);
          // Agregar user_votes vacío para opciones no autenticadas
          const surveysWithEmptyVotes = response.data.map((survey: Survey) => ({
            ...survey,
            user_votes: []
          }));
          setActiveSurveys(surveysWithEmptyVotes);
        } else {
          throw new Error(response.message || 'Error desconocido');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [apiCall, publicApiCall]);

  // Cargar encuesta específica (con user_votes para usuarios logueados)
  const loadSurveyById = useCallback(async (id: number): Promise<Survey | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Usuario autenticado: usar ruta que incluye user_votes
        const response = await apiCall(`/active/${id}`);
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error desconocido');
        }
      } else {
        // Usuario no autenticado: usar ruta pública
        const response = await publicApiCall(`/surveys/${id}`);
        if (response.success) {
          // Agregar user_votes vacío para opciones no autenticadas
          return {
            ...response.data,
            user_votes: []
          };
        } else {
          throw new Error(response.message || 'Error desconocido');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    }
  }, [apiCall, publicApiCall]);

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
      
      console.log('🗳️ Iniciando voto:', { surveyId, optionId });
      
      const response = await apiCall('/vote', {
        method: 'POST',
        body: JSON.stringify({
          survey_id: surveyId,
          option_id: optionId
        })
      });

      console.log('📡 Respuesta de la API:', response);

      if (response.success) {
        console.log('✅ Voto exitoso, acción:', response.data.action);
        
        // Actualizar estado localmente sin recargar toda la encuesta
        setActiveSurveys(prevSurveys => 
          prevSurveys.map(survey => {
            if (survey.id === surveyId) {
              console.log('🔄 Actualizando encuesta:', survey.id);
              console.log('📊 Estado actual de votos:', survey.user_votes);
              
              // Encontrar la opción votada
              const updatedOptions = survey.options?.map(option => {
                if (option.id === optionId) {
                  // Verificar si el usuario ya votó por esta opción específica
                  const hasVotedForThisOption = survey.user_votes?.includes(optionId) || false;
                  
                  console.log('🎯 Opción:', option.option_text, 'Votada:', hasVotedForThisOption);
                  
                  if (hasVotedForThisOption) {
                    // Si ya votó por esta opción, desvotar (decrementar votos)
                    console.log('➖ Desvotando opción:', option.option_text);
                    return { ...option, votes: Math.max(0, (option.votes || 0) - 1) };
                  } else {
                    // Si no votó por esta opción, votar (incrementar votos)
                    console.log('➕ Votando opción:', option.option_text);
                    return { ...option, votes: (option.votes || 0) + 1 };
                  }
                }
                return option;
              });

              // Actualizar los votos del usuario
              let newUserVotes = survey.user_votes || [];
              if (response.data.action === 'voted') {
                // Agregar voto
                if (!newUserVotes.includes(optionId)) {
                  newUserVotes = [...newUserVotes, optionId];
                  console.log('➕ Agregando voto a user_votes:', newUserVotes);
                }
              } else {
                // Remover voto
                newUserVotes = newUserVotes.filter((id: number) => id !== optionId);
                console.log('➖ Removiendo voto de user_votes:', newUserVotes);
              }
              
              const updatedSurvey = {
                ...survey,
                options: updatedOptions,
                user_votes: newUserVotes,
                total_votes: response.data.action === 'voted' 
                  ? (survey.total_votes || 0) + 1 
                  : Math.max(0, (survey.total_votes || 0) - 1)
              };
              
              console.log('🔄 Encuesta actualizada:', {
                id: updatedSurvey.id,
                user_votes: updatedSurvey.user_votes,
                total_votes: updatedSurvey.total_votes
              });
              
              return updatedSurvey;
            }
            return survey;
          })
        );

        return true;
      } else {
        console.error('❌ Error en la respuesta de la API:', response);
        throw new Error(response.message || 'Error registrando voto');
      }
    } catch (err) {
      console.error('💥 Error en voteInSurvey:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [apiCall]);

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
      
      const response = await apiCall('/all');
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
      
      const response = await apiCall('/create', {
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