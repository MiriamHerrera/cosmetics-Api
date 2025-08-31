'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, ShoppingCart, Eye, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getImageUrl } from '@/lib/config';
import ImageCarousel from './ImageCarousel';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onQuickBuy: (product: Product) => void;
  onOpenCart: () => void;
}

export default function ProductCard({ product, onQuickBuy, onOpenCart }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useStore();

  const handleAddToCart = async () => {
    try {
      setError(null);
      await addToCart(product, 1);
      onOpenCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar al carrito');
    }
  };

  // Convertir image_url a array de imágenes
  const getProductImages = (): string[] => {
    if (!product.image_url) return [];
    
    // Si image_url es una cadena con múltiples URLs separadas por comas
    if (typeof product.image_url === 'string' && product.image_url.includes(',')) {
      return product.image_url.split(',').map(url => url.trim()).filter(url => url);
    }
    
    // Si es una sola URL
    if (typeof product.image_url === 'string') {
      return [product.image_url];
    }
    
    return [];
  };

  const productImages = getProductImages();

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
      {/* Carrusel de Imágenes del Producto */}
      <div className="relative">
        <ImageCarousel
          images={productImages}
          productName={product.name}
          className="w-full"
          showFullscreen={true}
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
            z-10
          "
        >
          <Heart 
            className={`w-3 h-3 sm:w-4 sm:h-4 ${
              isFavorite ? 'fill-pink-500 text-pink-500' : 'text-purple-600'
            }`} 
          />
        </button>

        {/* Badge de stock bajo */}
        {product.stock_total <= 5 && product.stock_total > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span className="
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              bg-orange-100 text-orange-800 border border-orange-200
              shadow-sm
            ">
              Solo {product.stock_total} disponible{product.stock_total !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Badge de stock agotado */}
        {product.stock_total === 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <span className="
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              bg-red-100 text-red-800 border border-red-200
              shadow-sm
            ">
              Agotado
            </span>
          </div>
        )}
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
          {/* Botón de compra rápida */}
          <button
            onClick={() => onQuickBuy(product)}
            disabled={product.stock_total === 0}
            className="
              flex-1 bg-gradient-to-r from-purple-600 to-pink-600 
              hover:from-purple-700 hover:to-pink-700
              disabled:from-gray-400 disabled:to-gray-500
              text-white font-medium py-2 px-3 sm:px-4 rounded-xl
              transition-all duration-300 transform hover:scale-105
              disabled:cursor-not-allowed disabled:transform-none
              flex items-center justify-center gap-2
              shadow-lg hover:shadow-xl
            "
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Comprar</span>
          </button>

          {/* Botón de agregar al carrito */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock_total === 0}
            className="
              bg-white border-2 border-purple-200 
              hover:border-purple-300 hover:bg-purple-50
              disabled:border-gray-200 disabled:bg-gray-50
              text-purple-600 font-medium py-2 px-3 sm:px-4 rounded-xl
              transition-all duration-300 transform hover:scale-105
              disabled:cursor-not-allowed disabled:transform-none
              flex items-center justify-center gap-2
              shadow-md hover:shadow-lg
            "
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Carrito</span>
          </button>
        </div>

        {/* Indicador de múltiples imágenes */}
        {productImages.length > 1 && (
          <div className="mt-3 text-center">
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              📸 {productImages.length} imagen{productImages.length !== 1 ? 'es' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 