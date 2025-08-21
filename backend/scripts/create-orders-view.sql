-- Script para crear la vista orders_with_details
-- Esta vista es necesaria para el controlador de órdenes

USE cosmetics_db;

-- Crear la vista si no existe
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
  o.id,
  o.order_number,
  o.customer_type,
  o.user_id,
  o.session_id,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.delivery_location_id,
  dl.name as delivery_location_name,
  o.delivery_date,
  o.delivery_time,
  o.delivery_address,
  o.total_amount,
  o.status,
  o.notes,
  o.admin_notes,
  o.whatsapp_message,
  o.whatsapp_sent_at,
  o.created_at,
  o.updated_at,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_quantity
FROM orders o
INNER JOIN delivery_locations dl ON o.delivery_location_id = dl.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_type, o.user_id, o.session_id, 
         o.customer_name, o.customer_phone, o.customer_email, o.delivery_location_id,
         dl.name, o.delivery_date, o.delivery_time, o.delivery_address, o.total_amount,
         o.status, o.notes, o.admin_notes, o.whatsapp_message, o.whatsapp_sent_at,
         o.created_at, o.updated_at;

-- Verificar que la vista se creó correctamente
SELECT 'Vista orders_with_details creada exitosamente' as status;
DESCRIBE orders_with_details; 