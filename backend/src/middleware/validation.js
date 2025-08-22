const Joi = require('joi');

// Función para validar esquemas
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

// Esquemas de validación para diferentes entidades

// Validación de registro de usuario
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[\d\s\-\(\)]+$/).min(10).max(20).required(),
  email: Joi.string().email().max(120).optional(),
  password: Joi.string().min(6).max(255).required(),
  role: Joi.string().valid('client', 'admin').default('client')
});

// Validación de login
const loginSchema = Joi.object({
  phone: Joi.string().required(),
  password: Joi.string().required()
});

// Validación de producto
const productSchema = Joi.object({
  product_type_id: Joi.number().integer().positive().required(),
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  price: Joi.number().positive().precision(2).required(),
  image_url: Joi.string().uri().max(255).optional(),
  stock_total: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid('active', 'inactive').default('active')
});

// Validación de carrito
const cartItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required()
});

// Validación de carrito para invitados
const guestCartItemSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  sessionId: Joi.string().optional()
});

// Validación de apartado
const reservationSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required()
});

// Validación de encuesta
const surveySchema = Joi.object({
  question: Joi.string().min(10).max(255).required(),
  options: Joi.array().items(Joi.string().min(2).max(200)).min(2).max(10).required()
});

// Validación de voto
const voteSchema = Joi.object({
  survey_id: Joi.number().integer().positive().required(),
  option_id: Joi.number().integer().positive().required()
});

// Validación de inventario programado
const inventoryScheduleSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  arrival_date: Joi.date().greater('now').required(),
  quantity: Joi.number().integer().positive().required()
});

// Validación de actualización de perfil
const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[\d\s\-\(\)]+$/).min(10).max(20).optional(),
  email: Joi.string().email().max(120).optional()
});

// Validación de búsqueda y filtros
const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).optional(),
  category_id: Joi.number().integer().positive().optional(),
  product_type_id: Joi.number().integer().positive().optional(),
  min_price: Joi.number().positive().precision(2).optional(),
  max_price: Joi.number().positive().precision(2).optional(),
  in_stock: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  productSchema,
  cartItemSchema,
  guestCartItemSchema,
  reservationSchema,
  surveySchema,
  voteSchema,
  inventoryScheduleSchema,
  profileUpdateSchema,
  searchSchema
}; 