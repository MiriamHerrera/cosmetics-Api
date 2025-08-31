'use client';

import { ShoppingCart, Zap, Heart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import { useState } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/config';

interface ProductCardProps {
  product: Product;
  onQuickBuy?: (product: Product) => void;
  onOpenCart?: () => void; // Nueva prop para abrir el carrito
}

export default function ProductCard({ product, onQuickBuy, onOpenCart }: ProductCardProps) {
  const { addToCart, isUpdatingStock, error } = useCart();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuickBuy = async () => {
    console.log('🚀 handleQuickBuy iniciado para:', product.name);
    console.log('📦 Producto:', product);
    console.log('🔑 onQuickBuy existe:', !!onQuickBuy);
    console.log('🔑 onOpenCart existe:', !!onOpenCart);
    
    // Siempre agregar al carrito primero
    console.log('➕ Intentando agregar al carrito...');
    const success = await addToCart(product, 1);
    console.log('✅ Resultado de addToCart:', success);
    
    if (success) {
      console.log('🎉 Producto agregado exitosamente');
      // Mostrar indicador de éxito
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      if (onQuickBuy) {
        console.log('📞 Ejecutando onQuickBuy...');
        // Si se pasa onQuickBuy, ejecutar esa función
        onQuickBuy(product);
      } else if (onOpenCart) {
        console.log('📞 Ejecutando onOpenCart...');
        // Lógica por defecto: abrir modal del carrito
        onOpenCart();
      } else {
        console.log('⚠️ No hay onQuickBuy ni onOpenCart definidos');
      }
    } else {
      console.log('❌ Error al agregar al carrito');
    }
  };

  const handleAddToCart = async () => {
    const success = await addToCart(product, 1);
    if (success) {
      // Opcional: mostrar notificación de éxito
    }
  };

  return (
    <div className="
      bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl
      transition-all duration-500 ease-out
      transform hover:-translate-y-2 hover:scale-[1.02]
      overflow-hidden
      group
      font-sans
      border border-purple-100 hover:border-purple-200
      sm:rounded-2xl rounded-xl
    ">
      {/* Imagen del producto */}
      <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
        <Image
          src={getImageUrl(product.image_url)}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="
            object-cover
            transition-transform duration-500
            group-hover:scale-110
          "
        />
        
        {/* Botón de favorito */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="
            absolute top-2 right-2 sm:top-3 sm:right-3
            p-1.5 sm:p-2 rounded-full
            bg-white/90 backdrop-blur-sm
            hover:bg-white transition-all duration-300
            focus:outline-none focus:ring-4 focus:ring-pink-200
            shadow-lg hover:shadow-xl
            transform hover:scale-110
          "
        >
          <Heart 
            className={`w-3 h-3 sm:w-4 sm:h-4 ${
              isFavorite ? 'fill-pink-500 text-pink-500' : 'text-purple-600'
            }`} 
          />
        </button>

        {/* Badge de stock */}
        {product.stock_total <= 5 && product.stock_total > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span className="
              px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold
              bg-gradient-to-r from-orange-400 to-red-500 text-white
              rounded-full shadow-lg
              border border-orange-300
            ">
              <span className="hidden sm:inline">Solo {product.stock_total} disponibles</span>
              <span className="sm:hidden">{product.stock_total}</span>
            </span>
          </div>
        )}

        {/* Badge de agotado */}
        {product.stock_total === 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span className="
              px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold
              bg-gradient-to-r from-red-400 to-red-600 text-white
              rounded-full shadow-lg
              border border-red-300
            ">
              Agotado
            </span>
          </div>
        )}

        {/* Overlay de gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Información del producto */}
      <div className="p-3 sm:p-5">
        {/* Nombre del producto */}
        <h3 className="
          font-semibold text-gray-900 mb-2
          text-sm sm:text-base
          leading-tight group-hover:text-purple-800
          transition-colors duration-300
          h-10 sm:h-12 flex items-start
        ">
          {product.name}
        </h3>

        {/* Tipo/Variante del producto */}
        <p className="
          text-xs text-purple-600 mb-2 sm:mb-3
          font-medium bg-purple-50 px-2 py-1 rounded-lg
          inline-block
        ">
          {product.category_name}
        </p>

        {/* Precio y Stock en la misma línea */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ${product.price.toFixed(2)}
          </span>
          <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-1 rounded-lg">
            <span className="hidden sm:inline">Stock: </span>{product.stock_total}
          </span>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-1.5 sm:gap-2">
          {/* Botón de compra inmediata */}
          <button
            onClick={handleQuickBuy}
            disabled={product.stock_total === 0}
            className={`
              flex-1 relative overflow-hidden
              ${showSuccess 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white text-xs sm:text-sm font-semibold
              py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl
              transition-all duration-300
              flex items-center justify-center gap-1 sm:gap-2
              focus:outline-none focus:ring-4 focus:ring-purple-200
              shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
            `}
          >
            {showSuccess ? (
              <>
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                <span className="relative z-10">✓ Agregado</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Comprar</span>
                <span className="sm:hidden">Ya</span>
              </>
            )}
          </button>

          {/* Botón de agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock_total === 0 || isUpdatingStock}
            className="
              flex-1 border-2 border-purple-400 hover:bg-gradient-to-r hover:from-purple-400 hover:to-pink-500 hover:text-white hover:border-transparent
              disabled:bg-gray-300 disabled:cursor-not-allowed
              text-purple-600 text-xs sm:text-sm font-semibold
              py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl
              transition-all duration-300
              flex items-center justify-center gap-1 sm:gap-2
              focus:outline-none focus:ring-4 focus:ring-purple-200
              shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
            "
          >
            {isUpdatingStock ? (
              <>
                <div className="w-3 h-3 sm:w-4 h-4 mr-1 sm:mr-2 inline animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                <span className="hidden sm:inline text-purple-600">Actualizando...</span>
                <span className="sm:hidden text-purple-600">...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3 sm:w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline text-purple-600">Carrito</span>
                <span className="sm:hidden text-purple-600">+</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 