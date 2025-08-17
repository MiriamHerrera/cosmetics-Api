'use client';

import { ShoppingCart, Zap, Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Product } from '@/types';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onQuickBuy?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickBuy }: ProductCardProps) {
  const { addToCart } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      addToCart(product, 1);
      // Aquí podrías mostrar una notificación de éxito
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBuy = () => {
    if (onQuickBuy) {
      onQuickBuy(product);
    } else {
      // Lógica por defecto: agregar al carrito y abrir modal de checkout
      addToCart(product, 1);
      // Aquí podrías abrir un modal de checkout rápido
    }
  };

  return (
    <div className="
      bg-white rounded-xl shadow-md hover:shadow-lg
      transition-all duration-300 ease-in-out
      transform hover:-translate-y-1
      overflow-hidden
      group
      font-sans
    ">
      {/* Imagen del producto */}
      <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image || '/placeholder-product.jpg'}
          alt={product.name}
          className="
            w-full h-full object-cover
            transition-transform duration-300
            group-hover:scale-105
          "
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.jpg';
          }}
        />
        
        {/* Botón de favorito */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="
            absolute top-2 right-2 sm:top-3 sm:right-3
            p-1.5 sm:p-2 rounded-full
            bg-white/80 backdrop-blur-sm
            hover:bg-white transition-colors
            focus:outline-none focus:ring-2 focus:ring-pink-500
          "
        >
          <Heart 
            className={`w-3 h-3 sm:w-4 sm:h-4 ${
              isFavorite ? 'fill-pink-500 text-pink-500' : 'text-gray-600'
            }`} 
          />
        </button>

        {/* Badge de stock */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span className="
              px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium
              bg-orange-500 text-white
              rounded-full
            ">
              <span className="hidden sm:inline">Solo {product.stock} disponibles</span>
              <span className="sm:hidden">{product.stock} disp</span>
            </span>
          </div>
        )}

        {/* Badge de agotado */}
        {product.stock === 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span className="
              px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium
              bg-red-500 text-white
              rounded-full
            ">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="p-3 sm:p-4">
        {/* Nombre del producto */}
        <h3 className="
          font-sans text-gray-900 mb-2
          line-clamp-2 text-sm sm:text-base
          leading-tight
        ">
          {product.name}
        </h3>

        {/* Tipo/Variante del producto */}
        <p className="
          text-xs text-gray-500 mb-2
          font-medium
        ">
          {product.category}
        </p>

        {/* Precio y Stock en la misma línea */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-base sm:text-lg " style={{ color: 'red' }}>
            ${product.price.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {product.stock}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-1.5 sm:gap-2">
          {/* Botón de compra inmediata */}
          <button
            onClick={handleQuickBuy}
            disabled={product.stock === 0 || isLoading}
            className="
              flex-1 bg-pink-600 hover:bg-pink-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white text-xs sm:text-sm font-medium
              py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg
              transition-colors duration-200
              flex items-center justify-center gap-1 sm:gap-2
              focus:outline-none focus:ring-2 focus:ring-pink-500
            "
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Comprar</span>
            <span className="sm:hidden">Ya</span>
          </button>

          {/* Botón de agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isLoading}
            className="
              flex-1 border-2 border-pink-600 hover:bg-pink-700
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white text-xs sm:text-sm font-medium
              py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg
              transition-colors duration-200
              flex items-center justify-center gap-1 sm:gap-2
              focus:outline-none focus:ring-2 focus:ring-pink-500
           "
          >
            <ShoppingCart className="w-4 h-4 sm:w-4 sm:h-4 text-pink-600" />
            <span className="hidden sm:inline text-pink-600">Carrito</span>
            <span className="sm:hidden text-pink-600">+</span>
          </button>
        </div>
      </div>
    </div>
  );
} 