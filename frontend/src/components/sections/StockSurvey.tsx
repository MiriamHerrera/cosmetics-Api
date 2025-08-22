'use client';

import { useState, useEffect } from 'react';
import { 
  Palette, 
  Droplets, 
  Brush, 
  MessageSquare, 
  Plus, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  Heart,
  TrendingUp,
  Users,
  Sparkles
} from 'lucide-react';
import { useSurveys } from '@/hooks/useSurveys';
import { useAuth } from '@/hooks/useAuth';
import { LoginModal } from '@/components/ui';
import type { Survey, SurveyOption } from '@/types';

interface StockSurveyProps {
  totalVotes?: number;
}

export default function StockSurvey({ totalVotes = 156 }: StockSurveyProps) {
  const { user } = useAuth();
  const { 
    activeSurveys, 
    loading, 
    error, 
    addSurveyOption,
    voteInSurvey,
    changeVote,
    loadActiveSurveys 
  } = useSurveys();

  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showAddOption, setShowAddOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [newOptionDescription, setNewOptionDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingOptions, setVotingOptions] = useState<Set<number>>(new Set()); // Para tracking de votos en progreso
  const [suggestionStatus, setSuggestionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Cargar encuestas activas al montar el componente
  useEffect(() => {
    loadActiveSurveys();
  }, [loadActiveSurveys]);

  // Seleccionar la primera encuesta activa por defecto
  useEffect(() => {
    if (activeSurveys.length > 0 && !selectedSurvey) {
      setSelectedSurvey(activeSurveys[0]);
    }
  }, [activeSurveys, selectedSurvey]);

  // Calcular porcentajes
  const calculatePercentage = (votes: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  // Función para manejar el éxito del login
  const handleLoginSuccess = () => {
    // Recargar encuestas para obtener user_votes
    loadActiveSurveys();
  };

  // Función para votar con feedback instantáneo
  const handleVote = async (optionId: number) => {
    if (!user || !selectedSurvey) return;
    
    try {
      // Marcar esta opción como "votando" para mostrar feedback visual
      setVotingOptions(prev => new Set(prev).add(optionId));
      
      // Actualizar UI inmediatamente para feedback instantáneo
      const hasVotedForThisOption = selectedSurvey.user_votes?.includes(optionId) || false;
      
      setSelectedSurvey(prev => {
        if (!prev) return prev;
        
        const updatedOptions = prev.options?.map(option => {
          if (option.id === optionId) {
            if (hasVotedForThisOption) {
              // Desvotar: decrementar votos
              return { ...option, votes: Math.max(0, (option.votes || 0) - 1) };
            } else {
              // Votar: incrementar votos
              return { ...option, votes: (option.votes || 0) + 1 };
            }
          }
          return option;
        });

        // Actualizar los votos del usuario
        let newUserVotes = prev.user_votes || [];
        if (hasVotedForThisOption) {
          // Remover voto
          newUserVotes = newUserVotes.filter(id => id !== optionId);
        } else {
          // Agregar voto
          if (!newUserVotes.includes(optionId)) {
            newUserVotes = [...newUserVotes, optionId];
          }
        }

        return {
          ...prev,
          options: updatedOptions,
          user_votes: newUserVotes,
          total_votes: hasVotedForThisOption 
            ? Math.max(0, (prev.total_votes || 0) - 1)
            : (prev.total_votes || 0) + 1
        };
      });

      // Llamar a la API
      await voteInSurvey(selectedSurvey.id, optionId);
      
    } catch (error) {
      console.error('Error al votar:', error);
      
      // Revertir cambios si hay error
      setSelectedSurvey(prev => {
        if (!prev) return prev;
        return { ...prev };
      });
    } finally {
      // Remover la opción del estado de "votando"
      setVotingOptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(optionId);
        return newSet;
      });
    }
  };

  // Función para cambiar voto
  const handleChangeVote = async (newOptionId: number) => {
    if (!user || !selectedSurvey) return;
    
    try {
      setSubmitting(true);
      await changeVote(selectedSurvey.id, newOptionId);
    } catch (error) {
      console.error('Error al cambiar voto:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Función para agregar nueva opción con mejor feedback
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedSurvey || !newOptionText.trim()) return;
    
    try {
      setSubmitting(true);
      setSuggestionStatus('submitting');
      setSuggestionMessage('Enviando tu sugerencia...');
      
      const success = await addSurveyOption(selectedSurvey.id, newOptionText.trim(), newOptionDescription.trim());
      
      if (success) {
        setSuggestionStatus('success');
        setSuggestionMessage('¡Sugerencia enviada exitosamente! Está pendiente de aprobación.');
        
        // Limpiar formulario
        setNewOptionText('');
        setNewOptionDescription('');
        
        // Recargar encuestas para mostrar la nueva opción pendiente
        await loadActiveSurveys();
        
        // Ocultar formulario después de 3 segundos
        setTimeout(() => {
          setShowAddOption(false);
          setSuggestionStatus('idle');
          setSuggestionMessage('');
        }, 3000);
        
      } else {
        setSuggestionStatus('error');
        setSuggestionMessage('Error al enviar la sugerencia. Inténtalo de nuevo.');
      }
      
    } catch (error) {
      console.error('Error al agregar opción:', error);
      setSuggestionStatus('error');
      setSuggestionMessage('Error al enviar la sugerencia. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener total de votos de la encuesta seleccionada
  const currentTotalVotes = selectedSurvey?.total_votes || 0;

  if (loading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
              <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin text-white absolute inset-0 m-auto" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Cargando encuestas...</h3>
            <p className="text-sm sm:text-base text-gray-500">Preparando tu experiencia de votación</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-md mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Error al cargar encuestas</h3>
            <p className="text-sm sm:text-base text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => loadActiveSurveys()}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base"
            >
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Solo mostrar "No hay encuestas activas" cuando realmente no hay encuestas activas
  if (activeSurveys.length === 0) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">No hay encuestas activas</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
              Actualmente no hay encuestas disponibles para votar. Los administradores pueden crear nuevas encuestas desde el panel de administración.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Si hay encuestas activas pero la seleccionada no tiene opciones, mostrar mensaje específico
  if (!selectedSurvey || !selectedSurvey.options || selectedSurvey.options.length === 0) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-lg mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Encuesta sin opciones disponibles</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
              La encuesta seleccionada no tiene opciones disponibles para votar. Los administradores pueden agregar opciones desde el panel de administración.
            </p>
            
            {/* Selector de encuestas para cambiar a otra encuesta activa */}
            {activeSurveys.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  Cambiar a otra encuesta:
                </label>
                <div className="relative">
                  <select
                    value={selectedSurvey?.id || ''}
                    onChange={(e) => {
                      const survey = activeSurveys.find(s => s.id === parseInt(e.target.value));
                      setSelectedSurvey(survey || null);
                    }}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 bg-white shadow-lg appearance-none cursor-pointer text-sm"
                  >
                    {activeSurveys.map((survey) => (
                      <option key={survey.id} value={survey.id}>
                        {survey.question}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent border-l-transparent transform rotate-45"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-gray-600">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  <span>Encuestas: {activeSurveys.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span>Opciones: {activeSurveys.reduce((total, survey) => total + (survey.options_count || 0), 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        
        {/* Header mejorado con animaciones y gradientes */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-pink-400 to-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-3 sm:mb-4">
              ¡Tu Opinión Cuenta!
            </h2>
            <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
          </div>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mt-4 sm:mt-6 max-w-2xl mx-auto leading-relaxed px-4">
            Participa en nuestras encuestas y ayuda a dar forma al futuro de nuestros productos
          </p>
          
          {/* Estadísticas visuales */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 px-4">
            <div className="flex items-center gap-2 text-purple-600">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-semibold">{currentTotalVotes} votos</span>
            </div>
            <div className="flex items-center gap-2 text-pink-600">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-semibold">{selectedSurvey.options?.length || 0} opciones</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-600">
              <Star className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-semibold">¡Participa!</span>
            </div>
          </div>
        </div>

        {/* Selector de encuestas mejorado */}
        {activeSurveys.length > 1 && (
          <div className="mb-6 sm:mb-8 md:mb-10">
            <div className="max-w-md mx-auto px-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3 text-center">
                Seleccionar encuesta:
              </label>
              <div className="relative">
                <select
                  value={selectedSurvey.id}
                  onChange={(e) => {
                    const survey = activeSurveys.find(s => s.id === parseInt(e.target.value));
                    setSelectedSurvey(survey || null);
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 bg-white shadow-lg appearance-none cursor-pointer text-sm sm:text-base"
                >
                  {activeSurveys.map((survey) => (
                    <option key={survey.id} value={survey.id}>
                      {survey.question}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-purple-400 border-t-transparent border-l-transparent transform rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Encuesta principal con diseño mejorado */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-purple-100 transition-all duration-300 hover:shadow-2xl sm:hover:shadow-3xl relative overflow-hidden mx-2 sm:mx-0">
          
          {/* Fondo decorativo */}
          <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -translate-y-8 sm:-translate-y-12 md:-translate-y-16 translate-x-8 sm:translate-x-12 md:translate-x-16 opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full translate-y-6 sm:translate-y-8 md:translate-y-12 -translate-x-6 sm:-translate-x-8 md:-translate-x-12 opacity-60"></div>
          
          {/* Pregunta con diseño mejorado */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              <span className="text-xs sm:text-sm font-medium text-purple-700">Encuesta Activa</span>
            </div>
            
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4 leading-tight px-2">
              {selectedSurvey.question}
            </h3>
            {selectedSurvey.description && (
              <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">{selectedSurvey.description}</p>
            )}
            
            {/* Mensaje para usuarios no logueados mejorado */}
            {!user && (
              <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl sm:rounded-2xl max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-yellow-800">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-sm sm:text-base">Acceso requerido</p>
                    <p className="text-xs sm:text-sm text-yellow-700">Inicia sesión para votar y sugerir</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Opciones de votación con diseño mejorado */}
          <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10 md:mb-12 relative z-10">
            {selectedSurvey.options.map((option, index) => {
              const percentage = calculatePercentage(option.votes || 0, currentTotalVotes);
              const isUserVote = selectedSurvey.user_votes?.includes(option.id) || false;
              const isPending = option.status === 'pending';
              const isVoting = votingOptions.has(option.id);
              
              return (
                <div key={option.id} className={`
                  group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8
                  transition-all duration-300 transform hover:scale-[1.01] sm:hover:scale-[1.02] hover:-translate-y-0.5 sm:hover:-translate-y-1
                  ${!isPending ? 'cursor-pointer' : 'cursor-default'}
                  ${isUserVote ? 'ring-2 sm:ring-3 ring-rose-400 bg-gradient-to-r from-rose-50 to-pink-50 shadow-lg sm:shadow-xl' : ''}
                  ${isPending ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-2 sm:border-l-4 border-yellow-400 shadow-md sm:shadow-lg' : 'bg-gradient-to-r from-gray-50 to-white hover:from-purple-50 hover:to-pink-50 shadow-md hover:shadow-lg sm:hover:shadow-xl'}
                  ${isVoting ? 'ring-2 sm:ring-3 ring-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg sm:shadow-xl' : ''}
                  ${!user ? 'opacity-75' : ''}
                `}
                onClick={() => {
                  if (!user) return;
                  if (isPending || isVoting) return;
                  handleVote(option.id);
                }}
                >
                  {/* Indicador de posición */}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between ml-8 sm:ml-12 gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                        isPending ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 
                        isVoting ? 'bg-gradient-to-r from-blue-400 to-indigo-400' : 
                        'bg-gradient-to-r from-purple-400 to-pink-400'
                      }`}>
                        {isPending ? (
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                        ) : isVoting ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white animate-spin" />
                        ) : (
                          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 break-words">{option.option_text}</h4>
                        {option.description && (
                          <p className="text-sm text-gray-600 leading-relaxed break-words">{option.description}</p>
                        )}
                        
                        {/* Estados y mensajes */}
                        {isPending && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800">
                              ⏳ Pendiente de aprobación
                            </span>
                            {user && (
                              <span className="text-xs sm:text-sm text-gray-500">
                                Sugerida por: {option.suggested_by || 'Usuario'}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {isVoting && (
                          <div className="flex items-center gap-2 mt-2 sm:mt-3">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-800">
                              Procesando voto...
                            </span>
                          </div>
                        )}
                        
                        {/* Mensajes de acción */}
                        {user && !isPending && !isVoting && (
                          <div className="flex items-center gap-2 mt-2 sm:mt-3">
                            {isUserVote ? (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-rose-100 text-rose-800">
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Tu voto - </span>Click para desvotar
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                Click para votar
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Estadísticas de votos */}
                    <div className="text-center sm:text-right sm:ml-6 flex-shrink-0">
                      {!isPending ? (
                        <div className="text-center">
                          <div className={`text-2xl sm:text-3xl font-bold ${
                            isVoting ? 'text-blue-600' : 'text-purple-600'
                          }`}>
                            {option.votes || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 font-medium">{percentage}%</div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-xs sm:text-sm text-yellow-600 font-semibold">Pendiente</div>
                          <div className="text-xs text-yellow-500">No votable</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progreso mejorada */}
                  {!isPending && (
                    <div className="mt-4 sm:mt-6 ml-8 sm:ml-12">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
                        <span>Progreso</span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                        <div 
                          className={`h-2 sm:h-3 rounded-full transition-all duration-500 ease-out ${
                            isVoting ? 'bg-gradient-to-r from-blue-400 to-indigo-400' : 'bg-gradient-to-r from-purple-400 to-pink-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Indicadores adicionales */}
                  {isUserVote && !isPending && !isVoting && (
                    <div className="mt-3 sm:mt-4 ml-8 sm:ml-12 flex items-center gap-2 text-rose-600">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm font-medium">Tu voto</span>
                      <span className="text-xs sm:text-sm text-rose-500">(Click para desvotar)</span>
                    </div>
                  )}

                  {isPending && (
                    <div className="mt-3 sm:mt-4 ml-8 sm:ml-12 flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm font-medium">
                        Esta opción está pendiente de aprobación por los administradores
                      </span>
                    </div>
                  )}

                  {isVoting && (
                    <div className="mt-3 sm:mt-4 ml-8 sm:ml-12 flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="text-xs sm:text-sm font-medium">
                        Procesando tu voto...
                      </span>
                    </div>
                  )}

                  {!user && !isPending && (
                    <div className="mt-3 sm:mt-4 ml-8 sm:ml-12 flex items-center gap-2 text-gray-500">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">
                        Inicia sesión para votar por esta opción
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón para agregar nueva opción mejorado */}
          {user ? (
            <div className="text-center relative z-10">
              {!showAddOption ? (
                <button
                  onClick={() => setShowAddOption(true)}
                  className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl sm:rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl sm:hover:shadow-2xl shadow-lg w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-base sm:text-lg font-semibold">Sugerir Nueva Opción</span>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-pulse" />
                </button>
              ) : (
                <div className="max-w-lg mx-auto space-y-4 sm:space-y-6">
                  {/* Mensaje de estado mejorado */}
                  {suggestionStatus !== 'idle' && (
                    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 ${
                      suggestionStatus === 'submitting' 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800'
                        : suggestionStatus === 'success'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800'
                        : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {suggestionStatus === 'submitting' && (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        )}
                        {suggestionStatus === 'success' && (
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                        {suggestionStatus === 'error' && (
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                        <span className="text-sm sm:text-base font-medium">{suggestionMessage}</span>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleAddOption} className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="optionText" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Tu sugerencia *
                      </label>
                      <input
                        id="optionText"
                        type="text"
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                        placeholder="¿Qué opción te gustaría agregar?"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 text-sm sm:text-base"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="optionDescription" className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Descripción (opcional)
                      </label>
                      <textarea
                        id="optionDescription"
                        value={newOptionDescription}
                        onChange={(e) => setNewOptionDescription(e.target.value)}
                        placeholder="Describe tu sugerencia o da ejemplos..."
                        rows={3}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-purple-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 text-sm sm:text-base"
                        disabled={submitting}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        type="submit"
                        disabled={submitting || !newOptionText.trim()}
                        className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 font-semibold text-sm sm:text-base"
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            Enviando...
                          </div>
                        ) : (
                          'Enviar Sugerencia'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddOption(false);
                          setNewOptionText('');
                          setNewOptionDescription('');
                          setSuggestionStatus('idle');
                          setSuggestionMessage('');
                        }}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-400 transition-all duration-200 font-medium text-sm sm:text-base"
                        disabled={submitting}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6 sm:p-8 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl sm:rounded-2xl relative z-10">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
                ¿Tienes una sugerencia?
              </h4>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                Inicia sesión para votar por tus opciones favoritas y sugerir nuevas ideas
              </p>
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg text-sm sm:text-base w-full sm:w-auto"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                Iniciar Sesión
              </button>
            </div>
          )}

          {/* Total de votos mejorado */}
          <div className="text-center mt-8 sm:mt-10 pt-6 sm:pt-8 border-t-2 border-purple-100 relative z-10">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <span className="text-sm sm:text-base text-gray-700 font-semibold">
                Total de votos: <span className="text-purple-600 text-lg sm:text-xl">{currentTotalVotes}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Login */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </section>
  );
} 