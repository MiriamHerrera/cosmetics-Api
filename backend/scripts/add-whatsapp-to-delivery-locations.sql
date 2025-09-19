-- Script para agregar campo whatsapp_number a delivery_locations
-- Ejecutar este script para habilitar múltiples números de WhatsApp por punto de entrega

-- Agregar columna whatsapp_number a delivery_locations
ALTER TABLE delivery_locations 
ADD COLUMN whatsapp_number VARCHAR(20) DEFAULT NULL COMMENT 'Número de WhatsApp específico para este punto de entrega';

-- Actualizar los puntos de entrega existentes con números por defecto
-- Santa María (ID 3) y Mall Pablo Livas (ID 4) usarán NEXT_PUBLIC_WHATSAPP_NUMBER_2
-- Los demás usarán el número principal

UPDATE delivery_locations 
SET whatsapp_number = 'DEFAULT' 
WHERE id IN (1, 2); -- UANL y Soriana San Roque usan número principal

UPDATE delivery_locations 
SET whatsapp_number = 'SECONDARY' 
WHERE id IN (3, 4); -- Santa María y Mall Pablo Livas usan número secundario

-- Crear índice para optimizar consultas
CREATE INDEX idx_delivery_locations_whatsapp ON delivery_locations(whatsapp_number);

-- Verificar la estructura actualizada
SELECT 
    id, 
    name, 
    address, 
    whatsapp_number,
    is_active 
FROM delivery_locations 
ORDER BY id;
