'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  Search
} from 'lucide-react';
import { useSurveys } from '@/hooks/useSurveys';
import { useAuth } from '@/hooks/useAuth';
import type { Survey, SurveyOption } from '@/types';

interface CreateSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string, description: string) => Promise<void>;
  loading: boolean;
}

function CreateSurveyModal({ isOpen, onClose, onSubmit, loading }: CreateSurveyModalProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    await onSubmit(question.trim(), description.trim());
    setQuestion('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Encuesta</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pregunta de la Encuesta *
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="¿Qué productos te gustaría que incluyamos?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción adicional de la encuesta..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Encuesta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ApproveOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  option: SurveyOption | null;
  onApprove: (optionId: number, isApproved: boolean, notes: string) => Promise<void>;
  loading: boolean;
}

function ApproveOptionModal({ isOpen, onClose, option, onApprove, loading }: ApproveOptionModalProps) {
  const [isApproved, setIsApproved] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!option) return;
    
    await onApprove(option.id, isApproved, notes);
    setNotes('');
    onClose();
  };

  if (!isOpen || !option) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isApproved ? 'Aprobar' : 'Rechazar'} Opción
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Opción sugerida:</p>
              <p className="font-medium text-gray-900">{option.option_text}</p>
              {option.description && (
                <p className="text-sm text-gray-500 mt-1">{option.description}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={isApproved}
                  onChange={() => setIsApproved(true)}
                  className="mr-2"
                />
                <span className="text-green-600">Aprobar</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isApproved}
                  onChange={() => setIsApproved(false)}
                  className="mr-2"
                />
                <span className="text-red-600">Rechazar</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas sobre la decisión..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                  isApproved 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ApproveSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: Survey | null;
  onApprove: (surveyId: number, notes: string) => Promise<void>;
  loading: boolean;
}

