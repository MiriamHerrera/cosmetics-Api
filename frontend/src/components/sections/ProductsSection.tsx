'use client';

import { useState, useEffect } from 'react';
import { useProducts, useCategories } from '@/hooks';
import { ProductCard, CartModal } from '@/components/ui';
import { Search, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types';

export default function ProductsSection() {
  const { allProducts, loading, error, searchProducts, filterByCategory } = useProducts();
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const productsPerPage = 12;



  // Búsqueda en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Resetear a la primera página
      searchProducts(searchQuery);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchProducts]);

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Resetear a la primera página
    filterByCategory(category);
  };

  const handleQuickBuy = (product: Product) => {
    // Lógica de compra rápida: solo abrir el modal del carrito
    // El ProductCard se encargará de agregar el producto
    console.log('🛒 handleQuickBuy en ProductsSection para:', product.name);
    console.log('🔑 Estado actual isCartModalOpen:', isCartModalOpen);
    
    // Abrir el modal del carrito inmediatamente
    // El ProductCard agregará el producto y luego llamará a onOpenCart
    console.log('🚪 Abriendo modal del carrito...');
    setIsCartModalOpen(true);
    console.log('🔑 Nuevo estado isCartModalOpen:', true);
  };

  const handleOpenCart = () => {
    console.log('🔑 handleOpenCart llamado');
    console.log('🔑 Estado actual isCartModalOpen:', isCartModalOpen);
    setIsCartModalOpen(true);
    console.log('🔑 Nuevo estado isCartModalOpen:', true);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    // Los productos se cargan automáticamente en el hook
  }, []);



  // Calcular productos para la página actual
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = allProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(allProducts.length / productsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-2 text-gray-600">Cargando productos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error de Conexión</h3>
          <p className="text-red-700 mb-4">
            {error.includes('Network Error') || error.includes('ERR_NETWORK') 
              ? 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose.'
              : error
            }
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de la sección */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Nuestros Productos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra amplia selección de cosméticos y productos de belleza de alta calidad
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Búsqueda */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtro de categorías - COMENTADO TEMPORALMENTE */}
            {/* <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div> */}
          </div>
        </div>

        {/* Grid de productos */}
        {currentProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickBuy={handleQuickBuy}
                  onOpenCart={handleOpenCart}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Información de resultados */}
                <div className="text-sm text-gray-600">
                  Mostrando {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, allProducts.length)} de {allProducts.length} productos
                </div>

                {/* Navegación de páginas */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 rounded-lg border ${
                        currentPage === page
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : !loading && !error ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'No se encontraron productos' 
                  : 'No hay productos disponibles'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery && selectedCategory !== 'all' 
                  ? `No se encontraron productos que coincidan con "${searchQuery}" en la categoría "${selectedCategory}"`
                  : searchQuery 
                    ? `No se encontraron productos que coincidan con "${searchQuery}"`
                    : selectedCategory !== 'all'
                      ? `No hay productos en la categoría "${selectedCategory}"`
                      : 'No se encontraron productos con los criterios de búsqueda actuales.'
                }
              </p>
              {(searchQuery || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
      <CartModal 
        isOpen={isCartModalOpen} 
        onClose={() => setIsCartModalOpen(false)} 
      />
    </section>
  );
} 