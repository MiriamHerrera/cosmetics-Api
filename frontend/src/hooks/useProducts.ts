import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@/lib/api';
import { useStore } from '@/store/useStore';
import type { Product, PaginationParams, ApiResponse } from '@/types';

export const useProducts = () => {
  const { products, setProducts, setLoading } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Cargar productos con paginación
  const loadProducts = useCallback(async (params: PaginationParams = { page: 1, limit: 50 }) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Product[]> = await productsApi.getAll(params);
      
      if (response.success && response.data) {
        // Mapear los productos para que coincidan con la estructura esperada
        const mappedProducts = response.data.map((product: any) => ({
          ...product,
          // Asegurar que el precio sea un número
          price: parseFloat(product.price) || 0,
          // Asegurar que el stock sea un número
          stock_total: parseInt(product.stock_total) || 0
        }));
        
        // Guardar todos los productos para paginación local
        setAllProducts(mappedProducts);
        setProducts(mappedProducts);
        setPagination(prev => ({
          ...prev,
          page: 1,
          limit: params.limit,
          total: mappedProducts.length,
          totalPages: Math.ceil(mappedProducts.length / 12)
        }));
      } else {
        setError(response.error || 'Error al cargar productos');
      }
    } catch (err) {
      setError('Error de conexión al cargar productos');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [setProducts, setLoading]);

  // Buscar productos
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadProducts();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Product[]> = await productsApi.search(query);
      
      if (response.success && response.data) {
        // Mapear los productos para que coincidan con la estructura esperada
        const mappedProducts = response.data.map((product: any) => ({
          ...product,
          price: parseFloat(product.price) || 0,
          stock_total: parseInt(product.stock_total) || 0
        }));
        setProducts(mappedProducts);
      } else {
        setError(response.error || 'Error en la búsqueda');
      }
    } catch (err) {
      setError('Error de conexión en la búsqueda');
      console.error('Error searching products:', err);
    } finally {
      setLoading(false);
    }
  }, [setProducts, setLoading]);

  // Filtrar por categoría
  const filterByCategory = useCallback(async (category: string) => {
    if (!category || category === 'all') {
      await loadProducts();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response: ApiResponse<Product[]> = await productsApi.getByCategory(category);
      
      if (response.success && response.data) {
        // Mapear los productos para que coincidan con la estructura esperada
        const mappedProducts = response.data.map((product: any) => ({
          ...product,
          price: parseFloat(product.price) || 0,
          stock_total: parseInt(product.stock_total) || 0
        }));
        setProducts(mappedProducts);
      } else {
        setError(response.error || 'Error al filtrar por categoría');
      }
    } catch (err) {
      setError('Error de conexión al filtrar');
      console.error('Error filtering by category:', err);
      setLoading(false);
    }
  }, [setProducts, setLoading]);

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    allProducts,
    loading: useStore(state => state.isLoading),
    error,
    pagination,
    loadProducts,
    searchProducts,
    filterByCategory,
    refreshProducts: () => loadProducts()
  };
}; 