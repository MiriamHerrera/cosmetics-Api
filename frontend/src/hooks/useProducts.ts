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

  // Buscar productos (local - sin llamadas API)
  const searchProducts = useCallback((query: string) => {
    if (!query.trim()) {
      // Si no hay query, mostrar todos los productos originales
      setAllProducts(products);
      setPagination(prev => ({
        ...prev,
        page: 1,
        total: products.length,
        totalPages: Math.ceil(products.length / 12)
      }));
      return;
    }

    // Filtrar localmente los productos ya cargados
    const searchTerm = query.toLowerCase().trim();
    const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category_name.toLowerCase().includes(searchTerm) ||
      product.product_type_name.toLowerCase().includes(searchTerm)
    );
    
    setAllProducts(filteredProducts);
    setPagination(prev => ({
      ...prev,
      page: 1,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / 12)
    }));
  }, [products]);

  // Filtrar por categoría (local - sin llamadas API)
  const filterByCategory = useCallback((category: string) => {
    if (!category || category === 'all') {
      // Si es "todas", mostrar todos los productos originales
      setAllProducts(products);
      setPagination(prev => ({
        ...prev,
        page: 1,
        total: products.length,
        totalPages: Math.ceil(products.length / 12)
      }));
      return;
    }

    // Filtrar localmente los productos ya cargados
    const filteredProducts = products.filter(product => 
      product.category_name === category
    );
    
    setAllProducts(filteredProducts);
    setPagination(prev => ({
      ...prev,
      page: 1,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / 12)
    }));
  }, [products]);

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