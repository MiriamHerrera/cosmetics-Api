require('dotenv').config();

// Configuración de WhatsApp
const whatsappConfig = {
  // Número de WhatsApp (formato internacional sin +)
  number: process.env.WHATSAPP_NUMBER || '8124307494',
  
  // Nombre del negocio
  businessName: process.env.WHATSAPP_BUSINESS_NAME || 'Cosméticos Store',
  
  // URL base de WhatsApp
  baseUrl: 'https://wa.me',
  
  // Función para generar enlace de WhatsApp
  generateLink: (message) => {
    const encodedMessage = encodeURIComponent(message);
    return `${whatsappConfig.baseUrl}/${whatsappConfig.number}?text=${encodedMessage}`;
  },
  
  // Función para validar número de WhatsApp
  validateNumber: (number) => {
    // Validar que sea un número válido (solo dígitos, 7-15 caracteres)
    const phoneRegex = /^\d{7,15}$/;
    return phoneRegex.test(number);
  }
};

module.exports = whatsappConfig; 