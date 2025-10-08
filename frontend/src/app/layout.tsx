import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import NavigationGuard from "@/components/NavigationGuard";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jeniri Cosmetics - Sistema de Inventario y Ventas",
  description: "Aplicación completa para gestión de inventario, ventas y carrito con apartado de productos de cosméticos Jeniri",
  keywords: "jeniri, cosméticos, inventario, ventas, carrito, apartado, belleza, maquillaje",
  authors: [{ name: "Jeniri Cosmetics Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  icons: {
    icon: [
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        sizes: "any",
      },
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "icon",
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        // Modern browsers usarán este .ico remoto
      },
      {
        rel: "icon",
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        // Fallback local
      },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Jeniri Cosmetics - Sistema de Inventario y Ventas",
    description: "Aplicación completa para gestión de inventario, ventas y carrito con apartado de productos de cosméticos Jeniri",
    url: "https://jeniricosmetics.com",
    siteName: "Jeniri Cosmetics",
    images: [
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png",
        width: 1200,
        height: 630,
        alt: "Jeniri Cosmetics",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jeniri Cosmetics - Sistema de Inventario y Ventas",
    description: "Aplicación completa para gestión de inventario, ventas y carrito con apartado de productos de cosméticos Jeniri",
    images: ["https://res.cloudinary.com/dthbzzrey/image/upload/v1759953435/jeniri_logo_8_ph0xj7.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* <NavigationGuard /> */}

      </body>
    </html>
  );
}
