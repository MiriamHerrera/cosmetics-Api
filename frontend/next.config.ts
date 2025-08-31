import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones para producción
  // output: 'standalone', // Comentado temporalmente para Vercel
  poweredByHeader: false,
  compress: true,
  
  // Configuración de imágenes
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'example.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'jeniricosmetics.com' },
      { protocol: 'https', hostname: 'www.jeniricosmetics.com' },
      { protocol: 'https', hostname: 'api.jeniricosmetics.com' },
      { protocol: 'https', hostname: 'vercel.app' },
      { protocol: 'https', hostname: '*.vercel.app' }
    ],
    // Permitir imágenes locales (data URLs)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Optimizaciones para producción
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    // Configuración para imágenes locales
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirecciones para producción
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
