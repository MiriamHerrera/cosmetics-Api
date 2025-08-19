import { useState, useEffect, useCallback } from 'react';
import { categoriesApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import type { Category, ApiResponse } from '@/types';

export const useCategories = () => {
  const { categories, setCategories } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar todas las categorías
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Category[]> = await categoriesApi.getAll();
      
      if (response.success && response.data) {
        // Extraer solo los nombres de las categorías para mantener compatibilidad con el store actual
        const categoryNames = response.data.map((cat: Category) => cat.name);
        setCategories(categoryNames);
      } else {
        setError(response.error || 'Error al cargar categorías');
      }
    } catch (err) {
      setError('Error de conexión al cargar categorías');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, [setCategories]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    refreshCategories: () => loadCategories()
  };
}; 