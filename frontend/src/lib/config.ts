// Configuración de la aplicación
export const config = {
  // Número de WhatsApp (formato internacional sin +)
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '8124307494',
  
  // Nombre de tu negocio
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Cosméticos Store',
  
  // Configuración del sitio web
  websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://jeniricosmetics.com',
  
  // URL de la API (Railway por defecto, localhost para desarrollo)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api',
  
  // Configuración de mensajes
  messages: {
    orderPrefix: '🛒 *PEDIDO DE COSMÉTICOS*\n\n',
    orderSuffix: '\n\n📱 *Enviado desde la app de Cosméticos*',
    emptyCart: 'Tu carrito está vacío. Agrega algunos productos para continuar.',
    contactInfo: 'Por favor, proporciona tu información de contacto para completar el pedido.'
  }
};

// Función helper para manejar URLs de imágenes de manera consistente
export const getImageUrl = (imagePath: string | null | undefined): string => {
  // Debug logging (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getImageUrl] Input:', imagePath);
  }
  
  // Si no hay imagen, retornar imagen por defecto
  if (!imagePath || imagePath.trim() === '') {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] No image, returning default');
    }
    return '/NoImage.jpg';
  }
  
  // Si la imagen contiene múltiples URLs separadas por comas, tomar la primera
  if (imagePath.includes(',')) {
    const firstImageUrl = imagePath.split(',')[0].trim();
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] Multiple URLs detected, using first:', firstImageUrl);
    }
    // Recursivamente llamar a getImageUrl con la primera URL
    return getImageUrl(firstImageUrl);
  }

  let processedUrl = imagePath;

  // Normalizar URLs absolutas: forzar HTTPS y corregir ruta /api/uploads a /uploads
  if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] Absolute URL detected, normalizing:', processedUrl);
    }
    // Forzar HTTPS
    if (processedUrl.startsWith('http://')) {
      processedUrl = 'https://' + processedUrl.substring(7);
    }
    // Corregir /api/uploads a /uploads si existe
    if (processedUrl.includes('/api/uploads')) {
      processedUrl = processedUrl.replace('/api/uploads', '/uploads');
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] Normalized absolute URL:', processedUrl);
    }
    return processedUrl;
  }
  
  // Si es una ruta relativa que empieza con /uploads, construir URL completa para Railway
  if (processedUrl.startsWith('/uploads')) {
    // Para Railway, usar la URL base sin /api ya que las imágenes están en /uploads
    const baseUrl = config.apiUrl.replace('/api', '');
    const fullUrl = `${baseUrl}${processedUrl}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] Building Railway URL:');
      console.log('  - Original API URL:', config.apiUrl);
      console.log('  - Base URL (without /api):', baseUrl);
      console.log('  - Image path:', processedUrl);
      console.log('  - Full URL:', fullUrl);
    }
    
    return fullUrl;
  }
  
  // Si es cualquier otra ruta relativa, asumir que es relativa al dominio actual
  if (processedUrl.startsWith('/')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] Relative path, returning as-is:', processedUrl);
    }
    return processedUrl;
  }
  
  // Si no empieza con /, agregar / al inicio
  const result = `/${processedUrl}`;
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getImageUrl] Adding slash, returning:', result);
  }
  return result;
};

// Función para obtener todas las URLs de imágenes (útil para galerías)
export const getAllImageUrls = (imagePath: string | null | undefined): string[] => {
  if (!imagePath || imagePath.trim() === '') {
    return [];
  }
  
  // Si contiene múltiples URLs separadas por comas
  if (imagePath.includes(',')) {
    const urls = imagePath.split(',').map(url => url.trim()).filter(url => url);
    
    // Procesar cada URL individualmente
    return urls.map(url => {
      // Si ya es una URL absoluta, retornarla tal como está
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // Si es una ruta relativa, construir URL completa
      if (url.startsWith('/uploads')) {
        const baseUrl = config.apiUrl.replace('/api', '');
        return `${baseUrl}${url}`;
      }
      
      // Si es cualquier otra ruta relativa
      if (url.startsWith('/')) {
        return url;
      }
      
      // Si no empieza con /, agregar / al inicio
      return `/${url}`;
    });
  }
  
  // Si es una sola imagen, retornar array con una URL
  return [getImageUrl(imagePath)];
};

// Función para generar el enlace de WhatsApp
export const generateWhatsAppLink = (message: string): string => {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${config.whatsappNumber}?text=${encodedMessage}`;
};

// Función para generar el mensaje del pedido
export const generateOrderMessage = (cartItems: any[], total: number, customerInfo?: any): string => {
  let message = config.messages.orderPrefix;
  
  // Agregar fecha y hora
  const now = new Date();
  message += `📅 Fecha: ${now.toLocaleDateString('es-ES')}\n`;
  message += `⏰ Hora: ${now.toLocaleTimeString('es-ES')}\n\n`;
  
  // Agregar información del cliente si está disponible
  if (customerInfo) {
    message += `👤 *CLIENTE:*\n`;
    message += `Nombre: ${customerInfo.name}\n`;
    message += `Teléfono: ${customerInfo.phone}\n`;
    if (customerInfo.address) {
      message += `Dirección: ${customerInfo.address}\n`;
    }
    message += '\n';
  }
  
  // Agregar productos
  message += `📋 *PRODUCTOS:*\n`;
  cartItems.forEach((item, index) => {
    message += `${index + 1}. ${item.product.name}`;
    if (item.product.category_name) {
      message += ` (${item.product.category_name})`;
    }
    message += `\n`;
    message += `   Cantidad: ${item.quantity} x $${item.product.price}\n`;
    message += `   Subtotal: $${(item.quantity * item.product.price).toFixed(2)}\n\n`;
  });
  
  // Agregar total
  message += `💰 *TOTAL: $${total.toFixed(2)}*\n\n`;
  
  // Agregar instrucciones
  message += `📝 *INSTRUCCIONES:*\n`;
  message += `• Confirma tu pedido respondiendo "SÍ" o "CONFIRMO"\n`;
  message += `• Si necesitas cambios, indícalos en tu mensaje\n`;
  message += `• Te contactaremos para coordinar la entrega\n\n`;
  
  message += config.messages.orderSuffix;
  
  return message;
}; 