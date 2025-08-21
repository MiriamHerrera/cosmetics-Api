-- Script para probar el procedimiento GenerateOrderNumber
-- Ejecutar este script en tu base de datos MariaDB

USE cosmetics_db;

-- Verificar que el procedimiento existe
SELECT 'Verificando procedimiento GenerateOrderNumber...' as info;
SELECT 
  routine_name, 
  routine_type, 
  routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'cosmetics_db' AND routine_name = 'GenerateOrderNumber';

-- Probar el procedimiento
SELECT 'Probando procedimiento GenerateOrderNumber...' as info;

-- Crear una variable para almacenar el resultado
SET @orderNumber = '';

-- Llamar al procedimiento
CALL GenerateOrderNumber(@orderNumber);

-- Mostrar el resultado
SELECT @orderNumber as generated_order_number;

-- Verificar que se generó un número válido
SELECT 
  CASE 
    WHEN @orderNumber LIKE 'ORD%' THEN 'Procedimiento funcionando correctamente'
    ELSE 'Error en el procedimiento'
  END as test_result;

-- Generar varios números para verificar que son únicos
SELECT 'Generando múltiples números de orden...' as info;

SET @orderNumber1 = '';
SET @orderNumber2 = '';
SET @orderNumber3 = '';

CALL GenerateOrderNumber(@orderNumber1);
CALL GenerateOrderNumber(@orderNumber2);
CALL GenerateOrderNumber(@orderNumber3);

SELECT 
  @orderNumber1 as order_1,
  @orderNumber2 as order_2,
  @orderNumber3 as order_3;

-- Verificar que son diferentes
SELECT 
  CASE 
    WHEN @orderNumber1 != @orderNumber2 AND @orderNumber2 != @orderNumber3 AND @orderNumber1 != @orderNumber3
    THEN 'Todos los números son únicos: OK'
    ELSE 'Error: números duplicados'
  END as uniqueness_test; 