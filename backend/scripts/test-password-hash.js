const bcrypt = require('bcryptjs');

async function testExistingHash() {
  try {
    const password = 'admin123';
    const existingHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re';
    
    console.log('🔍 Probando hash existente...');
    console.log('Contraseña:', password);
    console.log('Hash existente:', existingHash);
    console.log('Longitud del hash:', existingHash.length);
    
    // Probar si el hash existente funciona
    const isValid = await bcrypt.compare(password, existingHash);
    console.log('🔍 Hash existente válido:', isValid ? '✅ SÍ' : '❌ NO');
    
    if (!isValid) {
      console.log('\n❌ El hash existente NO funciona. Generando nuevo hash...');
      
      // Generar nuevo hash
      const saltRounds = 12;
      const newHash = await bcrypt.hash(password, saltRounds);
      
      console.log('✅ Nuevo hash generado:');
      console.log('Hash:', newHash);
      console.log('Longitud:', newHash.length);
      
      // Verificar que el nuevo hash funciona
      const newHashValid = await bcrypt.compare(password, newHash);
      console.log('🔍 Nuevo hash válido:', newHashValid ? '✅ SÍ' : '❌ NO');
      
      // SQL para actualizar
      console.log('\n📝 SQL para actualizar la base de datos:');
      console.log(`UPDATE users SET password = '${newHash}' WHERE phone = '+1234567890' AND role = 'admin';`);
    } else {
      console.log('✅ El hash existente funciona correctamente');
      console.log('El problema debe estar en otro lugar');
    }
    
  } catch (error) {
    console.error('❌ Error probando hash:', error);
  }
}

testExistingHash(); 