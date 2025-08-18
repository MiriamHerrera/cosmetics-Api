// backend/src/services/whatsappService.js
class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.recipientPhone = process.env.WHATSAPP_RECIPIENT_PHONE;
    this.apiVersion = 'v18.0'; // ✅ Versión actualizada
  }

  async sendMessage(message) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: this.recipientPhone,
            type: 'text',
            text: { body: message }
          })
        }
      );

      return response.json();
    } catch (error) {
      console.error('Error enviando WhatsApp:', error);
      throw error;
    }
  }
}