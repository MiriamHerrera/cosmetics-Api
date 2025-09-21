# Script para eliminar pedidos a partir del 19 de septiembre de 2025
# y resetear el AUTO_INCREMENT

Write-Host "🔄 Iniciando eliminación de pedidos de prueba..." -ForegroundColor Cyan

# Cargar variables de entorno
if (Test-Path "../.env") {
    Get-Content "../.env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Configuración de la base de datos
$DB_HOST = $env:DB_HOST ?? "localhost"
$DB_USER = $env:DB_USER ?? "root"
$DB_PASSWORD = $env:DB_PASSWORD ?? ""
$DB_NAME = $env:DB_NAME ?? "cosmetics_db"
$DB_PORT = $env:DB_PORT ?? "3306"

Write-Host "📊 Configuración de BD:" -ForegroundColor Yellow
Write-Host "   Host: $DB_HOST" -ForegroundColor Gray
Write-Host "   Database: $DB_NAME" -ForegroundColor Gray
Write-Host "   User: $DB_USER" -ForegroundColor Gray

try {
    # 1. Conectar a la base de datos
    Write-Host "`n🔄 Conectando a la base de datos..." -ForegroundColor Cyan
    
    $connectionString = "Server=$DB_HOST;Port=$DB_PORT;Database=$DB_NAME;Uid=$DB_USER;Pwd=$DB_PASSWORD;"
    $connection = New-Object MySql.Data.MySqlClient.MySqlConnection($connectionString)
    $connection.Open()
    
    Write-Host "✅ Conectado a la base de datos" -ForegroundColor Green

    # 2. Analizar pedidos a eliminar
    Write-Host "`n📊 Analizando pedidos a partir del 19 de septiembre..." -ForegroundColor Cyan
    
    $query = "SELECT id, order_number, customer_name, created_at, status FROM orders WHERE created_at >= '2025-09-19 00:00:00' ORDER BY id ASC"
    $command = New-Object MySql.Data.MySqlClient.MySqlCommand($query, $connection)
    $reader = $command.ExecuteReader()
    
    $ordersToDelete = @()
    while ($reader.Read()) {
        $ordersToDelete += @{
            id = $reader["id"]
            order_number = $reader["order_number"]
            customer_name = $reader["customer_name"]
            created_at = $reader["created_at"]
            status = $reader["status"]
        }
    }
    $reader.Close()
    
    Write-Host "📋 Encontrados $($ordersToDelete.Count) pedidos a eliminar:" -ForegroundColor Yellow
    foreach ($order in $ordersToDelete) {
        Write-Host "   - ID: $($order.id) | $($order.order_number) | $($order.customer_name) | $($order.created_at) | $($order.status)" -ForegroundColor Gray
    }
    
    if ($ordersToDelete.Count -eq 0) {
        Write-Host "✅ No hay pedidos a eliminar" -ForegroundColor Green
        $connection.Close()
        return
    }

    # 3. Obtener el siguiente ID disponible
    $maxIdQuery = "SELECT COALESCE(MAX(id), 0) as max_id FROM orders WHERE created_at < '2025-09-19 00:00:00'"
    $maxIdCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($maxIdQuery, $connection)
    $maxIdReader = $maxIdCommand.ExecuteReader()
    $maxIdReader.Read()
    $nextId = $maxIdReader["max_id"] + 1
    $maxIdReader.Close()
    
    Write-Host "`n🔢 El siguiente ID disponible será: $nextId" -ForegroundColor Yellow

    # 4. Mostrar advertencia
    Write-Host "`n⚠️  ADVERTENCIA: Esta operación eliminará permanentemente:" -ForegroundColor Red
    Write-Host "   - $($ordersToDelete.Count) pedidos" -ForegroundColor Red
    Write-Host "   - Todos los items de pedidos relacionados" -ForegroundColor Red
    Write-Host "   - Reseteará el AUTO_INCREMENT a $nextId" -ForegroundColor Red
    
    $confirmation = Read-Host "`n¿Continuar? (yes/no)"
    if ($confirmation.ToLower() -ne "yes") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        $connection.Close()
        return
    }

    Write-Host "`n🚀 Iniciando eliminación..." -ForegroundColor Cyan

    # 5. Deshabilitar verificación de claves foráneas
    $disableFKQuery = "SET FOREIGN_KEY_CHECKS = 0"
    $disableFKCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($disableFKQuery, $connection)
    $disableFKCommand.ExecuteNonQuery() | Out-Null
    Write-Host "🔓 Verificación de claves foráneas deshabilitada" -ForegroundColor Green

    # 6. Eliminar items de pedidos
    Write-Host "🗑️  Eliminando items de pedidos..." -ForegroundColor Cyan
    $deleteItemsQuery = @"
DELETE oi FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= '2025-09-19 00:00:00'
"@
    $deleteItemsCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($deleteItemsQuery, $connection)
    $deletedItems = $deleteItemsCommand.ExecuteNonQuery()
    Write-Host "✅ Eliminados $deletedItems items de pedidos" -ForegroundColor Green

    # 7. Eliminar pedidos
    Write-Host "🗑️  Eliminando pedidos..." -ForegroundColor Cyan
    $deleteOrdersQuery = "DELETE FROM orders WHERE created_at >= '2025-09-19 00:00:00'"
    $deleteOrdersCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($deleteOrdersQuery, $connection)
    $deletedOrders = $deleteOrdersCommand.ExecuteNonQuery()
    Write-Host "✅ Eliminados $deletedOrders pedidos" -ForegroundColor Green

    # 8. Resetear AUTO_INCREMENT
    Write-Host "🔄 Reseteando AUTO_INCREMENT..." -ForegroundColor Cyan
    $resetAutoIncrementQuery = "ALTER TABLE orders AUTO_INCREMENT = $nextId"
    $resetCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($resetAutoIncrementQuery, $connection)
    $resetCommand.ExecuteNonQuery() | Out-Null
    Write-Host "✅ AUTO_INCREMENT reseteado a $nextId" -ForegroundColor Green

    # 9. Rehabilitar verificación de claves foráneas
    $enableFKQuery = "SET FOREIGN_KEY_CHECKS = 1"
    $enableFKCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($enableFKQuery, $connection)
    $enableFKCommand.ExecuteNonQuery() | Out-Null
    Write-Host "🔒 Verificación de claves foráneas rehabilitada" -ForegroundColor Green

    # 10. Verificar resultado
    Write-Host "`n📊 Verificando resultado..." -ForegroundColor Cyan
    
    $verifyQuery = "SELECT COUNT(*) as count FROM orders WHERE created_at >= '2025-09-19 00:00:00'"
    $verifyCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($verifyQuery, $connection)
    $verifyReader = $verifyCommand.ExecuteReader()
    $verifyReader.Read()
    $remainingOrders = $verifyReader["count"]
    $verifyReader.Close()
    
    $autoIncrementQuery = "SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$DB_NAME' AND TABLE_NAME = 'orders'"
    $autoIncrementCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($autoIncrementQuery, $connection)
    $autoIncrementReader = $autoIncrementCommand.ExecuteReader()
    $autoIncrementReader.Read()
    $currentAutoIncrement = $autoIncrementReader["AUTO_INCREMENT"]
    $autoIncrementReader.Close()
    
    Write-Host "✅ Pedidos restantes desde 19 sept: $remainingOrders" -ForegroundColor Green
    Write-Host "✅ AUTO_INCREMENT actual: $currentAutoIncrement" -ForegroundColor Green

    # 11. Mostrar último pedido válido
    $lastOrderQuery = "SELECT id, order_number, customer_name, created_at FROM orders WHERE created_at < '2025-09-19 00:00:00' ORDER BY id DESC LIMIT 1"
    $lastOrderCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($lastOrderQuery, $connection)
    $lastOrderReader = $lastOrderCommand.ExecuteReader()
    
    if ($lastOrderReader.Read()) {
        Write-Host "`n📋 Último pedido válido:" -ForegroundColor Yellow
        Write-Host "   - ID: $($lastOrderReader['id'])" -ForegroundColor Gray
        Write-Host "   - Número: $($lastOrderReader['order_number'])" -ForegroundColor Gray
        Write-Host "   - Cliente: $($lastOrderReader['customer_name'])" -ForegroundColor Gray
        Write-Host "   - Fecha: $($lastOrderReader['created_at'])" -ForegroundColor Gray
    }
    $lastOrderReader.Close()

    Write-Host "`n🎉 ¡Eliminación completada exitosamente!" -ForegroundColor Green
    Write-Host "📝 El próximo pedido tendrá ID: $nextId" -ForegroundColor Yellow

} catch {
    Write-Host "`n❌ Error durante la eliminación: $($_.Exception.Message)" -ForegroundColor Red
    
    # Intentar rehabilitar las claves foráneas en caso de error
    if ($connection) {
        try {
            $cleanupQuery = "SET FOREIGN_KEY_CHECKS = 1"
            $cleanupCommand = New-Object MySql.Data.MySqlClient.MySqlCommand($cleanupQuery, $connection)
            $cleanupCommand.ExecuteNonQuery() | Out-Null
            Write-Host "🔒 Verificación de claves foráneas rehabilitada tras error" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Error en cleanup: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    throw
} finally {
    if ($connection) {
        $connection.Close()
        Write-Host "`n🔌 Conexión cerrada" -ForegroundColor Cyan
    }
}
