'use client';

import { useState } from 'react';
import { X, User, Lock, Phone, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestMode } from '@/hooks/useGuestMode';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, register, loading, error, clearError } = useAuth();
  const { isGuestMode } = useGuestMode();

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (isLoginMode) {
      if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
      if (!formData.password) newErrors.password = 'La contraseña es requerida';
    } else {
      if (!formData.name) newErrors.name = 'El nombre es requerido';
      if (!formData.phone) newErrors.phone = 'El teléfono es requerido';
      if (!formData.password) newErrors.password = 'La contraseña es requerida';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
      if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    let success = false;

    if (isLoginMode) {
      success = await login(formData.phone, formData.password);
    } else {
      success = await register({
        name: formData.name,
        phone: formData.phone,
        password: formData.password
      });
    }

    if (success) {
      // Limpiar formulario
      setFormData({
        name: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      
      // Cerrar modal y ejecutar callback de éxito
      onClose();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      name: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    clearError();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay de fondo oscuro */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal centrado */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="
          relative w-full max-w-sm sm:max-w-md bg-white rounded-lg shadow-xl
          transform transition-all duration-300 ease-in-out
          animate-in fade-in-0 zoom-in-95
          mx-2
        ">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3">
              {isLoginMode ? (
                <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
              ) : (
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
              )}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="
                p-2 text-gray-400 hover:text-gray-600
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full
              "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-4 sm:p-6">

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`
                        w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500
                        ${errors.name ? 'border-red-300' : 'border-gray-300'}
                      `}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
              )}

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`
                      w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500
                      ${errors.phone ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Tu número de teléfono"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>



              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`
                      w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500
                      ${errors.password ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="Tu contraseña"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
              </div>

              {!isLoginMode && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`
                        w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500
                        ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}
                      `}
                      placeholder="Confirma tu contraseña"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white py-2 px-4 rounded-lg font-medium
                  hover:from-rose-500 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isLoginMode ? 'Iniciando sesión...' : 'Creando cuenta...'}
                  </span>
                ) : (
                  isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'
                )}
              </button>
            </form>

            {/* Cambiar modo */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-sm text-pink-600 hover:text-pink-800 transition-colors"
              >
                {isLoginMode 
                  ? '¿No tienes cuenta? Crear una nueva' 
                  : '¿Ya tienes cuenta? Iniciar sesión'
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 