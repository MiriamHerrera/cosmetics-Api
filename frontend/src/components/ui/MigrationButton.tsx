// Componente para migrar URLs corruptas a Cloudinary
import React, { useState } from 'react';

interface MigrationButtonProps {
  onMigrationComplete?: (result: any) => void;
}

const MigrationButton: React.FC<MigrationButtonProps> = ({ onMigrationComplete }) => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const handleMigration = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🔄 Iniciando migración de URLs corruptas...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/images/migrate-to-cloudinary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Migración completada:', data);
        setResult(data);
        onMigrationComplete?.(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Error en migración:', errorData);
        setResult({ success: false, error: errorData.message });
      }
    } catch (error) {
      console.error('❌ Error en migración:', error);
      setResult({ success: false, error: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Probando estado del servidor...');
      
      // Test 1: Verificar estado del endpoint
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.jeniricosmetics.com/api'}/images/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('✅ Estado del servidor:', statusData);
        setTestResult({ success: true, status: statusData });
      } else {
        console.error('❌ Error verificando estado:', statusResponse.status);
        setTestResult({ success: false, error: `Error ${statusResponse.status}` });
      }
    } catch (error) {
      console.error('❌ Error en test:', error);
      setTestResult({ success: false, error: 'Error de conexión' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        🔧 Herramientas de Migración
      </h3>
      
      <div className="space-x-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className={`px-4 py-2 rounded-md font-medium ${
            testing
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {testing ? '🧪 Probando...' : '🧪 Verificar Estado'}
        </button>
        
        <button
          onClick={handleMigration}
          disabled={loading}
          className={`px-4 py-2 rounded-md font-medium ${
            loading
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-700 text-white'
          }`}
        >
          {loading ? '🔄 Migrando...' : '🧹 Limpiar URLs Corruptas'}
        </button>
      </div>

      {testResult && (
        <div className={`mt-3 p-3 rounded-md ${
          testResult.success ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
        }`}>
          <h4 className="font-semibold">
            {testResult.success ? '✅ Estado del Servidor' : '❌ Error en Test'}
          </h4>
          {testResult.status && (
            <div className="mt-2 text-sm">
              <p>Versión: {testResult.status.version}</p>
              <p>Cloudinary configurado: {testResult.status.cloudinary_configured ? 'Sí' : 'No'}</p>
              <p>Timestamp: {new Date(testResult.status.timestamp).toLocaleString()}</p>
            </div>
          )}
          {testResult.error && (
            <p className="mt-2 text-sm">Error: {testResult.error}</p>
          )}
        </div>
      )}

      {result && (
        <div className={`mt-3 p-3 rounded-md ${
          result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <h4 className="font-semibold">
            {result.success ? '✅ Migración Exitosa' : '❌ Error en Migración'}
          </h4>
          {result.data && (
            <div className="mt-2 text-sm">
              <p>Total productos: {result.data.total}</p>
              <p>Migrados: {result.data.migrated}</p>
              <p>Limpiados: {result.data.cleaned}</p>
            </div>
          )}
          {result.error && (
            <p className="mt-2 text-sm">Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MigrationButton;