function ApproveSurveyModal({ isOpen, onClose, survey, onApprove, loading }: ApproveSurveyModalProps) {
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;
    
    await onApprove(survey.id, notes);
    setNotes('');
    onClose();
  };

  if (!isOpen || !survey) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Aprobar Encuesta</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Encuesta a aprobar:</p>
              <p className="font-medium text-gray-900">{survey.question}</p>
              {survey.description && (
                <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas sobre la aprobación..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aprobar Encuesta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface CreateOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: Survey | null;
  onSubmit: (surveyId: number, optionText: string, description: string) => Promise<void>;
  loading: boolean;
}

function CreateOptionModal({ isOpen, onClose, survey, onSubmit, loading }: CreateOptionModalProps) {
  const [optionText, setOptionText] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey || !optionText.trim()) return;
    
    await onSubmit(survey.id, optionText.trim(), description.trim());
    setOptionText('');
    setDescription('');
    onClose();
  };

  if (!isOpen || !survey) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Crear Nueva Opción</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Encuesta:</p>
              <p className="font-medium text-gray-900">{survey.question.substring(0, 60)}...</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto de la Opción *
              </label>
              <input
                type="text"
                value={optionText}
                onChange={(e) => setOptionText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Productos de cuidado facial..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción adicional de la opción..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !optionText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Opción'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SurveysManagementSection() {
  const { user, isAdmin } = useAuth();
  const {
    surveys,
    pendingOptions,
    loading,
    error,
    loadAllSurveys,
    loadPendingOptions,
    createSurvey,
    approveSurveyOption,
    approveSurvey,
    closeSurvey,
    clearError
  } = useSurveys();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showApproveSurveyModal, setShowApproveSurveyModal] = useState(false);
  const [showCreateOptionModal, setShowCreateOptionModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SurveyOption | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [activeTab, setActiveTab] = useState<'surveys' | 'pending'>('surveys');
  
  // Estados para el filtro de opciones pendientes
  const [pendingFilter, setPendingFilter] = useState<string>('all'); // 'all' o survey_id
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Estados para crear opciones
  const [createOptionLoading, setCreateOptionLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadAllSurveys();
      loadPendingOptions();
    }
  }, [isAdmin, loadAllSurveys, loadPendingOptions]);

  // Obtener encuestas únicas de las opciones pendientes
  const uniqueSurveysFromPending = useMemo(() => {
    const surveyMap = new Map();
    pendingOptions.forEach(option => {
      if (!surveyMap.has(option.survey_id)) {
        surveyMap.set(option.survey_id, {
          id: option.survey_id,
          question: option.survey_question || 'Encuesta sin título',
          count: 1
        });
      } else {
        surveyMap.get(option.survey_id).count++;
      }
    });
    return Array.from(surveyMap.values()).sort((a, b) => b.count - a.count);
  }, [pendingOptions]);

  // Filtrar opciones pendientes
  const filteredPendingOptions = useMemo(() => {
    let filtered = pendingOptions;

    // Filtro por encuesta
    if (pendingFilter !== 'all') {
      filtered = filtered.filter(option => option.survey_id.toString() === pendingFilter);
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(option => 
        option.option_text.toLowerCase().includes(term) ||
        option.description?.toLowerCase().includes(term) ||
        (option.survey_question || '').toLowerCase().includes(term) ||
        (option.suggested_by || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [pendingOptions, pendingFilter, searchTerm]);

  const handleCreateSurvey = async (question: string, description: string) => {
    await createSurvey(question, description);
  };

  const handleApproveOption = async (optionId: number, isApproved: boolean, notes: string) => {
    await approveSurveyOption(optionId, isApproved, notes);
  };

  const handleApproveSurvey = async (surveyId: number, notes: string) => {
    await approveSurvey(surveyId, notes);
  };

  const handleCloseSurvey = async (surveyId: number) => {
    if (confirm('¿Estás seguro de que quieres cerrar esta encuesta?')) {
      await closeSurvey(surveyId);
    }
  };

  const handleCreateOption = async (surveyId: number, optionText: string, description: string) => {
    setCreateOptionLoading(true);
    try {
      // Usar la API para crear la opción
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/enhanced-surveys/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          survey_id: surveyId,
          option_text: optionText,
          description: description
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la opción');
      }

      // Recargar las opciones pendientes para mostrar la nueva opción
      await loadPendingOptions();
      
      // Mostrar mensaje de éxito
      alert('Opción creada exitosamente y pendiente de aprobación');
      
    } catch (error) {
      console.error('Error creando opción:', error);
      alert('Error al crear la opción: ' + (error as Error).message);
    } finally {
      setCreateOptionLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setPendingFilter('all');
    setSearchTerm('');
  };

  if (!user || !isAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Acceso restringido a administradores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Gestión de Encuestas
              </h2>
              <p className="text-gray-600 mt-1">
                Administra encuestas y revisa sugerencias de usuarios
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nueva Encuesta
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('surveys')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 ${
              activeTab === 'surveys'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <MessageSquare className={`w-5 h-5 ${activeTab === 'surveys' ? 'text-white' : 'text-gray-400'}`} />
            <span>Encuestas</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              activeTab === 'surveys' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {surveys.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium transition-all duration-200 ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <AlertCircle className={`w-5 h-5 ${activeTab === 'pending' ? 'text-white' : 'text-gray-400'}`} />
            <span>Opciones Pendientes</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              activeTab === 'pending' 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {pendingOptions.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'surveys' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header informativo */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">
                  Gestión de Encuestas
                </h3>
                <p className="text-sm text-blue-700">
                  {surveys.length} encuesta{surveys.length !== 1 ? 's' : ''} en el sistema
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Encuesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {surveys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">No hay encuestas</h4>
                          <p className="text-gray-500">Crea tu primera encuesta para comenzar</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  surveys.map((survey) => (
                    <tr key={survey.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 leading-tight">
                              {survey.question}
                            </div>
                            {survey.description && (
                              <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {survey.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            survey.status === 'active' 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                              : survey.status === 'draft'
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                              : 'bg-gradient-to-r from-red-400 to-rose-400'
                          }`}>
                            {survey.status === 'active' ? (
                              <CheckCircle className="w-4 h-4 text-white" />
                            ) : survey.status === 'draft' ? (
                              <Edit className="w-4 h-4 text-white" />
                            ) : (
                              <XCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            survey.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : survey.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {survey.status === 'active' ? 'Activa' : survey.status === 'draft' ? 'Borrador' : 'Cerrada'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {survey.options_count || 0}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {survey.options_count || 0} opción{(survey.options_count || 0) !== 1 ? 'es' : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {survey.total_votes || 0}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {survey.total_votes || 0} voto{(survey.total_votes || 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-slate-400 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(survey.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(survey.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.open(`/survey/${survey.id}`, '_blank')}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                            title="Ver encuesta"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                          {survey.status === 'active' && (
                            <button
                              onClick={() => handleCloseSurvey(survey.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-rose-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                              title="Cerrar encuesta"
                            >
                              <XCircle className="w-4 h-4" />
                              Cerrar
                            </button>
                          )}
                          {survey.status === 'draft' && (
                            <button
                              onClick={() => {
                                setSelectedSurvey(survey);
                                setShowApproveSurveyModal(true);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                              title="Aprobar encuesta"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Aprobar
                            </button>
                          )}
                          {survey.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedSurvey(survey);
                                setShowCreateOptionModal(true);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-violet-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                              title="Crear opción para esta encuesta"
                            >
                              <Plus className="w-4 h-4" />
                              Crear Opción
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer con estadísticas */}
          {surveys.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span>Total: {surveys.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>Activas: {surveys.filter(s => s.status === 'active').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span>Borradores: {surveys.filter(s => s.status === 'draft').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span>Cerradas: {surveys.filter(s => s.status === 'closed').length}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Última actualización: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header informativo */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Opciones Pendientes de Aprobación
                  </h3>
                  <p className="text-sm text-yellow-700">
                    {filteredPendingOptions.length} de {pendingOptions.length} sugerencia{pendingOptions.length !== 1 ? 's' : ''} esperando tu revisión
                  </p>
                </div>
              </div>
              
              {/* Indicador de filtros activos */}
              {(pendingFilter !== 'all' || searchTerm.trim()) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg border border-yellow-200">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-yellow-800">
                    Filtros aplicados
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filtro por encuesta */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Encuesta
                </label>
                <select
                  value={pendingFilter}
                  onChange={(e) => setPendingFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 text-sm"
                >
                  <option value="all">
                    Todas las encuestas ({pendingOptions.length})
                  </option>
                  {uniqueSurveysFromPending.map((survey) => (
                    <option key={survey.id} value={survey.id.toString()}>
                      {survey.question} ({survey.count} pendiente{survey.count !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Búsqueda */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar en opciones
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por texto, descripción, encuesta o usuario..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  disabled={pendingFilter === 'all' && !searchTerm.trim()}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Resumen de filtros activos */}
            {(pendingFilter !== 'all' || searchTerm.trim()) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600">Filtros activos:</span>
                
                {pendingFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    <MessageSquare className="w-3 h-3" />
                    Encuesta: {uniqueSurveysFromPending.find(s => s.id.toString() === pendingFilter)?.question || 'N/A'}
                    <button
                      onClick={() => setPendingFilter('all')}
                      className="ml-1 hover:text-blue-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {searchTerm.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    <Search className="w-3 h-3" />
                    Búsqueda: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:text-green-600"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opción Sugerida
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Encuesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sugerida por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingOptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">¡Excelente trabajo!</h4>
                          <p className="text-gray-500">No hay opciones pendientes de aprobación</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPendingOptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Search className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">No se encontraron resultados</h4>
                          <p className="text-gray-500">
                            No hay opciones pendientes que coincidan con los filtros aplicados
                          </p>
                          <button
                            onClick={clearFilters}
                            className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                          >
                            Limpiar Filtros
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPendingOptions.map((option) => (
                    <tr key={option.id} className="hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MessageSquare className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 leading-tight">
                                {option.option_text}
                              </div>
                              {option.description && (
                                <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                                  {option.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 leading-tight">
                                {option.survey_question}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ID: {option.survey_id}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {option.suggested_by}
                            </div>
                            <div className="text-xs text-gray-500">
                              Usuario
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-slate-400 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(option.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(option.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOption(option);
                              setShowApproveModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                            title="Revisar y aprobar/rechazar opción"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Revisar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer con estadísticas */}
          {pendingOptions.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span>Pendientes: {filteredPendingOptions.length} de {pendingOptions.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span>Encuestas: {new Set(filteredPendingOptions.map(opt => opt.survey_id)).size} de {uniqueSurveysFromPending.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span>Usuarios: {new Set(filteredPendingOptions.map(opt => opt.suggested_by)).size}</span>
                  </div>
                  {(pendingFilter !== 'all' || searchTerm.trim()) && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="text-purple-600 font-medium">Filtros activos</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Última actualización: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateSurveyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSurvey}
        loading={loading}
      />

      <ApproveOptionModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        option={selectedOption}
        onApprove={handleApproveOption}
        loading={loading}
      />

      <ApproveSurveyModal
        isOpen={showApproveSurveyModal}
        onClose={() => setShowApproveSurveyModal(false)}
        survey={selectedSurvey}
        onApprove={handleApproveSurvey}
        loading={loading}
      />

      <CreateOptionModal
        isOpen={showCreateOptionModal}
        onClose={() => setShowCreateOptionModal(false)}
        survey={selectedSurvey}
        onSubmit={handleCreateOption}
        loading={createOptionLoading}
      />
    </div>
  );
} 