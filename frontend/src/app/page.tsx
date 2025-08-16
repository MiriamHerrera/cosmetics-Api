'use client';

import { Users, Package, BarChart3, Zap, Star } from 'lucide-react';
import { useStore } from '@/store/useStore';
import CartButton from '@/components/ui/CartButton';
import UpcomingInventory from '@/components/sections/UpcomingInventory';

export default function Home() {

  const features = [
    {
      icon: Package,
      title: "Inventario Inteligente",
      description: "Gestión completa de productos con filtros avanzados y control de stock"
    },
    {
      icon: Package,
      title: "Carrito con Apartado",
      description: "Reserva productos por 7 días mientras decides tu compra"
    },
    {
      icon: Zap,
      title: "WhatsApp Automático",
      description: "Notificaciones automáticas para recordatorios y confirmaciones"
    },
    {
      icon: BarChart3,
      title: "Dashboard Completo",
      description: "Estadísticas detalladas de ventas, clientes y productos"
    },
    {
      icon: Users,
      title: "Gestión de Clientes",
      description: "Sistema completo de usuarios con perfiles y historial"
    },
    {
      icon: Star,
      title: "Encuestas y Feedback",
      description: "Recopila opiniones y mejora la experiencia del cliente"
    }
  ];

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
              <CartButton />
              <button className="
                bg-pink-600 text-white 
                px-2 py-2 sm:px-4 sm:py-2 
                text-xs sm:text-sm
                rounded-lg hover:bg-pink-700 
                transition-colors
                whitespace-nowrap
              ">
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Login</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema Completo de Inventario y Ventas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Gestiona tu negocio de cosméticos con herramientas profesionales. 
            Inventario inteligente, carrito con apartado, integración WhatsApp y mucho más.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-pink-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-pink-700 transition-colors">
              Comenzar Ahora
            </button>
            <button className="border border-pink-600 text-pink-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-pink-50 transition-colors">
              Ver Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Próximo Inventario */}
        <UpcomingInventory
          arrivalDate="2024-02-15"
          arrivalTime="9:00 AM - 11:00 AM"
          expectedProducts={[
            {
              id: "1",
              name: "Máscara de Pestañas Volumizadora",
              description: "Máscara de pestañas de larga duración que agrega volumen y longitud sin grumos",
              price: 24.99,
              stock: 50,
              category: "Maquillaje",
              brand: "BeautyPro",
              image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop",
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: "2",
              name: "Serum Facial con Vitamina C",
              description: "Serum antioxidante que ilumina la piel y reduce las manchas oscuras",
              price: 39.99,
              stock: 30,
              category: "Skincare",
              brand: "GlowEssence",
              image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: "3",
              name: "Paleta de Sombras Profesional",
              description: "Paleta con 18 sombras mate y brillantes para crear looks únicos",
              price: 49.99,
              stock: 25,
              category: "Maquillaje",
              brand: "ColorStudio",
              image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=400&fit=crop",
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: "4",
              name: "Crema Hidratante con Ácido Hialurónico",
              description: "Crema hidratante intensiva que mantiene la piel suave y elástica",
              price: 29.99,
              stock: 40,
              category: "Skincare",
              brand: "HydraCare",
              image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]}
        />

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Números que Hablan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">500+</div>
              <div className="text-gray-600">Productos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">1000+</div>
              <div className="text-gray-600">Clientes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">50+</div>
              <div className="text-gray-600">Categorías</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">24/7</div>
              <div className="text-gray-600">Soporte</div>
            </div>
          </div>
        </div>
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
