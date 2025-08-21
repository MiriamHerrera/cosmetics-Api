const { query } = require('../config/database');

// Obtener todos los productos públicos (solo aprobados)
const getPublicProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q = '',
      category_id,
      product_type_id,
      min_price,
      max_price,
      in_stock,
      sort_by = 'name',
      sort_order = 'asc'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Construir WHERE clause dinámicamente - SOLO PRODUCTOS APROBADOS
    let whereClause = 'WHERE p.status = "active" AND p.is_approved = 1';
    const whereParams = [];
    
    if (q) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      whereParams.push(`%${q}%`, `%${q}%`);
    }
    
    if (category_id) {
      whereClause += ' AND pt.category_id = ?';
      whereParams.push(category_id);
    }
    
    if (product_type_id) {
      whereClause += ' AND p.product_type_id = ?';
      whereParams.push(product_type_id);
    }
    
    if (min_price) {
      whereClause += ' AND p.price >= ?';
      whereParams.push(min_price);
    }
    
    if (max_price) {
      whereClause += ' AND p.price <= ?';
      whereParams.push(max_price);
    }
    
    if (in_stock === 'true') {
      whereClause += ' AND p.stock_total > 0';
    }

    // Validar ordenamiento
    const allowedSortFields = ['name', 'price', 'stock_total', 'created_at'];
    const allowedSortOrders = ['asc', 'desc'];
    
    if (!allowedSortFields.includes(sort_by)) sort_by = 'name';
    if (!allowedSortOrders.includes(sort_order)) sort_order = 'asc';

    // Query principal - SOLO PRODUCTOS APROBADOS
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock_total,
        p.status,
        p.created_at,
        p.updated_at,
        pt.id as product_type_id,
        pt.name as product_type_name,
        c.id as category_id,
        c.name as category_name
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      ${whereClause}
      ORDER BY p.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;

    const products = await query(sql, [...whereParams, parseInt(limit), offset]);

    // Contar total de productos para paginación - SOLO PRODUCTOS APROBADOS
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      ${whereClause}
    `;
    
    const countResult = await query(countSql, whereParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener producto público por ID (solo aprobados)
const getPublicProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const products = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock_total,
        p.status,
        p.created_at,
        p.updated_at,
        pt.id as product_type_id,
        pt.name as product_type_name,
        c.id as category_id,
        c.name as category_name
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE p.id = ? AND p.status = 'active' AND p.is_approved = 1
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o no está disponible'
      });
    }

    res.json({
      success: true,
      data: products[0]
    });

  } catch (error) {
    console.error('Error obteniendo producto público:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar productos públicos (solo aprobados)
const searchPublicProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Término de búsqueda debe tener al menos 2 caracteres'
      });
    }

    const products = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock_total,
        pt.name as product_type_name,
        c.name as category_name
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE p.status = 'active' AND p.is_approved = 1
        AND (p.name LIKE ? OR p.description LIKE ? OR pt.name LIKE ? OR c.name LIKE ?)
      ORDER BY p.name
      LIMIT 20
    `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error buscando productos públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Filtrar productos públicos por categoría (solo aprobados)
const getPublicProductsByCategory = async (req, res) => {
  try {
    const { category_name } = req.params;

    if (!category_name) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de categoría es requerido'
      });
    }

    const products = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock_total,
        pt.name as product_type_name,
        c.name as category_name
      FROM products p
      INNER JOIN product_types pt ON p.product_type_id = pt.id
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE p.status = 'active' AND p.is_approved = 1 AND c.name = ?
      ORDER BY p.name
    `, [category_name]);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error filtrando productos públicos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener categorías disponibles (solo para productos aprobados)
const getPublicCategories = async (req, res) => {
  try {
    const categories = await query(`
      SELECT DISTINCT
        c.id,
        c.name,
        c.description
      FROM categories c
      INNER JOIN product_types pt ON c.id = pt.category_id
      INNER JOIN products p ON pt.id = p.product_type_id
      WHERE p.status = 'active' AND p.is_approved = 1
      ORDER BY c.name
    `);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error obteniendo categorías públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tipos de productos disponibles (solo para productos aprobados)
const getPublicProductTypes = async (req, res) => {
  try {
    const productTypes = await query(`
      SELECT DISTINCT
        pt.id,
        pt.name,
        pt.category_id,
        c.name as category_name
      FROM product_types pt
      INNER JOIN categories c ON pt.category_id = c.id
      INNER JOIN products p ON pt.id = p.product_type_id
      WHERE p.status = 'active' AND p.is_approved = 1
      ORDER BY pt.name
    `);

    res.json({
      success: true,
      data: productTypes
    });

  } catch (error) {
    console.error('Error obteniendo tipos de productos públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getPublicProducts,
  getPublicProductById,
  searchPublicProducts,
  getPublicProductsByCategory,
  getPublicCategories,
  getPublicProductTypes
}; 