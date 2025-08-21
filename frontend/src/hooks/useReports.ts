import { useState, useCallback } from 'react';

interface ReportData {
  periods?: any[];
  totals?: any;
  data?: any[];
}

interface ReportParams {
  startDate: string;
  endDate: string;
  groupBy?: string;
  limit?: number;
}

interface UseReportsReturn {
  // Estado
  reports: Record<string, ReportData>;
  loading: boolean;
  error: string | null;
  
  // Funciones
  loadReport: (reportType: string, params: ReportParams) => Promise<void>;
  loadCustomReport: (params: ReportParams, reportTypes: string[]) => Promise<void>;
  clearError: () => void;
  clearReports: () => void;
  
  // Utilidades
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
  formatDate: (date: string) => string;
  calculateGrowth: (current: number, previous: number) => number;
}

const useReports = (): UseReportsReturn => {
  const [reports, setReports] = useState<Record<string, ReportData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para hacer llamadas a la API
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
    console.log('📡 Llamando a:', `http://localhost:8000${endpoint}`);

    const response = await fetch(`http://localhost:8000${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, []);

  // Cargar un reporte específico
  const loadReport = useCallback(async (reportType: string, params: ReportParams) => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      const queryParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
        ...(params.groupBy && { groupBy: params.groupBy }),
        ...(params.limit && { limit: params.limit.toString() })
      });

      switch (reportType) {
        case 'profit-margin':
          endpoint = `/api/reports/profit-margin?${queryParams}`;
          break;
        case 'top-products':
          endpoint = `/api/reports/top-products?${queryParams}`;
          break;
        case 'top-customers':
          endpoint = `/api/reports/top-customers?${queryParams}`;
          break;
        case 'category-sales':
          endpoint = `/api/reports/category-sales?${queryParams}`;
          break;
        case 'sales-trends':
          endpoint = `/api/reports/sales-trends?${queryParams}`;
          break;
        case 'inventory-value':
          endpoint = `/api/reports/inventory-value`;
          break;
        case 'reservations-conversion':
          endpoint = `/api/reports/reservations-conversion?${queryParams}`;
          break;
        case 'executive-summary':
          endpoint = `/api/reports/executive-summary?${queryParams}`;
          break;
        default:
          throw new Error(`Tipo de reporte no válido: ${reportType}`);
      }

      const data = await apiCall(endpoint);
      
      setReports(prev => ({
        ...prev,
        [reportType]: data.data || data
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error(`Error cargando reporte ${reportType}:`, err);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Cargar reporte personalizado combinado
  const loadCustomReport = useCallback(async (params: ReportParams, reportTypes: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiCall('/api/reports/custom', {
        method: 'POST',
        body: JSON.stringify({
          startDate: params.startDate,
          endDate: params.endDate,
          reportTypes,
          groupBy: params.groupBy || 'month',
          limit: params.limit || 10
        })
      });

      // Actualizar cada reporte individualmente
      const newReports: Record<string, ReportData> = {};
      reportTypes.forEach(type => {
        const key = type.replace('_', '-');
        if (data.data && data.data[type]) {
          newReports[key] = data.data[type];
        }
      });

      setReports(prev => ({
        ...prev,
        ...newReports
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error cargando reporte personalizado:', err);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Limpiar todos los reportes
  const clearReports = useCallback(() => {
    setReports({});
    setError(null);
  }, []);

  // Utilidades de formato
  const formatCurrency = useCallback((amount: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00%';
    }
    return `${value.toFixed(2)}%`;
  }, []);

  const formatDate = useCallback((date: string): string => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  }, []);

  const calculateGrowth = useCallback((current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, []);

  return {
    reports,
    loading,
    error,
    loadReport,
    loadCustomReport,
    clearError,
    clearReports,
    formatCurrency,
    formatPercentage,
    formatDate,
    calculateGrowth
  };
};

export default useReports; 