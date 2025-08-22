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

  // Función para votar
  const handleVote = async (optionId: number) => {
    if (!user || !selectedSurvey) return;
    
    try {
      setSubmitting(true);
      await voteInSurvey(selectedSurvey.id, optionId);
    } catch (error) {
      console.error('Error al votar:', error);
    } finally {
      setSubmitting(false);
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

  // Función para agregar nueva opción
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSurvey || !newOptionText.trim()) return;
    
    try {
      setSubmitting(true);
      await addSurveyOption(selectedSurvey.id, newOptionText.trim(), newOptionDescription.trim());
      setNewOptionText('');
      setNewOptionDescription('');
      setShowAddOption(false);
    } catch (error) {
      console.error('Error al agregar opción:', error);
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
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100" style={{
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
          </div>

          {/* Opciones de votación */}
          <div className="space-y-6 mb-8">
            {selectedSurvey.options.map((option) => {
              const percentage = calculatePercentage(option.votes || 0, currentTotalVotes);
              const isUserVote = selectedSurvey.user_vote === option.id;
              const isPending = option.status === 'pending';
              
              return (
                <div key={option.id} className={`
                  bg-gray-50 rounded-xl p-4 sm:p-6
                  hover:bg-gray-100 transition-colors duration-200
                  ${!isPending ? 'cursor-pointer' : 'cursor-default'}
                  ${isUserVote ? 'ring-2 ring-rose-400 bg-rose-50' : ''}
                  ${isPending ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}
                `}
                onClick={() => {
                  if (isPending) return; // No permitir votar opciones pendientes
                  
                  if (isUserVote) {
                    // Si ya votó por esta opción, desvotar
                    handleVote(option.id);
                  } else {
                    // Si no ha votado, votar
                    handleVote(option.id);
                  }
                }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isPending ? 'bg-yellow-100' : 'bg-purple-100'
                      }`}>
                        {isPending ? (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
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
                              Pendiente de aprobación
                            </span>
                            {user && (
                              <span className="text-xs text-gray-500">
                                Sugerida por: {option.suggested_by || 'Usuario'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {!isPending ? (
                        <>
                          <div className="text-2xl font-bold text-purple-600">{option.votes || 0}</div>
                          <div className="text-sm text-gray-500">{percentage}%</div>
                        </>
                      ) : (
                        <div className="text-sm text-yellow-600 font-medium">Pendiente</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progreso solo para opciones aprobadas */}
                  {!isPending && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Indicador de voto */}
                  {isUserVote && !isPending && (
                    <div className="mt-3 flex items-center gap-2 text-rose-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Tu voto</span>
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
                </div>
              );
            })}
          </div>

          {/* Botón para agregar nueva opción */}
          {user && (
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
                <form onSubmit={handleAddOption} className="max-w-md mx-auto space-y-4">
                  <div>
                    <input
                      type="text"
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      placeholder="Tu sugerencia..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      value={newOptionDescription}
                      onChange={(e) => setNewOptionDescription(e.target.value)}
                      placeholder="Descripción (opcional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !newOptionText.trim()}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddOption(false);
                        setNewOptionText('');
                        setNewOptionDescription('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Total de votos */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Total de votos: <span className="font-semibold text-purple-600">{currentTotalVotes}</span>
            </p>
            {!user && (
              <p className="text-sm text-gray-500 mt-2">
                <a href="/login" className="text-purple-600 hover:underline">Inicia sesión</a> para votar y sugerir opciones
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 