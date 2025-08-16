'use client';

import { ShoppingCart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useState } from 'react';
import CartModal from './CartModal';

export default function CartButton() {
  const { cartItemCount } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <button
        onClick={openModal}
        className="
          bg-gradient-to-r from-purple-200 to-blue-200
          hover:from-purple-300 hover:to-blue-300
          text-white font-medium
          px-6 py-3 rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          flex items-center gap-3
          transform hover:scale-105
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        "
      >
        <ShoppingCart className="w-5 h-5" />
        <span>Carrito ({cartItemCount})</span>
      </button>

      <CartModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
} 