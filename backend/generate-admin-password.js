const bcrypt = require('bcryptjs');

const generatePasswordHash = async () => {
  try {
    const password = 'admin123';
    const saltRounds = 12;
    
    console.log('🔐 GENERANDO HASH PARA CONTRASEÑA...');
    console.log('📝 Contraseña original:', password);
    console.log('🧂 Salt rounds:', saltRounds);
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('\n✅ HASH GENERADO EXITOSAMENTE');
    console.log('🔑 Hash generado:', hashedPassword);
    console.log('📏 Longitud del hash:', hashedPassword.length);
    
    // Verificar que el hash funciona
    console.log('\n🔍 VERIFICANDO HASH...');
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('✅ Verificación exitosa:', isValid);
    
    // Generar también con salt rounds diferentes para opciones
    console.log('\n🔄 GENERANDO HASHES ALTERNATIVOS...');
    
    const hash10 = await bcrypt.hash(password, 10);
    const hash8 = await bcrypt.hash(password, 8);
    
    console.log('\n📋 RESUMEN DE HASHES:');
    console.log('🔑 Hash (12 rounds):', hash10);
    console.log('🔑 Hash (10 rounds):', hash10);
    console.log('🔑 Hash (8 rounds):', hash8);
    
    return {
      password,
      hash12: hashedPassword,
      hash10,
      hash8,
      length: hashedPassword.length
    };
    
  } catch (error) {
    console.error('❌ ERROR GENERANDO HASH:', error);
    throw error;
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  generatePasswordHash()
    .then(result => {
      console.log('\n🎉 SCRIPT COMPLETADO EXITOSAMENTE');
      console.log('📋 Hash principal (12 rounds):', result.hash12);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { generatePasswordHash };
