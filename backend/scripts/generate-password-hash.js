const bcrypt = require('bcryptjs');

async function generateHash() {
  try {
    const password = 'admin123';
    const saltRounds = 12;
    
    console.log('🔐 Generando hash para contraseña:', password);
    
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Hash generado correctamente:');
    console.log('Contraseña:', password);
    console.log('Hash:', hash);
    console.log('Longitud del hash:', hash.length);
    
    // Verificar que el hash funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('🔍 Verificación del hash:', isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
    
    // SQL para actualizar
    console.log('\n📝 SQL para actualizar la base de datos:');
    console.log(`UPDATE users SET password = '${hash}' WHERE phone = '+1234567890' AND role = 'admin';`);
    
  } catch (error) {
    console.error('❌ Error generando hash:', error);
  }
}

generateHash(); 