'use client';

// TODO: Desarrollar sección de Próximo Inventario
// Esta sección mostrará productos que están por llegar al inventario
// Incluirá: fecha de llegada, productos esperados, preview de productos, etc.

import { Plus } from 'lucide-react';
import type { Product } from '@/types';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProductImages } from '@/hooks/useProductImages';

interface UpcomingInventoryProps {
  arrivalDate: string;
  arrivalTime: string;
  expectedProducts: Product[];
}

export default function UpcomingInventory({ 
  arrivalDate, 
  expectedProducts 
}: UpcomingInventoryProps) {
  // TODO: Implementar lógica para mostrar productos próximos
  // TODO: Agregar rotación automática de productos
  // TODO: Implementar navegación a vista completa
  
  // Comentado temporalmente - no mostrar en la interfaz
  return null;
  
  /*
  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        // TODO: Header de la sección
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-light text-gray-800">
            Próximo Inventario
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
            Sección en desarrollo - Próximamente
          </p>
        </div>

        // TODO: Implementar preview de productos próximos
        <div className="text-center py-12">
          <div className="bg-blue-50 rounded-lg p-8 border-2 border-dashed border-blue-300">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-blue-700 mb-2">
              Sección en Desarrollo
            </h3>
            <p className="text-blue-600 text-sm">
              Aquí se mostrarán los productos que están por llegar al inventario
            </p>
          </div>
        </div>

        // TODO: Implementar funcionalidades adicionales:
        //   - Lista de productos próximos
        //   - Fecha de llegada
        //   - Notificaciones
        //   - Filtros por categoría
        //   - Vista detallada de productos
        
      </div>
    </section>
  );
  */
}

/* 
CÓDIGO COMENTADO PARA DESARROLLO FUTURO:

// Estado para productos mostrados
const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);

// Efecto para rotar productos cada cierto tiempo
useEffect(() => {
  // Función para seleccionar 3 productos aleatorios
  const selectRandomProducts = () => {
    const shuffled = [...expectedProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

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

const handleViewAllProducts = () => {
  // Aquí implementarías la navegación a la página de próximos productos
};

// Grid de productos con rotación aleatoria
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  {displayedProducts.map((product) => (
    <div key={product.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group cursor-pointer animate-in fade-in-0 duration-500">
      <div className="aspect-square bg-gray-100 rounded-md mb-3 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={product.image_url || '/NoImage.jpg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
        {product.name}
      </h3>
      <p className="text-xs text-gray-500 line-clamp-1">
        {product.product_type_name}
      </p>
    </div>
  ))}
  
  // Tarjeta para ver todos los productos
  <div onClick={handleViewAllProducts} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 shadow-sm border-2 border-dashed border-blue-300 hover:shadow-md hover:border-blue-400 transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center min-h-[140px]">
    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
      <Plus className="w-6 h-6 text-white" />
    </div>
    <h3 className="font-medium text-blue-700 text-sm mb-1 text-center">
      Ver Todos
    </h3>
    <p className="text-xs text-blue-600 text-center">
      {expectedProducts.length} productos más
    </p>
    
    // Indicador de rotación
    <div className="mt-2 flex gap-1">
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
  </div>
</div>
*/ 