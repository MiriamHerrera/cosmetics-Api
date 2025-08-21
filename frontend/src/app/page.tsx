'use client';


import CartButton from '@/components/ui/CartButton';
import { AuthButton } from '@/components/ui';
import { UpcomingInventory, StockSurvey, ProductsSection } from '@/components/sections';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                💄 Cosmetics
              </h1>
            </div>
            
            {/* Botones de acción */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <AuthButton 
                variant="default"
                size="md"
                className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 shadow-sm hover:shadow-md"
                showUserInfo={true}
              >
                {/* El texto se maneja dinámicamente en LoginButton y LogoutButton */}
              </AuthButton>
            </div>
          </div>
        </div>
      </header>

      {/* Carrito flotante en esquina inferior derecha */}
      <div className="fixed bottom-6 right-6 z-40">
        <CartButton />
      </div>



      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      

        {/* Sección de Productos */}
        <ProductsSection />

        {/* Próximo Inventario */}
        <UpcomingInventory
          arrivalDate="2024-02-15"
          arrivalTime="9:00 AM - 11:00 AM"
          expectedProducts={[
            {
              id: 1,
              name: "Máscara de Pestañas Volumizadora",
              description: "Máscara de pestañas de larga duración que agrega volumen y longitud sin grumos",
              price: 24.99,
              stock_total: 50,
              category_name: "Maquillaje",
              product_type_name: "Máscara",
              image_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop",
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 2,
              name: "Serum Facial con Vitamina C",
              description: "Serum antioxidante que ilumina la piel y reduce las manchas oscuras",
              price: 39.99,
              stock_total: 30,
              category_name: "Skincare",
              product_type_name: "Serum",
              image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 3,
              name: "Paleta de Sombras Profesional",
              description: "Paleta con 18 sombras mate y brillantes para crear looks únicos",
              price: 49.99,
              stock_total: 25,
              category_name: "Maquillaje",
              product_type_name: "Paleta",
              image_url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop",
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 4,
              name: "Crema Hidratante con Ácido Hialurónico",
              description: "Crema hidratante intensiva que mantiene la piel suave y elástica",
              price: 29.99,
              stock_total: 40,
              category_name: "Skincare",
              product_type_name: "Crema",
              image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
              status: "active",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]}
        />



        {/* Encuesta de Stock */}
        <StockSurvey totalVotes={156} />



      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">💄 Cosmetics App</h3>
            <p className="text-gray-400 mb-6">
              Transformando la gestión de negocios de cosméticos
            </p>
            <div className="text-sm text-gray-500">
              © 2024 Cosmetics App. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
