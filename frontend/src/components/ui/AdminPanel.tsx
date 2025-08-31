'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  ShoppingCart, 
  Calendar,
  FileText,
  Shield,
  LogOut,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';
import { useAdmin } from '@/hooks/useAdmin';
import AddUserModal from './AddUserModal';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import { OrdersSection, ReservationsSection, ReportsSection, SurveysManagementSection } from '@/components/sections';
import { useProductImages } from '@/hooks/useProductImages';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { user, logout } = useAuth();
  const { clearCart } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Hook del admin - solo cargar cuando sea necesario
  const {
    loading,
    error,
    dashboardData,
    users,
    products,
    carts,
    reservations,
    surveys,
    loadUsers,
    loadProducts,
    loadCarts,
    loadReservations,
    loadSurveys,
    updateUserStatus,
    updateProductApproval,
    clearError
  } = useAdmin();

  // Función para eliminar producto
  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${productName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        // Recargar productos después de eliminar
        loadProducts();
        // Mostrar mensaje de éxito (podrías usar un toast aquí)
        alert('Producto eliminado correctamente');
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error de conexión al eliminar el producto');
    }
  };

  // Función para aprobar/rechazar producto
  const handleApproveProduct = async (productId: number, productName: string, isApproved: boolean) => {
    try {
      await updateProductApproval(productId, isApproved);
    } catch (error) {
      console.error('Error actualizando aprobación del producto:', error);
    }
  };

  // Función para editar producto
  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowEditProductModal(true);
  };

  // Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setShowEditProductModal(false);
    setSelectedProduct(null);
  };

  // Función para cuando se actualiza un producto
  const handleProductUpdated = () => {
    loadProducts(); // Recargar la lista de productos
  };

  // Debug: Log cuando cambia el estado del modal - solo en desarrollo y con throttling
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timeoutId = setTimeout(() => {
        console.log('AdminPanel render - showAddUserModal:', showAddUserModal, 'activeTab:', activeTab);
      }, 100); // Throttle logs para evitar spam
      
      return () => clearTimeout(timeoutId);
    }
  }, [showAddUserModal, activeTab]);

  // Cargar datos cuando cambie la pestaña - optimizado para evitar re-renders
  useEffect(() => {
    if (user?.role === 'admin' && isOpen) {
      switch (activeTab) {
        case 'dashboard':
          // Dashboard se carga automáticamente
          break;
        case 'users':
          loadUsers();
          break;
        case 'products':
          loadProducts();
          break;
        case 'carts':
          loadCarts();
          break;
        case 'reservations':
          loadReservations();
          break;
        case 'surveys':
          loadSurveys();
          break;
      }
    }
  }, [activeTab, user?.role, isOpen]); // Solo dependencias esenciales, las funciones ya están memoizadas

  // Memoizar las funciones callback para evitar re-renders
  const handleLogout = useCallback(async () => {
    const success = await logout();
    if (success) {
      clearCart();
      onClose();
    }
  }, [logout, clearCart, onClose]);

  const handleUserStatusToggle = useCallback(async (userId: number, currentStatus: number) => {
    try {
      await updateUserStatus(userId, currentStatus === 0);
    } catch (error) {
      console.error('Error actualizando estado de usuario:', error);
    }
  }, [updateUserStatus]);

  const handleUserAdded = useCallback(async () => {
    // Recargar la lista de usuarios
    await loadUsers();
    // Cerrar el modal
    setShowAddUserModal(false);
  }, [loadUsers]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const handleShowAddUserModal = useCallback(() => {
    setShowAddUserModal(true);
  }, []);

  const handleCloseAddUserModal = useCallback(() => {
    setShowAddUserModal(false);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleRoleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
  }, []);

  const handleFilterUsers = useCallback(() => {
    loadUsers(1, 20, searchTerm, selectedRole, selectedStatus);
  }, [loadUsers, searchTerm, selectedRole, selectedStatus]);

  // Memoizar el menú de admin para evitar re-renders
  const adminMenuItems = useMemo(() => [
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
      id: 'surveys',
      label: 'Encuestas',
      icon: MessageSquare,
      description: 'Gestión de encuestas y votaciones'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      description: 'Ajustes del sistema'
    }
  ], []);

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

  // Función para renderizar el contenido de las pestañas
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-4 sm:space-y-6">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
                <button 
                  onClick={clearError}
                  className="mt-2 text-red-600 hover:text-red-800 underline"
                >
                  Reintentar
                </button>
              </div>
            ) : dashboardData ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Nuevos Usuarios Hoy</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.today_stats.new_users_today}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Nuevos Carritos Hoy</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.today_stats.new_carts_today}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Nuevas Reservas Hoy</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{dashboardData.today_stats.new_reservations_today}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">No hay datos disponibles</div>
            )}
          </div>
        );
      
      case 'users':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
              <button 
                onClick={handleShowAddUserModal}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Agregar Usuario
              </button>
            </div>

            {/* Filtros y búsqueda */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedRole}
                  onChange={handleRoleFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los roles</option>
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={handleStatusFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
                <button
                  onClick={handleFilterUsers}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Filtrar
                </button>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="p-4 text-red-600">{error}</div>
              ) : users.length > 0 ? (
                <>
                  {/* Tabla para pantallas grandes */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actividad</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm text-gray-900">{user.phone}</div>
                                {user.email && (
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="space-y-1">
                                <div>Carritos: {user.total_carts}</div>
                                <div>Reservas: {user.total_reservations}</div>
                                <div>Encuestas: {user.surveys_participated}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleUserStatusToggle(user.id, user.is_active)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                  user.is_active
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {user.is_active ? 'Desactivar' : 'Activar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards para móvil */}
                  <div className="md:hidden space-y-3 p-4">
                    {users.map((user) => (
                      <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{user.name}</h4>
                              <span className="text-xs text-gray-500">ID: {user.id}</span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div>📱 {user.phone}</div>
                              {user.email && <div>📧 {user.email}</div>}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role === 'admin' ? '👑 Admin' : '👤 Cliente'}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? '✅ Activo' : '❌ Inactivo'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-600">
                              <div className="text-center">
                                <div className="font-medium">{user.total_carts || 0}</div>
                                <div>Carritos</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium">{user.total_reservations || 0}</div>
                                <div>Reservas</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium">{user.surveys_participated || 0}</div>
                                <div>Encuestas</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => handleUserStatusToggle(user.id, user.is_active)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                              user.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 p-8">No hay usuarios disponibles</div>
              )}
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gestión de Productos</h3>
            
            {/* Filtros y búsqueda */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <Search className="w-4 h-4 inline mr-2" />
                  Buscar
                </button>
                <button 
                  onClick={() => setShowAddProductModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Agregar Producto
                </button>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando productos...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">
                  <p>Error: {error}</p>
                  <button 
                    onClick={() => loadProducts()}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reintentar
                  </button>
                </div>
              ) : products && products.length > 0 ? (
                <>
                  {/* Tabla para pantallas grandes */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock
                          </th>
                                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aprobación
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {(() => {
                                    const { primary, hasImages } = useProductImages({ 
                                      imageUrl: product.image_url 
                                    });
                                    
                                    return hasImages ? (
                                      <img 
                                        className="h-10 w-10 rounded-full object-cover" 
                                        src={primary} 
                                        alt={product.name}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <Package className="w-5 h-5 text-gray-400" />
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{product.category}</div>
                              <div className="text-sm text-gray-500">{product.product_type}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">${product.price}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{product.stock_total}</div>
                            </td>
                                                      <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.is_approved === 1
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {product.is_approved === 1 ? '✅ Aprobado' : '⏳ Pendiente'}
                              </span>
                              {product.is_approved !== 1 && (
                                <button
                                  onClick={() => handleApproveProduct(product.id, product.name, true)}
                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                                >
                                  Aprobar
                                </button>
                              )}
                              {product.is_approved === 1 && (
                                <button
                                  onClick={() => handleApproveProduct(product.id, product.name, false)}
                                  className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                                >
                                  Desaprobar
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEditProduct(product)}
                                  className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 p-1 rounded transition-colors"
                                  title="Editar producto"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                                              <button 
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards para móvil */}
                  <div className="md:hidden space-y-3 p-4">
                    {products.map((product) => (
                      <div key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 h-16 w-16">
                            {(() => {
                              const { primary, hasImages } = useProductImages({ 
                                imageUrl: product.image_url 
                              });
                              
                              return hasImages ? (
                                <img 
                                  className="h-16 w-16 rounded-lg object-cover" 
                                  src={primary} 
                                  alt={product.name}
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                              );
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>${product.price}</span>
                              <span>Stock: {product.stock_total}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.status === 'active' ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                          {/* Estado de aprobación */}
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.is_approved === 1
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {product.is_approved === 1 ? '✅ Aprobado' : '⏳ Pendiente'}
                            </span>
                            {product.is_approved !== 1 && (
                              <button
                                onClick={() => handleApproveProduct(product.id, product.name, true)}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                              >
                                Aprobar
                              </button>
                            )}
                            {product.is_approved === 1 && (
                              <button
                                onClick={() => handleApproveProduct(product.id, product.name, false)}
                                className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700 transition-colors"
                              >
                                Rechazar
                              </button>
                            )}
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex gap-2">
                            <button className="p-2 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-indigo-600 hover:text-indigo-900 rounded-full hover:bg-indigo-50"
                              title="Editar producto"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p>No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-4 sm:space-y-6">
            <OrdersSection />
          </div>
        );

      case 'reservations':
        return (
          <div className="space-y-4 sm:space-y-6">
            <ReservationsSection />
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-4 sm:space-y-6">
            <ReportsSection />
          </div>
        );

      case 'surveys':
        return (
          <div className="space-y-4 sm:space-y-6">
            <SurveysManagementSection />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Configuración del Sistema</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-gray-600">Funcionalidad de configuración en desarrollo...</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500">
            <p>Selecciona una pestaña para comenzar</p>
          </div>
        );
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
      <div className="fixed inset-0 w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden">
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
              onClick={() => handleTabChange('dashboard')}
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
                    onClick={() => handleTabChange(item.id)}
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
                      onClick={() => handleTabChange(item.id)}
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
          <div className="flex-1 overflow-y-auto bg-gray-100" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <div className="p-3 sm:p-4 lg:p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Modal para agregar usuario */}
    <AddUserModal
      isOpen={showAddUserModal}
      onClose={handleCloseAddUserModal}
      onUserAdded={handleUserAdded}
    />

    {/* Modal para agregar producto */}
    <AddProductModal
      isOpen={showAddProductModal}
      onClose={() => setShowAddProductModal(false)}
      onProductAdded={loadProducts}
    />

    {/* Modal para editar producto */}
    <EditProductModal
      isOpen={showEditProductModal}
      onClose={handleCloseEditModal}
      product={selectedProduct}
      onProductUpdated={handleProductUpdated}
    />
    </>
  );
} 