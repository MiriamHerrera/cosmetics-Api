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
  title: "💄 Jeniri Cosmetics - Sistema de Inventario y Ventas",
  description: "Aplicación completa para gestión de inventario, ventas y carrito con apartado de productos de cosméticos Jeniri",
  keywords: "jeniri, cosméticos, inventario, ventas, carrito, apartado, belleza, maquillaje",
  authors: [{ name: "Jeniri Cosmetics Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1758421657/isotipoJeniri_tx2fxz.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1758421657/isotipoJeniri_tx2fxz.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1758421657/isotipoJeniri_tx2fxz.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "icon",
        url: "/favicon.ico",
      },
      {
        rel: "icon",
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1758421657/isotipoJeniri_tx2fxz.png",
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
        url: "https://res.cloudinary.com/dthbzzrey/image/upload/v1758421657/isotipoJeniri_tx2fxz.png",
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
    images: ["https://res.cloudinary.com/dthbzzrey/image/upload/v1758421657/isotipoJeniri_tx2fxz.png"],
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
