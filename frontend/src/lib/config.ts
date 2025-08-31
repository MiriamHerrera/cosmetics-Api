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
  
  // Si ya es una URL absoluta (http/https), retornarla tal como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] Absolute URL, returning as-is:', imagePath);
    }
    return imagePath;
  }
  
  // Si es una ruta relativa que empieza con /uploads, construir URL completa para Railway
  if (imagePath.startsWith('/uploads')) {
    // Para Railway, usar la URL base de la API directamente
    const baseUrl = config.apiUrl;
    const fullUrl = `${baseUrl}${imagePath}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] Building Railway URL:');
      console.log('  - Base URL:', baseUrl);
      console.log('  - Image path:', imagePath);
      console.log('  - Full URL:', fullUrl);
    }
    
    return fullUrl;
  }
  
  // Si es cualquier otra ruta relativa, asumir que es relativa al dominio actual
  if (imagePath.startsWith('/')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [getImageUrl] Relative path, returning as-is:', imagePath);
    }
    return imagePath;
  }
  
  // Si no empieza con /, agregar / al inicio
  const result = `/${imagePath}`;
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [getImageUrl] Adding slash, returning:', result);
  }
  return result;
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