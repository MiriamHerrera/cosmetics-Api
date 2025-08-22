'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  Loader2,
  AlertCircle
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
  const [selectedOption, setSelectedOption] = useState<SurveyOption | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [activeTab, setActiveTab] = useState<'surveys' | 'pending'>('surveys');

  useEffect(() => {
    if (isAdmin) {
      loadAllSurveys();
      loadPendingOptions();
    }
  }, [isAdmin, loadAllSurveys, loadPendingOptions]);

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Encuestas</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Encuesta
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('surveys')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'surveys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Encuestas ({surveys.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Opciones Pendientes ({pendingOptions.length})
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
                {surveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{survey.question}</div>
                        {survey.description && (
                          <div className="text-sm text-gray-500">{survey.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        survey.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : survey.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {survey.status === 'active' ? 'Activa' : survey.status === 'draft' ? 'Borrador' : 'Cerrada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {survey.options_count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {survey.total_votes || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(survey.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => window.open(`/survey/${survey.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver encuesta"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {survey.status === 'active' && (
                        <button
                          onClick={() => handleCloseSurvey(survey.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Cerrar encuesta"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {survey.status === 'draft' && (
                        <button
                          onClick={() => {
                            setSelectedSurvey(survey);
                            setShowApproveSurveyModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Aprobar encuesta"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                {pendingOptions.map((option) => (
                  <tr key={option.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{option.option_text}</div>
                        {option.description && (
                          <div className="text-sm text-gray-500">{option.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {option.survey_question}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {option.suggested_by}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(option.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOption(option);
                          setShowApproveModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Revisar opción"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
} 