'use client';

import { Calendar, Clock, Package, ArrowRight, Plus } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import type { Product } from '@/types';
import { useState, useEffect } from 'react';

interface UpcomingInventoryProps {
  arrivalDate: string;
  arrivalTime: string;
  expectedProducts: Product[];
}

export default function UpcomingInventory({ 
  arrivalDate, 
  arrivalTime, 
  expectedProducts 
}: UpcomingInventoryProps) {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);

  // Función para seleccionar 3 productos aleatorios
  const selectRandomProducts = () => {
    const shuffled = [...expectedProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  // Efecto para rotar productos cada cierto tiempo
  useEffect(() => {
    // Seleccionar productos iniciales
    setDisplayedProducts(selectRandomProducts());

    // Rotar productos cada 8 segundos
    const interval = setInterval(() => {
      setDisplayedProducts(selectRandomProducts());
    }, 8000);

    return () => clearInterval(interval);
  }, [expectedProducts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleQuickBuy = (product: Product) => {
    // Aquí implementarías la lógica de compra inmediata
    console.log('Compra inmediata:', product);
  };

  const handleViewAllProducts = () => {
    // Aquí implementarías la navegación a la página de próximos productos
    console.log('Navegar a página de próximos productos');
  };

  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header minimalista */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h2 className="text-2xl sm:text-3xl font-light text-gray-800">
              Próximo Inventario
            </h2>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
            Nuevos productos llegando el <span className="font-semibold text-blue-600">{formatDate(arrivalDate)}</span>
          </p>
        </div>

        {/* Preview minimalista de productos con rotación aleatoria */}
        <div className="mb-10">
          <div className="
            grid grid-cols-2 sm:grid-cols-4 gap-4
          ">
            {/* 3 productos aleatorios */}
            {displayedProducts.map((product) => (
              <div key={product.id} className="
                bg-white rounded-lg p-4 shadow-sm border border-gray-100
                hover:shadow-md transition-shadow duration-200
                group cursor-pointer
                animate-in fade-in-0 duration-500
              ">
                <div className="aspect-square bg-gray-100 rounded-md mb-3 overflow-hidden">
                  <img
                    src={product.image || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {product.brand}
                </p>
              </div>
            ))}

            {/* 4ta tarjeta - Indicador para ver todos */}
            <div 
              onClick={handleViewAllProducts}
              className="
                bg-gradient-to-br from-blue-50 to-purple-50
                rounded-lg p-4 shadow-sm border-2 border-dashed border-blue-300
                hover:shadow-md hover:border-blue-400 transition-all duration-300
                cursor-pointer group
                flex flex-col items-center justify-center
                min-h-[140px]
              "
            >
              <div className="
                w-12 h-12 bg-blue-500 rounded-full
                flex items-center justify-center mb-3
                group-hover:scale-110 transition-transform duration-300
              ">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-medium text-blue-700 text-sm mb-1 text-center">
                Ver Todos
              </h3>
              <p className="text-xs text-blue-600 text-center">
                {expectedProducts.length} productos más
              </p>
              
              {/* Indicador de rotación */}
              <div className="mt-2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">          
          <p className="text-sm text-gray-500" style={{ paddingBottom: '2rem' }}>
            Descubre qué más está por llegar
          </p>
        </div>
      </div>
    </section>
  );
} 