'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestMode } from '@/hooks/useGuestMode';
import { LoginModal } from './index';

interface LoginButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export default function LoginButton({ 
  variant = 'default', 
  size = 'md', 
  className = '',
  showIcon = true,
  children 
}: LoginButtonProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isGuestMode } = useGuestMode();

  // Si el usuario ya está autenticado, no mostrar el botón
  if (isAuthenticated) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const handleLoginSuccess = () => {
    // El modal se cierra automáticamente
    // El carrito se migra automáticamente en useAuth
    console.log('✅ Login exitoso, carrito migrado');
  };

  return (
    <>
      <button
        onClick={() => setIsLoginModalOpen(true)}
        className={buttonClasses}
        title={isGuestMode ? "Iniciar sesión para guardar tu carrito" : "Iniciar sesión"}
      >
        {showIcon && <LogIn className="w-4 h-4" />}
        {children || 'Iniciar Sesión'}
      </button>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
} 