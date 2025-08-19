const bcrypt = require('bcryptjs');

async function debugLogin() {
  try {
    console.log('🔍 DEBUG COMPLETO DEL LOGIN');
    console.log('============================');
    
    // 1. Datos de entrada
    const phone = '+1234567890';
    const password = 'admin123';
    
    console.log('\n1️⃣ DATOS DE ENTRADA:');
    console.log('Teléfono:', phone);
    console.log('Contraseña:', password);
    console.log('Tipo de teléfono:', typeof phone);
    console.log('Tipo de contraseña:', typeof password);
    
    // 2. Hash existente en la base de datos
    const existingHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3ZxQQxq6re';
    
    console.log('\n2️⃣ HASH EXISTENTE:');
    console.log('Hash:', existingHash);
    console.log('Longitud:', existingHash.length);
    console.log('Tipo:', typeof existingHash);
    
    // 3. Verificar si el hash es válido
    console.log('\n3️⃣ VERIFICANDO HASH:');
    const isValid = await bcrypt.compare(password, existingHash);
    console.log('Resultado de bcrypt.compare:', isValid);
    
    // 4. Generar nuevo hash para comparar
    console.log('\n4️⃣ GENERANDO NUEVO HASH:');
    const saltRounds = 12;
    const newHash = await bcrypt.hash(password, saltRounds);
    console.log('Nuevo hash:', newHash);
    console.log('Longitud del nuevo hash:', newHash.length);
    
    // 5. Verificar que el nuevo hash funciona
    console.log('\n5️⃣ VERIFICANDO NUEVO HASH:');
    const newHashValid = await bcrypt.compare(password, newHash);
    console.log('Nuevo hash válido:', newHashValid);
    
    // 6. Comparar hashes
    console.log('\n6️⃣ COMPARACIÓN:');
    console.log('Hash existente funciona:', isValid);
    console.log('Hash nuevo funciona:', newHashValid);
    console.log('¿Son iguales?', existingHash === newHash);
    
    // 7. Recomendación
    console.log('\n7️⃣ RECOMENDACIÓN:');
    if (!isValid) {
      console.log('❌ El hash existente NO funciona');
      console.log('✅ Usar el nuevo hash generado');
      console.log('\n📝 SQL para actualizar:');
      console.log(`UPDATE users SET password = '${newHash}' WHERE phone = '+1234567890' AND role = 'admin';`);
    } else {
      console.log('✅ El hash existente funciona');
      console.log('🔍 El problema debe estar en otro lugar');
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

debugLogin(); 