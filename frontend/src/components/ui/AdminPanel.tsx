'use client';

import { useState } from 'react';
import { 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  ShoppingCart, 
  Calendar,
  FileText,
  Shield,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { user, logout } = useAuth();
  const { clearCart } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Estilos CSS personalizados para ocultar scrollbar en móvil
  const scrollbarHideStyles = `
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `;

  if (!isOpen || !user || user.role !== 'admin') {
    return null;
  }

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      clearCart();
      onClose();
    }
  };

  const adminMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Vista general del sistema'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: Users,
      description: 'Gestión de usuarios y permisos'
    },
    {
      id: 'products',
      label: 'Productos',
      icon: Package,
      description: 'Inventario y catálogo'
    },
    {
      id: 'orders',
      label: 'Pedidos',
      icon: ShoppingCart,
      description: 'Gestión de pedidos y ventas'
    },
    {
      id: 'reservations',
      label: 'Reservas',
      icon: Calendar,
      description: 'Sistema de reservas'
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: FileText,
      description: 'Estadísticas y análisis'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      description: 'Ajustes del sistema'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Productos</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">156</p>
                  </div>
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pedidos Hoy</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">23</p>
                  </div>
                  <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Usuarios Activos</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">89</p>
                  </div>
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Actividad Reciente</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-600 flex-1">Nuevo pedido recibido - #1234</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">2 min</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-600 flex-1">Producto agregado al inventario</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">15 min</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm text-gray-600 flex-1">Stock bajo detectado</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">1 hora</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
              <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
                Agregar Usuario
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 sm:p-4 lg:p-6">
                <p className="text-sm sm:text-base text-gray-600">Aquí se mostrará la lista de usuarios con opciones para editar, eliminar y gestionar permisos.</p>
              </div>
            </div>
          </div>
        );
      
      case 'products':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gestión de Productos</h3>
              <button className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base">
                Agregar Producto
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 sm:p-4 lg:p-6">
                <p className="text-sm sm:text-base text-gray-600">Aquí se mostrará el inventario completo con opciones para agregar, editar y gestionar stock.</p>
              </div>
            </div>
          </div>
        );
      
      case 'orders':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gestión de Pedidos</h3>
              <button className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base">
                Ver Todos
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 sm:p-4 lg:p-6">
                <p className="text-sm sm:text-base text-gray-600">Aquí se mostrarán todos los pedidos con opciones para gestionar estados y procesar.</p>
              </div>
            </div>
          </div>
        );
      
      case 'reservations':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sistema de Reservas</h3>
              <button className="bg-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base">
                Nueva Reserva
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 sm:p-4 lg:p-6">
                <p className="text-sm sm:text-base text-gray-600">Aquí se mostrarán las reservas activas y se podrán gestionar las citas.</p>
              </div>
            </div>
          </div>
        );
      
      case 'reports':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reportes y Estadísticas</h3>
              <button className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base">
                Generar Reporte
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 sm:p-4 lg:p-6">
                <p className="text-sm sm:text-base text-gray-600">Aquí se mostrarán gráficos, estadísticas de ventas y análisis del negocio.</p>
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Configuración del Sistema</h3>
              <button className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base">
                Guardar Cambios
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 sm:p-4 lg:p-6">
                <p className="text-sm sm:text-base text-gray-600">Aquí se podrán configurar parámetros del sistema, notificaciones y preferencias.</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {/* Estilos CSS personalizados */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyles }} />
      
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Overlay de fondo oscuro */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
      
      {/* Panel administrativo */}
      <div className="fixed inset-0 w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">Panel Administrativo</h1>
              <p className="text-xs sm:text-sm text-blue-100">Bienvenido, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón de menú para móvil muy pequeño */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="lg:hidden p-2 text-blue-100 hover:text-white transition-colors rounded-full hover:bg-white/20"
              title="Ir al Dashboard"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-blue-100 hover:text-white transition-colors rounded-full hover:bg-white/20"
              title="Cerrar Panel"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido principal con navegación responsiva */}
        <div className="flex flex-col lg:flex-row h-full">
          {/* Sidebar - Oculto en móvil, visible en desktop */}
          <div className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                      ${activeTab === item.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${activeTab === item.id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
            
            {/* Botón de logout */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Navegación móvil - Visible solo en móvil */}
          <div className="lg:hidden border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <div className="flex overflow-x-auto p-2 space-x-2 scrollbar-hide">
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`
                        flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all duration-200 whitespace-nowrap min-w-[80px] touch-manipulation
                        ${activeTab === item.id 
                          ? 'bg-blue-600 text-white shadow-md transform scale-105 ring-2 ring-blue-300' 
                          : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="w-2 h-1 bg-white rounded-full mt-1"></div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Indicador de scroll horizontal */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center opacity-60">
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-y-auto bg-gray-100">
            <div className="p-3 sm:p-4 lg:p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
} 