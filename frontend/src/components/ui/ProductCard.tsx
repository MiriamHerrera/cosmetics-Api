'use client';

import { ShoppingCart, Zap, Heart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import { useState } from 'react';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
  onQuickBuy?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickBuy }: ProductCardProps) {
  const { addToCart, isUpdatingStock, error } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);



  const handleQuickBuy = () => {
    if (onQuickBuy) {
      onQuickBuy(product);
    } else {
      // Lógica por defecto: agregar al carrito y abrir modal de checkout
      addToCart(product, 1);
      // Aquí podrías abrir un modal de checkout rápido
    }
  };

  const handleAddToCart = async () => {
    const success = await addToCart(product, 1);
    if (success) {
      console.log('✅ Producto agregado al carrito');
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
        <Image
          src={product.image_url || '/NoImage.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="
            object-cover
            transition-transform duration-300
            group-hover:scale-105
          "
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
        {product.stock_total <= 5 && product.stock_total > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span className="
              px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-medium
              bg-orange-500 text-white
              rounded-full
            ">
              <span className="hidden sm:inline">Solo {product.stock_total} disponibles</span>
              <span className="sm:hidden">{product.stock_total} disp</span>
            </span>
          </div>
        )}

        {/* Badge de agotado */}
        {product.stock_total === 0 && (
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
          {product.category_name}
        </p>

        {/* Precio y Stock en la misma línea */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-base sm:text-lg " style={{ color: 'red' }}>
            ${product.price.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {product.stock_total}
          </span>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-1.5 sm:gap-2">
          {/* Botón de compra inmediata */}
          <button
            onClick={handleQuickBuy}
            disabled={product.stock_total === 0}
            className="
              flex-1 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white text-xs sm:text-sm font-medium
              py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg
              transition-all duration-300
              flex items-center justify-center gap-1 sm:gap-2
              focus:outline-none focus:ring-2 focus:ring-rose-400
              shadow-sm hover:shadow-md
            "
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Comprar</span>
            <span className="sm:hidden">Ya</span>
          </button>

          {/* Botón de agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock_total === 0 || isUpdatingStock}
            className="
              flex-1 border-2 border-rose-400 hover:bg-gradient-to-r hover:from-rose-400 hover:to-pink-500 hover:text-white
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-rose-400 text-xs sm:text-sm font-medium
              py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg
              transition-all duration-300
              flex items-center justify-center gap-1 sm:gap-2
              focus:outline-none focus:ring-2 focus:ring-rose-400
              shadow-sm hover:shadow-md
            "
          >
            {isUpdatingStock ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                <span className="hidden sm:inline text-rose-400">Actualizando...</span>
                <span className="sm:hidden text-rose-400">...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 sm:w-4 sm:h-4 text-rose-400 group-hover:text-white" />
                <span className="hidden sm:inline text-rose-400 group-hover:text-white">Carrito</span>
                <span className="sm:hidden text-rose-400 group-hover:text-white">+</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 