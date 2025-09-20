const { query } = require('../config/database');

// Obtener todos los productos con filtros y paginación
const getAllProducts = async (req, res) => {
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

    // Validar y convertir parámetros de paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Construir WHERE clause dinámicamente
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

    // Query principal
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.video_url,
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

    const products = await query(sql, [...whereParams, parseInt(limitNum), offset]);

    // Contar total de productos para paginación
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
        page: parseInt(pageNum),
        limit: parseInt(limitNum),
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un número válido
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const products = await query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.video_url,
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
    `, [parseInt(id)]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: products[0]
    });

  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo producto (admin)
const createProduct = async (req, res) => {
  try {
    const {
      product_type_id,
      name,
      description,
      price,
      cost_price,
      image_url,
      video_url,
      stock_total
    } = req.body;

    // Validaciones básicas
    if (!name || !price || !cost_price || !product_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio de venta, precio de inversión y tipo de producto son requeridos'
      });
    }

    if (parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio de venta debe ser mayor a 0'
      });
    }

    if (parseFloat(cost_price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio de inversión debe ser mayor a 0'
      });
    }

    if (parseFloat(price) <= parseFloat(cost_price)) {
      return res.status(400).json({
        success: false,
        message: 'El precio de venta debe ser mayor al precio de inversión para obtener ganancias'
      });
    }

    // Verificar que el tipo de producto existe
    const productTypes = await query(
      'SELECT id FROM product_types WHERE id = ?',
      [product_type_id]
    );

    if (productTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de producto no válido'
      });
    }

    const result = await query(`
      INSERT INTO products (product_type_id, name, description, price, cost_price, image_url, video_url, stock_total, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `, [product_type_id, name, description, price, cost_price, image_url, video_url || null, stock_total || 0]);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        id: result.insertId,
        product_type_id,
        name,
        description,
        price,
        cost_price,
        image_url,
        stock_total: stock_total || 0,
        is_approved: 0
      }
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar producto (admin)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que el producto existe
    const existingProducts = await query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Construir query de actualización dinámicamente
    const allowedFields = ['name', 'description', 'price', 'cost_price', 'image_url', 'video_url', 'stock_total', 'status'];
    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos válidos para actualizar'
      });
    }

    updateValues.push(id);

    await query(`
      UPDATE products 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, updateValues);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar producto (admin) - soft delete
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const existingProducts = await query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Soft delete - cambiar status a inactive
    await query(
      'UPDATE products SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todas las categorías
const getCategories = async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY name');
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todos los tipos de productos
const getAllProductTypes = async (req, res) => {
  try {
    const productTypes = await query(`
      SELECT pt.id, pt.name, c.name as category
      FROM product_types pt
      INNER JOIN categories c ON pt.category_id = c.id
      ORDER BY c.name, pt.name
    `);

    res.json({
      success: true,
      data: productTypes
    });

  } catch (error) {
    console.error('Error obteniendo tipos de producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tipos de producto por categoría
const getProductTypesByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    const productTypes = await query(`
      SELECT pt.*, c.name as category_name
      FROM product_types pt
      INNER JOIN categories c ON pt.category_id = c.id
      WHERE pt.category_id = ?
      ORDER BY pt.name
    `, [category_id]);

    res.json({
      success: true,
      data: productTypes
    });

  } catch (error) {
    console.error('Error obteniendo tipos de producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Filtrar productos por categoría
const getProductsByCategory = async (req, res) => {
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
    console.error('Error filtrando productos por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar productos por texto
const searchProducts = async (req, res) => {
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
    console.error('Error buscando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener productos pendientes de aprobación (admin)
const getPendingProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q = '',
      category_id,
      product_type_id,
      min_price,
      max_price,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    // Construir WHERE clause dinámicamente - SOLO PRODUCTOS PENDIENTES
    let whereClause = 'WHERE p.status = "active" AND p.is_approved = 0';
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

    // Validar ordenamiento
    const allowedSortFields = ['name', 'price', 'stock_total', 'created_at'];
    const allowedSortOrders = ['asc', 'desc'];
    
    if (!allowedSortFields.includes(sort_by)) sort_by = 'created_at';
    if (!allowedSortOrders.includes(sort_order)) sort_order = 'desc';

    // Query principal
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.cost_price,
        p.image_url,
        p.stock_total,
        p.status,
        p.is_approved,
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

    const products = await query(sql, [...whereParams, parseInt(limitNum), offset]);

    // Contar total de productos para paginación
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
        page: parseInt(pageNum),
        limit: parseInt(limitNum),
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error obteniendo productos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Aprobar producto (admin)
const approveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el producto existe y está pendiente
    const existingProducts = await query(
      'SELECT id, is_approved FROM products WHERE id = ? AND status = "active"',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (existingProducts[0].is_approved === 1) {
      return res.status(400).json({
        success: false,
        message: 'El producto ya está aprobado'
      });
    }

    // Aprobar el producto
    await query(
      'UPDATE products SET is_approved = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Producto aprobado exitosamente'
    });

  } catch (error) {
    console.error('Error aprobando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Rechazar producto (admin) - soft delete
const rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const existingProducts = await query(
      'SELECT id FROM products WHERE id = ? AND status = "active"',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Rechazar el producto - cambiar status a inactive
    await query(
      'UPDATE products SET status = "inactive", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Producto rechazado exitosamente'
    });

  } catch (error) {
    console.error('Error rechazando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getAllProductTypes,
  getProductTypesByCategory,
  getProductsByCategory,
  searchProducts,
  getPendingProducts,
  approveProduct,
  rejectProduct
}; 