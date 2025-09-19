require('dotenv').config();

// Configuración de WhatsApp
const whatsappConfig = {
  // Número principal de WhatsApp (formato internacional sin +)
  primaryNumber: process.env.WHATSAPP_NUMBER || '8124307494',
  
  // Número secundario de WhatsApp para Santa María y Mall Pablo Livas
  secondaryNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_2 || '8124307494',
  
  // Nombre del negocio
  businessName: process.env.WHATSAPP_BUSINESS_NAME || 'Cosméticos Store',
  
  // URL base de WhatsApp
  baseUrl: 'https://wa.me',
  
  // Función para obtener el número de WhatsApp según el punto de entrega
  getNumberForLocation: (locationWhatsappType) => {
    switch (locationWhatsappType) {
      case 'SECONDARY':
        return whatsappConfig.secondaryNumber;
      case 'DEFAULT':
      default:
        return whatsappConfig.primaryNumber;
    }
  },
  
  // Función para generar enlace de WhatsApp con número específico
  generateLink: (message, locationWhatsappType = 'DEFAULT') => {
    const number = whatsappConfig.getNumberForLocation(locationWhatsappType);
    const encodedMessage = encodeURIComponent(message);
    return `${whatsappConfig.baseUrl}/${number}?text=${encodedMessage}`;
  },
  
  // Función para generar enlace con número específico
  generateLinkWithNumber: (message, number) => {
    const encodedMessage = encodeURIComponent(message);
    return `${whatsappConfig.baseUrl}/${number}?text=${encodedMessage}`;
  },
  
  // Función para validar número de WhatsApp
  validateNumber: (number) => {
    // Validar que sea un número válido (solo dígitos, 7-15 caracteres)
    const phoneRegex = /^\d{7,15}$/;
    return phoneRegex.test(number);
  },
  
  // Función para formatear número de teléfono del cliente
  formatCustomerPhone: (phone) => {
    // Limpiar número del cliente
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Agregar código de país si no lo tiene (asumiendo México +52)
    return cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;
  }
};

module.exports = whatsappConfig; 