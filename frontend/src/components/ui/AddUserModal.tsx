'use client';

import { useState, useEffect, memo, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

interface UserFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: 'client' | 'admin';
}

// Componente InputField memoizado para evitar re-renders
const InputField = memo(({ 
  label, 
  field, 
  type = 'text', 
  placeholder, 
  required = false,
  icon: Icon,
  autoComplete,
  inputRef,
  value,
  onChange,
  validationError,
  showPassword,
  onTogglePassword
}: {
  label: string;
  field: keyof UserFormData;
  type?: string;
  placeholder: string;
  required?: boolean;
  icon?: any;
  autoComplete?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  value: string;
  onChange: (field: keyof UserFormData, value: string) => void;
  validationError?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      )}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`
          w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
          ${Icon ? 'pl-10' : ''}
          ${validationError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
        `}
      />
      {field === 'password' && onTogglePassword && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
    {validationError && (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        {validationError}
      </div>
    )}
  </div>
));

const AddUserModal = memo(({ isOpen, onClose, onUserAdded }: AddUserModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'client'
  });
  const [validationErrors, setValidationErrors] = useState<Partial<UserFormData>>({});
  
  // Refs para mantener el foco
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Limpiar estado cuando se abra el modal - optimizado para evitar re-renders
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        password: '',
        role: 'client'
      });
      setValidationErrors({});
      setError(null);
      
      // Enfocar el primer input después de un pequeño delay
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]); // Solo depende de isOpen, no de las funciones

  // Debug: Log cuando cambia isOpen - solo en desarrollo y cuando cambie realmente
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AddUserModal render - isOpen:', isOpen, 'formData:', formData);
    }
  }, [isOpen, formData]);

  // Validación del formulario - memoizada
  const validateForm = useCallback((): boolean => {
    const errors: Partial<UserFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es requerido';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone.trim())) {
      errors.phone = 'Formato de teléfono inválido';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Formato de email inválido';
    }

    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Manejar cambios en el formulario - optimizado para evitar re-renders
  const handleInputChange = useCallback((field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [validationErrors]);

  // Enviar formulario - memoizado
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Usuario creado exitosamente
        onUserAdded();
        onClose();
      } else {
        // Error del servidor
        setError(data.message || 'Error creando usuario');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onUserAdded, onClose]);

  // Cerrar modal - memoizado
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Toggle password visibility - memoizado
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Memoizar el rol change handler
  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange('role', e.target.value);
  }, [handleInputChange]);

  // Memoizar el formulario completo para evitar re-renders
  const formContent = useMemo(() => (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Nombre */}
      <InputField
        label="Nombre completo"
        field="name"
        placeholder="Ingresa el nombre completo"
        required
        icon={UserPlus}
        autoComplete="name"
        inputRef={nameInputRef as React.RefObject<HTMLInputElement>}
        value={formData.name}
        onChange={handleInputChange}
        validationError={validationErrors.name}
      />

      {/* Teléfono */}
      <InputField
        label="Teléfono"
        field="phone"
        placeholder="+1234567890"
        required
        autoComplete="tel"
        value={formData.phone}
        onChange={handleInputChange}
        validationError={validationErrors.phone}
      />

      {/* Email */}
      <InputField
        label="Email (opcional)"
        field="email"
        type="email"
        placeholder="usuario@ejemplo.com"
        autoComplete="email"
        value={formData.email}
        onChange={handleInputChange}
        validationError={validationErrors.email}
      />

      {/* Contraseña */}
      <InputField
        label="Contraseña"
        field="password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Mínimo 6 caracteres"
        required
        autoComplete="new-password"
        value={formData.password}
        onChange={handleInputChange}
        validationError={validationErrors.password}
        showPassword={showPassword}
        onTogglePassword={togglePasswordVisibility}
      />

      {/* Rol */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Rol del usuario <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.role}
          onChange={handleRoleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="client">Cliente</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      {/* Error general */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handleClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Crear Usuario
            </>
          )}
        </button>
      </div>
    </form>
  ), [formData, validationErrors, error, loading, showPassword, handleSubmit, handleInputChange, handleClose, togglePasswordVisibility, handleRoleChange]);

  if (!isOpen) return null;

  // Renderizar usando Portal para evitar re-renders del padre
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay de fondo oscuro */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Agregar Usuario</h2>
                <p className="text-sm text-gray-600">Crear nuevo usuario en el sistema</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario memoizado */}
          {formContent}
        </div>
      </div>
    </div>,
    document.body // Renderizar directamente en el body, fuera del AdminPanel
  );
});

export default AddUserModal; 