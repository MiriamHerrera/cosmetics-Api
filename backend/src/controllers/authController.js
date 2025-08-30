const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const { query } = require('../config/database');

// Registro de usuario
const register = async (req, res) => {
  try {
    const { name, phone, email, password, role = 'client' } = req.body;
    
    // Limpiar el teléfono: eliminar espacios, guiones y paréntesis, mantener solo dígitos
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    console.log('🔍 DEBUG REGISTER:', { 
      name, 
      originalPhone: phone, 
      cleanPhone, 
      email, 
      role, 
      passwordLength: password ? password.length : 0 
    });

    // Verificar si el usuario ya existe (usando el teléfono limpio)
    const existingUser = await query(
      'SELECT id FROM users WHERE phone = ? OR (email = ? AND email IS NOT NULL)',
      [cleanPhone, email || null]
    );

    if (existingUser.length > 0) {
      console.log('❌ Usuario ya existe:', { phone, email });
      return res.status(400).json({
        success: false,
        message: 'El teléfono o email ya está registrado'
      });
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('✅ Creando usuario con rol:', role);

    // Crear usuario
    const result = await query(
      'INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, cleanPhone, email || null, hashedPassword, role]
    );

    // Generar token
    const token = generateToken({
      id: result.insertId,
      name,
      phone,
      email: email || null,
      role
    });

    console.log('✅ Usuario creado exitosamente:', { id: result.insertId, role });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
              data: {
          user: {
            id: result.insertId,
            name,
            phone: cleanPhone,
            email: email || null,
            role
          },
          token
        }
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    console.error('   Stack trace:', error.stack);
    console.error('   Error code:', error.code);
    console.error('   SQL Message:', error.sqlMessage);
    console.error('   SQL State:', error.sqlState);
    console.error('   Error Number:', error.errno);
    
    // Log adicional para debugging
    console.error('   Request body:', req.body);
    console.error('   Clean phone:', req.body.phone ? req.body.phone.replace(/[\s\-\(\)]/g, '') : 'undefined');
    
    // Manejar errores específicos de restricciones únicas
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage && error.sqlMessage.includes('phone')) {
        return res.status(400).json({
          success: false,
          message: 'El teléfono ya está registrado en el sistema'
        });
      }
      if (error.sqlMessage && error.sqlMessage.includes('email')) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado en el sistema'
        });
      }
      if (error.sqlMessage && error.sqlMessage.includes('username')) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con estos datos'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    console.log('🔍 INICIANDO PROCESO DE LOGIN...');
    console.log('📱 Request body recibido:', req.body);
    
    const { phone, password } = req.body;
    
    // Validar que se proporcionen los campos requeridos
    if (!phone || !password) {
      console.log('❌ Campos faltantes:', { phone: !!phone, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Teléfono y contraseña son requeridos'
      });
    }
    
    // Limpiar el teléfono: eliminar espacios, guiones y paréntesis, mantener solo dígitos
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    console.log('🔍 DEBUG LOGIN:', { 
      originalPhone: phone, 
      cleanPhone, 
      password: password ? '***' : 'undefined' 
    });

    console.log('🔍 CONECTANDO A BASE DE DATOS...');
    // Buscar usuario por teléfono (usando el teléfono limpio)
    const users = await query(
      'SELECT id, name, phone, email, password, role FROM users WHERE phone = ?',
      [cleanPhone]
    );

    console.log('🔍 CONSULTA COMPLETADA');
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
    console.log('🔍 VERIFICANDO CONTRASEÑA...');
    console.log('🔍 Contraseña recibida:', password);
    console.log('🔍 Hash en BD:', user.password);
    console.log('🔍 Longitud del hash en BD:', user.password ? user.password.length : 0);
    
    if (!user.password) {
      console.log('❌ Usuario no tiene contraseña hash');
      return res.status(500).json({
        success: false,
        message: 'Error en la configuración del usuario'
      });
    }
    
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
    console.log('🔍 GENERANDO TOKEN...');
    const token = generateToken({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role
    });

    console.log('✅ LOGIN EXITOSO');
    console.log('✅ Usuario autenticado:', user.id);
    console.log('✅ Token generado:', token ? 'SÍ' : 'NO');
    
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
    console.error('   Stack trace:', error.stack);
    console.error('   Error code:', error.code);
    console.error('   SQL Message:', error.sqlMessage);
    console.error('   SQL State:', error.sqlState);
    console.error('   Error Number:', error.errno);
    console.error('   Request body:', req.body);
    
    // En desarrollo, mostrar más detalles
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message,
        stack: error.stack,
        details: {
          code: error.code,
          sqlMessage: error.sqlMessage,
          sqlState: error.sqlState,
          errno: error.errno
        }
      });
    } else {
      // En producción, solo mostrar mensaje genérico pero log completo
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        errorId: Date.now() // Para tracking en logs
      });
    }
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

    // Limpiar el teléfono si se proporciona
    let cleanPhone = phone;
    if (phone) {
      cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    }

    // Verificar si el teléfono o email ya existe en otro usuario
    if (phone || email) {
      const existingUser = await query(
        'SELECT id FROM users WHERE (phone = ? OR (email = ? AND email IS NOT NULL)) AND id != ?',
        [cleanPhone, email || null, userId]
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
      updateValues.push(cleanPhone);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email === '' ? null : email);
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