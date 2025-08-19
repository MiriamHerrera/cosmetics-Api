const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const { query } = require('../config/database');

// Registro de usuario
const register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await query(
      'SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)',
      [phone, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono o email ya está registrado'
      });
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const result = await query(
      'INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, phone, email, hashedPassword, 'client']
    );

    // Generar token
    const token = generateToken({
      id: result.insertId,
      name,
      phone,
      email,
      role: 'client'
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: result.insertId,
          name,
          phone,
          email,
          role: 'client'
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    console.log('🔍 DEBUG LOGIN:', { phone, password: password ? '***' : 'undefined' });

    // Buscar usuario por teléfono
    const users = await query(
      'SELECT id, name, phone, email, password, role FROM users WHERE phone = ?',
      [phone]
    );

    console.log('🔍 Usuarios encontrados:', users.length);
    if (users.length > 0) {
      console.log('🔍 Usuario encontrado:', { 
        id: users[0].id, 
        name: users[0].name, 
        phone: users[0].phone,
        role: users[0].role,
        passwordLength: users[0].password ? users[0].password.length : 0
      });
    }

    if (users.length === 0) {
      console.log('❌ No se encontró usuario con teléfono:', phone);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        debug: { phone, usersFound: 0 }
      });
    }

    const user = users[0];

    // Verificar contraseña
    console.log('🔍 Verificando contraseña...');
    console.log('🔍 Contraseña recibida:', password);
    console.log('🔍 Hash en BD:', user.password);
    console.log('🔍 Longitud del hash en BD:', user.password ? user.password.length : 0);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔍 Contraseña válida:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Contraseña incorrecta para usuario:', phone);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        debug: { phone, userId: user.id, passwordValid: false }
      });
    }

    // Generar token
    console.log('🔍 Generando token para usuario:', user.id);
    const token = generateToken({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role
    });

    console.log('✅ Login exitoso para usuario:', user.id);
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del usuario
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await query(
      'SELECT id, name, phone, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar perfil
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, email } = req.body;

    // Verificar si el teléfono o email ya existe en otro usuario
    if (phone || email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE (phone = ? OR (email = ? AND email IS NOT NULL)) AND id != ?',
        [phone, email, userId]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono o email ya está en uso por otro usuario'
        });
      }
    }

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    updateValues.push(userId);

    await query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Logout (opcional - el frontend puede eliminar el token)
const logout = async (req, res) => {
  try {
    // En una implementación más robusta, podrías invalidar el token
    // Por ahora, solo confirmamos el logout
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  logout
}; 