'use client';

import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
  showUserInfo?: boolean;
}

export default function LogoutButton({ 
  variant = 'default', 
  size = 'md', 
  className = '',
  showIcon = true,
  children,
  showUserInfo = false
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { clearCart } = useStore();

  // Si el usuario no está autenticado, no mostrar el botón
  if (!isAuthenticated) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Llamar a la función de logout
      const success = await logout();
      
      if (success) {
        // Limpiar carrito local
        clearCart();
        
        // Mostrar mensaje de éxito
        console.log('✅ Logout exitoso');
        
        // Opcional: mostrar notificación o redirigir
        // Puedes agregar aquí un toast o notificación
      } else {
        console.log('⚠️ Logout completado pero con advertencias');
      }
    } catch (error) {
      console.error('❌ Error durante logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {showUserInfo && user && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span className="font-medium">{user.name}</span>
          {user.role === 'admin' && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Admin
            </span>
          )}
        </div>
      )}
      
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={buttonClasses}
        title="Cerrar sesión"
      >
        {isLoggingOut ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          showIcon && <LogOut className="w-4 h-4" />
        )}
        {children || (isLoggingOut ? 'Cerrando...' : 'Salir')}
      </button>
    </div>
  );
} 