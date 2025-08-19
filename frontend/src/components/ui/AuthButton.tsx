'use client';

import { LoginButton, LogoutButton } from './index';
import { useAuth } from '@/hooks/useAuth';

interface AuthButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  showUserInfo?: boolean;
  children?: React.ReactNode;
}

export default function AuthButton({ 
  variant = 'default', 
  size = 'md', 
  className = '',
  showIcon = true,
  showUserInfo = false,
  children 
}: AuthButtonProps) {
  const { user, isAuthenticated, isInitialized } = useAuth();
  
  // Debug logs
  console.log('🔍 AuthButton - Estado de autenticación:', {
    user,
    isAuthenticated,
    isInitialized,
    hasToken: typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false
  });
  
  // No renderizar nada hasta que la autenticación esté inicializada
  if (!isInitialized) {
    return null;
  }
  
  return (
    <>
      {/* Mostrar LoginButton solo si NO está autenticado */}
      {!isAuthenticated && (
        <LoginButton
          variant={variant}
          size={size}
          className={className}
          showIcon={showIcon}
        >
          {children}
        </LoginButton>
      )}

      {/* Mostrar LogoutButton solo si SÍ está autenticado */}
      {isAuthenticated && (
        <LogoutButton
          variant={variant}
          size={size}
          className={className}
          showIcon={showIcon}
          showUserInfo={showUserInfo}
        >
          {children}
        </LogoutButton>
      )}
    </>
  );
} 