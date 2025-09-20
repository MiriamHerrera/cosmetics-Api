'use client';

import { useState, useEffect } from 'react';
import { X, Package, Save, Loader2, Upload, AlertCircle, Edit } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { getImageUrl } from '@/lib/config';
import ImagePreview from './ImagePreview';
import DragAndDropZone from './DragAndDropZone';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    video_url?: string;
    stock_total: number;
    status: string;
    product_type: string;
    category: string;
    is_approved?: number;
    total_reservations?: number;
    total_carts?: number;
    active_reservations?: number;
    popularity_score?: number;
  } | null;
}

interface ProductType {
  id: number;
  name: string;
  category: string;
}

export default function EditProductModal({ isOpen, onClose, onProductUpdated, product }: EditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_total: '',
    image_url: '',
    video_url: '',
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

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock_total: product.stock_total?.toString() || '',
        image_url: product.image_url || '',
        video_url: product.video_url || '',
        status: product.status || 'active'
      });
      
      // Si hay imagen existente, convertirla a vista previa
      if (product.image_url) {
        // Por ahora solo mostramos la URL existente
        // En el futuro podríamos cargar la imagen real
      }
    }
  }, [isOpen, product]);

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
      stock_total: '',
      image_url: '',
      video_url: '',
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
      if (!formData.name.trim() || !formData.price || !formData.stock_total) {
        setError('Nombre, precio de venta y stock inicial son requeridos');
        setLoading(false);
        return;
      }

      if (parseFloat(formData.price) <= 0) {
        setError('El precio de venta debe ser mayor a 0');
        setLoading(false);
        return;
      }

      if (parseInt(formData.stock_total) < 0) {
        setError('El stock inicial no puede ser negativo');
        setLoading(false);
        return;
      }

      if (!product) {
        setError('No hay producto seleccionado para editar');
        setLoading(false);
        return;
      }

      // 1. PRIMERO subir las imágenes si existen
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

      // 2. LUEGO actualizar el producto con las URLs de las imágenes
      // Guardar TODAS las URLs de las imágenes separadas por comas
      const finalImageUrl = imageUrls.length > 0 ? imageUrls.join(',') : formData.image_url;

      // Preparar datos del producto para actualizar
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock_total: parseInt(formData.stock_total) || 0,
        // Solo incluir image_url si se proporcionó una URL válida o hay imágenes subidas
        ...(finalImageUrl && finalImageUrl.trim() !== '' && { image_url: finalImageUrl.trim() }),
        // Incluir video_url si se proporcionó
        ...(formData.video_url && formData.video_url.trim() !== '' && { video_url: formData.video_url.trim() })
      };

      // Debug: mostrar qué datos se van a enviar
      console.log('Datos a enviar al backend:', productData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Producto actualizado:', result);
        
        if (imageUrls.length > 0) {
          console.log('✅ Imágenes subidas y producto actualizado exitosamente');
          console.log('📁 URLs de las imágenes:', imageUrls);
        }
        
        // Limpiar formulario
        clearForm();
        
        // Cerrar modal y notificar
        onProductUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Error del backend:', errorData);
        setError(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error actualizando producto:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

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
              <Edit className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Editar Producto</h2>
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

            {/* Información del producto */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-800">Editando: {product.name}</h3>
              </div>
              <p className="text-sm text-blue-700">
                ID: {product.id} • Categoría: {product.category}
              </p>
            </div>

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
                  Tipo de Producto
                </label>
                <input
                  type="text"
                  value={product?.product_type || 'No especificado'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  El tipo de producto no se puede editar desde aquí
                </p>
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

            {/* Precio y Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {/* Vista previa de imágenes existentes */}
                {formData.image_url && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Imagen actual:</h4>
                    <div className="flex items-center gap-3">
                      <img 
                        src={getImageUrl(formData.image_url)} 
                        alt="Imagen actual" 
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{formData.image_url}</p>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="text-red-600 hover:text-red-800 text-sm mt-1"
                        >
                          Eliminar imagen actual
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vista previa de nuevas imágenes */}
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
                      Agregar nuevas imágenes
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
                          • {selectedImages.length} nueva(s) imagen(es) seleccionada(s) • {(totalSize / (1024 * 1024)).toFixed(2)} MB total
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

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Video (Opcional)
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://youtube.com/watch?v=..., https://tiktok.com/@..., https://facebook.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Soporta YouTube, TikTok, Facebook y otros enlaces de video
              </p>
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
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Actualizar Producto
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
