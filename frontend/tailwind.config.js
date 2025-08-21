/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores personalizados para la app
        'darkmagenta': '#8B008B',
        'cosmetic-pink': '#FF69B4',
        'cosmetic-rose': '#FF1493',
        'cosmetic-purple': '#9370DB',
        'cosmetic-lavender': '#E6E6FA',
        'cosmetic-peach': '#FFDAB9',
        'cosmetic-coral': '#FF7F50',
        'cosmetic-gold': '#FFD700',
        'cosmetic-silver': '#C0C0C0',
        'cosmetic-bronze': '#CD7F32',
        
        // Colores de estado para pedidos
        'order-pending': '#F59E0B',
        'order-confirmed': '#3B82F6',
        'order-preparing': '#8B5CF6',
        'order-ready': '#6366F1',
        'order-delivered': '#10B981',
        'order-cancelled': '#EF4444',
        
        // Gradientes personalizados
        'gradient-cosmetics': 'linear-gradient(135deg, #FF69B4 0%, #9370DB 100%)',
        'gradient-rose': 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)',
        'gradient-purple': 'linear-gradient(135deg, #9370DB 0%, #8B008B 100%)',
      },
      
      // Sombras personalizadas
      boxShadow: {
        'cosmetic': '0 10px 25px -3px rgba(255, 105, 180, 0.1), 0 4px 6px -2px rgba(255, 105, 180, 0.05)',
        'cosmetic-lg': '0 20px 25px -5px rgba(255, 105, 180, 0.1), 0 10px 10px -5px rgba(255, 105, 180, 0.04)',
        'cosmetic-xl': '0 25px 50px -12px rgba(255, 105, 180, 0.25)',
      },
      
      // Animaciones personalizadas
      animation: {
        'bounce-gentle': 'bounce-gentle 2s infinite',
        'pulse-cosmetics': 'pulse-cosmetics 3s infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
      
      // Keyframes personalizados
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-cosmetics': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      
      // Espaciado personalizado
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Bordes redondeados personalizados
      borderRadius: {
        'cosmetic': '1rem',
        'cosmetic-lg': '1.5rem',
        'cosmetic-xl': '2rem',
      },
    },
  },
  plugins: [],
} 