'use client';

import { useState, useEffect } from 'react';
import { X, Package, Save, Loader2, Upload, AlertCircle } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import ImagePreview from './ImagePreview';
import DragAndDropZone from './DragAndDropZone';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

interface ProductType {
  id: number;
  name: string;
  category: string;
}

export default function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    stock_total: '',
    product_type_id: '',
    image_url: '',
    status: 'active'
  });

  // Estados para las opciones
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Hook para manejo de imágenes
  const {
    images: selectedImages,
    addImages,
    removeImage,
    clearImages,
    totalSize,
    errors: imageErrors
  } = useImageUpload({
    maxFiles: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  });

  // Cargar tipos de productos y categorías al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadProductTypes();
    }
  }, [isOpen]);

  const loadProductTypes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/products/types`);
      if (response.ok) {
        const data = await response.json();
        setProductTypes(data.data || []);
        
        // Extraer categorías únicas
        const uniqueCategories = [...new Set(data.data?.map((pt: ProductType) => pt.category) || [])] as string[];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error cargando tipos de productos:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar la selección de archivos
  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      addImages(files);
    }
  };

  // Función para limpiar el formulario
  const clearForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost_price: '',
      stock_total: '',
      product_type_id: '',
      image_url: '',
      status: 'active'
    });
    clearImages();
    setError('');
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // Validaciones básicas
    if (!formData.name.trim()) {
      setError('El nombre del producto es requerido');
      setLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('El precio debe ser mayor a 0');
      setLoading(false);
      return;
    }

    if (!formData.product_type_id) {
      setError('Debe seleccionar un tipo de producto');
      setLoading(false);
      return;
    }

    // 1. PRIMERO subir las imágenes a Cloudinary
    let imageUrls: string[] = [];
    if (selectedImages.length > 0) {
      const formDataImages = new FormData();
      selectedImages.forEach((image, index) => {
        formDataImages.append('images', image.file);
      });

      console.log('Subiendo imágenes a Cloudinary...');
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formDataImages
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        console.log('Imágenes subidas exitosamente:', uploadResult);
        imageUrls = uploadResult.data.map((file: any) => file.path);
      } else {
        const errorData = await uploadResponse.json();
        console.error('Error subiendo imágenes:', errorData);
        setError(`Error subiendo imágenes: ${errorData.message || 'Error desconocido'}`);
        setLoading(false);
        return;
      }
    }

    // 2. LUEGO crear el producto con las URLs de las imágenes
    // Para múltiples imágenes, usar solo la primera o manejar como array
    const finalImageUrl = imageUrls.length > 0 ? imageUrls[0] : formData.image_url || null;

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      cost_price: parseFloat(formData.cost_price) || 0,
      stock_total: parseInt(formData.stock_total) || 0,
      product_type_id: parseInt(formData.product_type_id),
      // Solo incluir image_url si se proporcionó una URL válida o hay imágenes subidas
      ...(finalImageUrl && finalImageUrl.trim() !== '' && { image_url: finalImageUrl.trim() })
    };

    console.log('Datos a enviar al backend:', productData);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Producto creado exitosamente:', result);
      
      if (imageUrls.length > 0) {
        console.log('✅ Imágenes subidas y producto creado exitosamente');
        console.log('📁 URLs de las imágenes:', imageUrls);
      }
      
      // Limpiar formulario
      clearForm();
      
      // Cerrar modal y notificar
      onProductAdded();
      onClose();
      
      // Mostrar mensaje de éxito (opcional)
      alert('✅ Producto creado exitosamente');
      
    } else {
      const errorData = await response.json();
      console.error('Error del backend:', errorData);
      setError(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error creando producto:', error);
    setError('Error de conexión');
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Agregar Nuevo Producto</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Nombre y Tipo de Producto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Labial Mate Premium"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Producto *
                </label>
                <select
                  name="product_type_id"
                  value={formData.product_type_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  {productTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el producto..."
              />
            </div>

            {/* Precio, Costo y Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Venta *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Inversión *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Precio que pagaste por el producto
                </p>
                {/* Indicador de ganancia */}
                {formData.price && formData.cost_price && parseFloat(formData.price) > parseFloat(formData.cost_price) && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs text-green-700">
                      💰 Ganancia esperada: ${(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)} 
                      ({((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price) * 100).toFixed(1)}%)
                    </p>
                  </div>
                )}
                {formData.price && formData.cost_price && parseFloat(formData.price) <= parseFloat(formData.cost_price) && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-700">
                      ⚠️ El precio de venta debe ser mayor al de inversión
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  name="stock_total"
                  value={formData.stock_total}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Imágenes del Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes del Producto
              </label>
              <div className="space-y-4">
                {/* Vista previa de imágenes */}
                <ImagePreview 
                  images={selectedImages}
                  onRemove={removeImage}
                  maxImages={10}
                  showFileInfo={true}
                />
                
                {/* Errores de imágenes */}
                {imageErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-red-700">Errores en las imágenes:</p>
                        <ul className="text-xs text-red-600 space-y-1">
                          {imageErrors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Selector de archivos múltiples */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Seleccionar imágenes (múltiples)
                    </label>
                    <DragAndDropZone
                      onFilesSelected={(files) => {
                        // Convertir File[] a FileList para compatibilidad con el hook
                        const dataTransfer = new DataTransfer();
                        files.forEach(file => dataTransfer.items.add(file));
                        addImages(dataTransfer.files);
                      }}
                      accept="image/*"
                      multiple={true}
                      maxFiles={10}
                      disabled={loading}
                    />
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {selectedImages.length > 0 && (
                        <p className="text-blue-600 font-medium">
                          • {selectedImages.length} imagen(es) seleccionada(s) • {(totalSize / (1024 * 1024)).toFixed(2)} MB total
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      O usar URL (opcional)
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Campo opcional - puedes dejarlo vacío
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Crear Producto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 