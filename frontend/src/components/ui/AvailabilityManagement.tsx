'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Save,
  X,
  Calendar,
  Settings
} from 'lucide-react';

interface DeliveryLocation {
  id: number;
  name: string;
  address: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TimeSlot {
  id: number;
  location_id: number;
  day_of_week: number;
  time_slot: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DAYS_OF_WEEK = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const COMMON_TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function AvailabilityManagement() {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'locations' | 'schedules'>('locations');
  
  // Estados para modales
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DeliveryLocation | null>(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  
  // Estados para formularios
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    description: '',
    is_active: true
  });
  
  const [timeSlotForm, setTimeSlotForm] = useState({
    location_id: 0,
    day_of_week: 1,
    time_slot: '09:00',
    is_active: true
  });

  // Cargar datos
  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/delivery-locations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      } else {
        throw new Error('Error cargando lugares de entrega');
      }
    } catch (error) {
      console.error('Error cargando lugares:', error);
      setError('Error cargando lugares de entrega');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTimeSlots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/time-slots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data.data || []);
      } else {
        throw new Error('Error cargando horarios');
      }
    } catch (error) {
      console.error('Error cargando horarios:', error);
      setError('Error cargando horarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
    loadTimeSlots();
  }, [loadLocations, loadTimeSlots]);

  // Funciones para lugares de entrega
  const handleCreateLocation = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/delivery-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(locationForm)
      });

      if (response.ok) {
        await loadLocations();
        setShowLocationModal(false);
        resetLocationForm();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error creando lugar de entrega');
      }
    } catch (error) {
      console.error('Error creando lugar:', error);
      setError('Error de conexión');
    }
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/delivery-locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(locationForm)
      });

      if (response.ok) {
        await loadLocations();
        setShowLocationModal(false);
        setEditingLocation(null);
        resetLocationForm();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error actualizando lugar de entrega');
      }
    } catch (error) {
      console.error('Error actualizando lugar:', error);
      setError('Error de conexión');
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lugar de entrega?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/delivery-locations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        await loadLocations();
        await loadTimeSlots(); // Recargar horarios también
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error eliminando lugar de entrega');
      }
    } catch (error) {
      console.error('Error eliminando lugar:', error);
      setError('Error de conexión');
    }
  };

  const handleToggleLocationStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/delivery-locations/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        await loadLocations();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error actualizando estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setError('Error de conexión');
    }
  };

  // Funciones para horarios
  const handleCreateTimeSlot = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/time-slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(timeSlotForm)
      });

      if (response.ok) {
        await loadTimeSlots();
        setShowTimeSlotModal(false);
        resetTimeSlotForm();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error creando horario');
      }
    } catch (error) {
      console.error('Error creando horario:', error);
      setError('Error de conexión');
    }
  };

  const handleUpdateTimeSlot = async () => {
    if (!editingTimeSlot) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/time-slots/${editingTimeSlot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(timeSlotForm)
      });

      if (response.ok) {
        await loadTimeSlots();
        setShowTimeSlotModal(false);
        setEditingTimeSlot(null);
        resetTimeSlotForm();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error actualizando horario');
      }
    } catch (error) {
      console.error('Error actualizando horario:', error);
      setError('Error de conexión');
    }
  };

  const handleDeleteTimeSlot = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este horario?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/time-slots/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        await loadTimeSlots();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error eliminando horario');
      }
    } catch (error) {
      console.error('Error eliminando horario:', error);
      setError('Error de conexión');
    }
  };

  const handleToggleTimeSlotStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/time-slots/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        await loadTimeSlots();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error actualizando estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setError('Error de conexión');
    }
  };

  // Funciones auxiliares
  const resetLocationForm = () => {
    setLocationForm({
      name: '',
      address: '',
      description: '',
      is_active: true
    });
  };

  const resetTimeSlotForm = () => {
    setTimeSlotForm({
      location_id: locations[0]?.id || 0,
      day_of_week: 1,
      time_slot: '09:00',
      is_active: true
    });
  };

  const openLocationModal = (location?: DeliveryLocation) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        name: location.name,
        address: location.address,
        description: location.description || '',
        is_active: location.is_active
      });
    } else {
      setEditingLocation(null);
      resetLocationForm();
    }
    setShowLocationModal(true);
  };

  const openTimeSlotModal = (timeSlot?: TimeSlot) => {
    if (timeSlot) {
      setEditingTimeSlot(timeSlot);
      setTimeSlotForm({
        location_id: timeSlot.location_id,
        day_of_week: timeSlot.day_of_week,
        time_slot: timeSlot.time_slot,
        is_active: timeSlot.is_active
      });
    } else {
      setEditingTimeSlot(null);
      resetTimeSlotForm();
    }
    setShowTimeSlotModal(true);
  };

  const getLocationName = (locationId: number) => {
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Lugar no encontrado';
  };

  const getTimeSlotsByLocation = (locationId: number) => {
    return timeSlots.filter(ts => ts.location_id === locationId);
  };

  const getTimeSlotsByDay = (dayOfWeek: number) => {
    return timeSlots.filter(ts => ts.day_of_week === dayOfWeek);
  };

  if (loading && locations.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestión de Disponibilidad</h3>
          <p className="text-sm text-gray-600">Administra lugares de entrega y horarios disponibles</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('locations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'locations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Lugares de Entrega
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Horarios
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'locations' && (
        <div className="space-y-4">
          {/* Locations Header */}
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">Lugares de Entrega</h4>
            <button
              onClick={() => openLocationModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Lugar
            </button>
          </div>

          {/* Locations List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {locations.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {locations.map((location) => (
                  <div key={location.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="text-sm font-medium text-gray-900">{location.name}</h5>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            location.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {location.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{location.address}</p>
                        {location.description && (
                          <p className="text-sm text-gray-500">{location.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Horarios: {getTimeSlotsByLocation(location.id).length}</span>
                          <span>Creado: {new Date(location.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleLocationStatus(location.id, location.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            location.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={location.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {location.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openLocationModal(location)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p>No hay lugares de entrega configurados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {/* Schedules Header */}
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">Horarios de Disponibilidad</h4>
            <button
              onClick={() => openTimeSlotModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Horario
            </button>
          </div>

          {/* Schedules List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {timeSlots.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="text-sm font-medium text-gray-900">
                            {getLocationName(timeSlot.location_id)}
                          </h5>
                          <span className="text-sm text-gray-600">
                            {DAYS_OF_WEEK[timeSlot.day_of_week]} - {timeSlot.time_slot}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            timeSlot.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {timeSlot.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Creado: {new Date(timeSlot.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTimeSlotStatus(timeSlot.id, timeSlot.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            timeSlot.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={timeSlot.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {timeSlot.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openTimeSlotModal(timeSlot)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTimeSlot(timeSlot.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p>No hay horarios configurados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowLocationModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingLocation ? 'Editar Lugar de Entrega' : 'Agregar Lugar de Entrega'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={locationForm.name}
                      onChange={(e) => setLocationForm({...locationForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Centro Comercial Plaza"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <textarea
                      value={locationForm.address}
                      onChange={(e) => setLocationForm({...locationForm, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Dirección completa del lugar"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                    <textarea
                      value={locationForm.description}
                      onChange={(e) => setLocationForm({...locationForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Información adicional sobre el lugar"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={locationForm.is_active}
                      onChange={(e) => setLocationForm({...locationForm, is_active: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Lugar activo
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={editingLocation ? handleUpdateLocation : handleCreateLocation}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingLocation ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Slot Modal */}
      {showTimeSlotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTimeSlotModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingTimeSlot ? 'Editar Horario' : 'Agregar Horario'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Entrega</label>
                    <select
                      value={timeSlotForm.location_id}
                      onChange={(e) => setTimeSlotForm({...timeSlotForm, location_id: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>Seleccionar lugar</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Día de la Semana</label>
                    <select
                      value={timeSlotForm.day_of_week}
                      onChange={(e) => setTimeSlotForm({...timeSlotForm, day_of_week: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <option key={index} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                    <select
                      value={timeSlotForm.time_slot}
                      onChange={(e) => setTimeSlotForm({...timeSlotForm, time_slot: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {COMMON_TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="time_slot_active"
                      checked={timeSlotForm.is_active}
                      onChange={(e) => setTimeSlotForm({...timeSlotForm, is_active: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="time_slot_active" className="ml-2 block text-sm text-gray-900">
                      Horario activo
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={editingTimeSlot ? handleUpdateTimeSlot : handleCreateTimeSlot}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingTimeSlot ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  onClick={() => setShowTimeSlotModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
