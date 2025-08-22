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
  AlertCircle
} from 'lucide-react';
import { useSurveys } from '@/hooks/useSurveys';
import { useAuth } from '@/hooks/useAuth';
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
      <section className="py-16" style={{ backgroundColor: 'rgb(244 245 255)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando encuestas...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16" style={{ backgroundColor: 'rgb(244 245 255)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error al cargar encuestas: {error}</p>
        </div>
      </section>
    );
  }

  if (!selectedSurvey || !selectedSurvey.options || selectedSurvey.options.length === 0) {
    return (
      <section className="py-16" style={{ backgroundColor: 'rgb(244 245 255)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay encuestas activas</h3>
          <p className="text-gray-600 mb-4">
            {activeSurveys.length === 0 
              ? 'Actualmente no hay encuestas disponibles para votar. Los administradores pueden crear nuevas encuestas desde el panel de administración.'
              : 'La encuesta seleccionada no tiene opciones disponibles para votar.'
            }
          </p>
          {activeSurveys.length > 0 && (
            <div className="text-sm text-gray-500">
              <p>Encuestas disponibles: {activeSurveys.length}</p>
              <p>Opciones totales: {activeSurveys.reduce((total, survey) => total + (survey.options_count || 0), 0)}</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" style={{ backgroundColor: 'rgb(244 245 255)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la sección */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">
              ¡Tu Opinión Cuenta!
            </h2>
            <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
          </div>
        </div>

        {/* Selector de encuestas */}
        {activeSurveys.length > 1 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar encuesta:
            </label>
            <select
              value={selectedSurvey.id}
              onChange={(e) => {
                const survey = activeSurveys.find(s => s.id === parseInt(e.target.value));
                setSelectedSurvey(survey || null);
              }}
              className="w-full max-w-md mx-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {activeSurveys.map((survey) => (
                <option key={survey.id} value={survey.id}>
                  {survey.question}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Encuesta principal */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100 transition-all duration-300 ${
          !user ? 'opacity-60' : ''
        }`} style={{
          backgroundColor: '#aa94f7'
        }}>
          
          {/* Pregunta */}
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              {selectedSurvey.question}
            </h3>
            {selectedSurvey.description && (
              <p className="text-gray-700">{selectedSurvey.description}</p>
            )}
            
            {/* Mensaje para usuarios no logueados */}
            {!user && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    Solo usuarios logueados pueden votar y sugerir opciones
                  </span>
                </div>
                <div className="text-center mt-2">
                  <a 
                    href="/login" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Iniciar Sesión
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Opciones de votación */}
          <div className="space-y-6 mb-8">
            {selectedSurvey.options.map((option) => {
              const percentage = calculatePercentage(option.votes || 0, currentTotalVotes);
              const isUserVote = selectedSurvey.user_votes?.includes(option.id) || false;
              const isPending = option.status === 'pending';
              const isVoting = votingOptions.has(option.id);
              
              return (
                <div key={option.id} className={`
                  rounded-xl p-4 sm:p-6
                  transition-all duration-200
                  ${!isPending ? 'cursor-pointer' : 'cursor-default'}
                  ${isUserVote ? 'ring-2 ring-rose-400 bg-rose-50' : ''}
                  ${isPending ? 'bg-yellow-50 border-l-4 border-yellow-400 shadow-md' : 'bg-gray-50 hover:bg-gray-100'}
                  ${isVoting ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
                  ${!user ? 'opacity-75' : ''}
                `}
                onClick={() => {
                  if (!user) return; // No permitir interacción para usuarios no logueados
                  if (isPending || isVoting) return; // No permitir votar opciones pendientes o mientras se está votando
                  
                  handleVote(option.id);
                }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPending ? 'bg-yellow-100' : isVoting ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {isPending ? (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        ) : isVoting ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{option.option_text}</h4>
                        {option.description && (
                          <p className="text-sm text-gray-600">{option.description}</p>
                        )}
                        {isPending && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⏳ Pendiente de aprobación
                            </span>
                            {user && (
                              <span className="text-xs text-gray-500">
                                Sugerida por: {option.suggested_by || 'Usuario'}
                              </span>
                            )}
                          </div>
                        )}
                        {isVoting && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Procesando voto...
                            </span>
                          </div>
                        )}
                        
                        {/* Mensaje de acción para usuarios logueados */}
                        {user && !isPending && !isVoting && (
                          <div className="flex items-center gap-2 mt-2">
                            {isUserVote ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                Click para desvotar
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Click para votar
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {!isPending ? (
                        <>
                          <div className={`text-2xl font-bold ${
                            isVoting ? 'text-blue-600' : 'text-purple-600'
                          }`}>
                            {option.votes || 0}
                          </div>
                          <div className="text-sm text-gray-500">{percentage}%</div>
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm text-yellow-600 font-medium">Pendiente</div>
                          <div className="text-xs text-yellow-500">No votable</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progreso solo para opciones aprobadas */}
                  {!isPending && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isVoting ? 'bg-blue-600' : 'bg-purple-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Indicador de voto */}
                  {isUserVote && !isPending && !isVoting && (
                    <div className="mt-3 flex items-center gap-2 text-rose-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Tu voto</span>
                      <span className="text-xs text-rose-500">(Click para desvotar)</span>
                    </div>
                  )}

                  {/* Mensaje para opciones pendientes */}
                  {isPending && (
                    <div className="mt-3 flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Esta opción está pendiente de aprobación por los administradores
                      </span>
                    </div>
                  )}

                  {/* Mensaje para opciones en proceso de voto */}
                  {isVoting && (
                    <div className="mt-3 flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">
                        Procesando tu voto...
                      </span>
                    </div>
                  )}

                  {/* Mensaje para usuarios no logueados */}
                  {!user && !isPending && (
                    <div className="mt-3 flex items-center gap-2 text-gray-500">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        Inicia sesión para votar por esta opción
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón para agregar nueva opción */}
          {user ? (
            <div className="text-center">
              {!showAddOption ? (
                <button
                  onClick={() => setShowAddOption(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Sugerir Nueva Opción
                </button>
              ) : (
                <div className="max-w-md mx-auto space-y-4">
                  {/* Mensaje de estado */}
                  {suggestionStatus !== 'idle' && (
                    <div className={`p-3 rounded-lg border ${
                      suggestionStatus === 'submitting' 
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : suggestionStatus === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        {suggestionStatus === 'submitting' && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {suggestionStatus === 'success' && (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {suggestionStatus === 'error' && (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{suggestionMessage}</span>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleAddOption} className="space-y-4">
                    <div>
                      <label htmlFor="optionText" className="block text-sm font-medium text-gray-700 mb-2">
                        Tu sugerencia *
                      </label>
                      <input
                        id="optionText"
                        type="text"
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                        placeholder="¿Qué opción te gustaría agregar?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="optionDescription" className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción (opcional)
                      </label>
                      <textarea
                        id="optionDescription"
                        value={newOptionDescription}
                        onChange={(e) => setNewOptionDescription(e.target.value)}
                        placeholder="Describe tu sugerencia o da ejemplos..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={submitting}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting || !newOptionText.trim()}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
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
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
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
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">
                ¿Tienes una sugerencia?
              </p>
              <a 
                href="/login" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Inicia sesión para sugerir
              </a>
            </div>
          )}

          {/* Total de votos */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Total de votos: <span className="font-semibold text-purple-600">{currentTotalVotes}</span>
            </p>
            {!user && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  💡 <strong>¿Quieres participar?</strong>
                </p>
                <p className="text-sm text-blue-700 mb-3">
                  Inicia sesión para votar por tus opciones favoritas y sugerir nuevas ideas
                </p>
                <a 
                  href="/login" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Iniciar Sesión
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 