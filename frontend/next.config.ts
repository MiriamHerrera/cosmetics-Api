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
      { protocol: 'https', hostname: 'localhost' }
    ],
    // Optimizaciones para producción
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
