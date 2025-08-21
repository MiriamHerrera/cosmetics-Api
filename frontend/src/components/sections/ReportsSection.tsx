import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import useReports from '../../hooks/useReports';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface ReportData {
  periods?: any[];
  totals?: any;
  data?: any[];
}

interface ReportsSectionProps {
  className?: string;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ className = '' }) => {
  const { user, isAdmin } = useAuth();
  const { reports, loading, error, loadReport, loadCustomReport, clearError } = useReports();
  const [activeTab, setActiveTab] = useState('profit-margin');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const [limit, setLimit] = useState(10);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Inicializar fechas por defecto (últimos 30 días)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Cargar reporte según la pestaña activa
  const handleLoadReport = useCallback(async () => {
    if (!startDate || !endDate) return;
    if (!user || !isAdmin) {
      console.log('❌ Usuario no autenticado o no es admin');
      return;
    }

    try {
      await loadReport(activeTab, {
        startDate,
        endDate,
        groupBy,
        limit
      });
    } catch (error) {
      console.error('Error cargando reporte:', error);
    }
  }, [activeTab, startDate, endDate, groupBy, limit, loadReport, user, isAdmin]);

  // Cargar reporte cuando cambien los parámetros
  useEffect(() => {
    handleLoadReport();
  }, [handleLoadReport]);

  // Generar reporte personalizado
  const generateCustomReport = async () => {
    try {
      await loadCustomReport({
        startDate,
        endDate,
        groupBy,
        limit
      }, ['profit_margin', 'top_products', 'top_customers', 'executive_summary']);
      alert('Reporte personalizado generado exitosamente. Revisa la consola para ver los datos.');
    } catch (error) {
      console.error('Error generando reporte personalizado:', error);
      alert('Error generando el reporte personalizado.');
    }
  };

  // Exportar reporte (placeholder)
  const exportReport = () => {
    alert('Funcionalidad de exportación en desarrollo. Por ahora, usa la consola del navegador para ver los datos.');
  };

  // Renderizar contenido según la pestaña activa
  const renderTabContent = () => {
    const currentReport = reports[activeTab];

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2 text-gray-600">Cargando reporte...</span>
        </div>
      );
    }

    if (!currentReport) {
      return (
        <div className="text-center py-12 text-gray-500">
          Selecciona una pestaña para cargar el reporte correspondiente
        </div>
      );
    }

    switch (activeTab) {
      case 'profit-margin':
        return renderProfitMarginReport(currentReport);
      case 'top-products':
        return renderTopProductsReport(currentReport);
      case 'top-customers':
        return renderTopCustomersReport(currentReport);
      case 'category-sales':
        return renderCategorySalesReport(currentReport);
      case 'sales-trends':
        return renderSalesTrendsReport(currentReport);
      case 'inventory-value':
        return renderInventoryValueReport(currentReport);
      case 'reservations-conversion':
        return renderReservationsConversionReport(currentReport);
      case 'executive-summary':
        return renderExecutiveSummaryReport(currentReport);
      default:
        return <div>Pestaña no implementada</div>;
    }
  };

  // Renderizar reporte de márgenes de ganancia
  const renderProfitMarginReport = (data: ReportData) => {
    const { periods = [], totals = {} } = data;
    
    return (
      <div className="space-y-6">
        {/* Resumen general */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm text-gray-500">Total Ventas</div>
              <div className="text-2xl font-bold text-green-600">
                ${totals.total_revenue?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm text-gray-500">Total Costos</div>
              <div className="text-2xl font-bold text-red-600">
                ${totals.total_cost?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm text-gray-500">Total Ganancia</div>
              <div className="text-2xl font-bold text-blue-600">
                ${totals.total_profit?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-sm text-gray-500">Margen %</div>
              <div className="text-2xl font-bold text-purple-600">
                {totals.profit_margin_percentage?.toFixed(2) || '0.00'}%
              </div>
            </div>
          </div>
        )}

        {/* Tabla de períodos */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Análisis por Período ({groupBy})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ganancia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margen %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods.map((period: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {period.formatted_period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${period.total_revenue?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${period.total_cost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${period.total_profit?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {period.profit_margin_percentage?.toFixed(2) || '0.00'}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {period.total_orders || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar reporte de productos más rentables
  const renderTopProductsReport = (data: ReportData) => {
    const products = data.data || [];
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Top {limit} Productos Más Rentables
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidades Vendidas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ganancia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margen %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image_url && (
                          <img 
                            className="h-10 w-10 rounded-full mr-3" 
                            src={product.image_url} 
                            alt={product.product_name}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category_name || 'Sin categoría'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.cost_price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.total_quantity_sold || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.total_revenue?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.total_profit?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.profit_margin_percentage?.toFixed(2) || '0.00'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar otros reportes (placeholders)
  const renderTopCustomersReport = (data: ReportData) => (
    <div className="text-center py-12 text-gray-500">
      Reporte de clientes más valiosos - En desarrollo
    </div>
  );

  const renderCategorySalesReport = (data: ReportData) => (
    <div className="text-center py-12 text-gray-500">
      Reporte de ventas por categoría - En desarrollo
    </div>
  );

  const renderSalesTrendsReport = (data: ReportData) => (
    <div className="text-center py-12 text-gray-500">
      Reporte de tendencias de ventas - En desarrollo
    </div>
  );

  const renderInventoryValueReport = (data: ReportData) => (
    <div className="text-center py-12 text-gray-500">
      Reporte de valor de inventario - En desarrollo
    </div>
  );

  const renderReservationsConversionReport = (data: ReportData) => (
    <div className="text-center py-12 text-gray-500">
      Reporte de conversión de reservas - En desarrollo
    </div>
  );

  const renderExecutiveSummaryReport = (data: ReportData) => (
    <div className="text-center py-12 text-gray-500">
      Resumen ejecutivo - En desarrollo
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg font-semibold mb-2">
          Acceso Denegado
        </div>
        <div className="text-gray-600">
          Solo los administradores pueden acceder a los reportes.
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Reportes y Estadísticas</h2>
          <p className="text-gray-600 mt-1">
            Análisis completo de rentabilidad, ventas y operaciones
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateCustomReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Reporte Personalizado
          </button>
          <button
            onClick={exportReport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            {showAdvancedFilters ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} filtros avanzados
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {showAdvancedFilters && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agrupar Por
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">Día</option>
                  <option value="week">Semana</option>
                  <option value="month">Mes</option>
                  <option value="quarter">Trimestre</option>
                  <option value="year">Año</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite
                </label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleLoadReport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Reporte
          </button>
        </div>
      </div>

      {/* Pestañas de reportes */}
      <div className="bg-white rounded-lg shadow border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'profit-margin', name: 'Márgenes de Ganancia', icon: DollarSign },
              { id: 'top-products', name: 'Productos Más Rentables', icon: Package },
              { id: 'top-customers', name: 'Clientes Más Valiosos', icon: Users },
              { id: 'category-sales', name: 'Ventas por Categoría', icon: BarChart3 },
              { id: 'sales-trends', name: 'Tendencias de Ventas', icon: TrendingUp },
              { id: 'inventory-value', name: 'Valor de Inventario', icon: Package },
              { id: 'reservations-conversion', name: 'Conversión de Reservas', icon: Calendar },
              { id: 'executive-summary', name: 'Resumen Ejecutivo', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ReportsSection; 