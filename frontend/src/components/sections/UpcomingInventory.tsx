'use client';

import { Calendar, Clock, Package, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import type { Product } from '@/types';

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

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la sección */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            🚚 Próximo Inventario
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nuevos productos llegando pronto. ¡Reserva los tuyos antes de que se agoten!
          </p>
        </div>

        {/* Información de llegada */}
        <div className="
          bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8
          border border-gray-100
        ">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Fecha de llegada */}
            <div className="
              flex flex-col items-center text-center
              p-4 rounded-xl bg-blue-50
              border border-blue-100
            ">
              <div className="
                w-12 h-12 bg-blue-500 rounded-full
                flex items-center justify-center mb-3
              ">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Fecha de Llegada
              </h3>
              <p className="text-blue-600 font-medium">
                {formatDate(arrivalDate)}
              </p>
            </div>

            {/* Horario */}
            <div className="
              flex flex-col items-center text-center
              p-4 rounded-xl bg-purple-50
              border border-purple-100
            ">
              <div className="
                w-12 h-12 bg-purple-500 rounded-full
                flex items-center justify-center mb-3
              ">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Horario
              </h3>
              <p className="text-purple-600 font-medium">
                {arrivalTime}
              </p>
            </div>

            {/* Productos esperados */}
            <div className="
              flex flex-col items-center text-center
              p-4 rounded-xl bg-green-50
              border border-green-100
            ">
              <div className="
                w-12 h-12 bg-green-500 rounded-full
                flex items-center justify-center mb-3
              ">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Productos Esperados
              </h3>
              <p className="text-green-600 font-medium">
                {expectedProducts.length} productos
              </p>
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Productos que Llegan
            </h3>
            <button className="
              flex items-center gap-2 text-purple-600 hover:text-purple-700
              font-medium transition-colors
              group
            ">
              Ver todos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Grid de productos */}
          <div className="
            grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
            gap-4 sm:gap-6
          ">
            {expectedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickBuy={handleQuickBuy}
              />
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="
          text-center bg-white rounded-2xl shadow-lg p-8
          border border-gray-100
        ">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ¿Quieres ser el primero en saber?
          </h3>
          <p className="text-gray-600 mb-6">
            Suscríbete para recibir notificaciones cuando lleguen nuevos productos
          </p>
          <button className="
            bg-gradient-to-r from-purple-600 to-blue-600
            hover:from-purple-700 hover:to-blue-700
            text-white font-semibold
            px-8 py-3 rounded-full
            transition-all duration-300
            transform hover:scale-105
            shadow-lg hover:shadow-xl
          ">
            Notificarme
          </button>
        </div>
      </div>
    </section>
  );
} 