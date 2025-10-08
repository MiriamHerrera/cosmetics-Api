// Sistema de validación de estado de pedidos
// Similar al sistema de construcción de edificios

class OrderStatusValidator {
  
  // Determinar si un pedido está "en construcción" (preparación)
  static isOrderUnderConstruction(order) {
    const constructionStatuses = ['preparing', 'ready'];
    const constructionIndicators = {
      isPreparing: order.status === 'preparing',
      isReady: order.status === 'ready',
      hasItems: order.items && order.items.length > 0,
      hasDeliveryInfo: order.delivery_date && order.delivery_time,
      totalAmount: order.total_amount > 0
    };

    return {
      isUnderConstruction: constructionStatuses.includes(order.status),
      indicators: constructionIndicators,
      constructionStage: this.getConstructionStage(order.status),
      canProceed: this.canProceedToNextStage(order.status)
    };
  }

  // Obtener etapa de construcción del pedido
  static getConstructionStage(status) {
    const stages = {
      'pending': 'planning',
      'confirmed': 'development', 
      'preparing': 'construction',
      'ready': 'finalization',
      'delivered': 'completed',
      'cancelled': 'cancelled'
    };
    return stages[status] || 'unknown';
  }

  // Verificar si puede proceder a la siguiente etapa
  static canProceedToNextStage(currentStatus) {
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };
    return validTransitions[currentStatus] || [];
  }

  // Validar estado completo del pedido
  static validateOrderConstruction(order) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      constructionStatus: this.isOrderUnderConstruction(order)
    };

    // Validaciones específicas
    if (order.status === 'preparing' && !order.items?.length) {
      validation.errors.push('Pedido en preparación sin productos');
      validation.isValid = false;
    }

    if (order.status === 'ready' && !order.delivery_date) {
      validation.errors.push('Pedido listo sin fecha de entrega');
      validation.isValid = false;
    }

    if (order.total_amount <= 0) {
      validation.warnings.push('Pedido sin monto total');
    }

    return validation;
  }
}

module.exports = OrderStatusValidator;

