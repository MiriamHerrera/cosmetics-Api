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
  title: "💄 Cosmetics App - Sistema de Inventario y Ventas",
  description: "Aplicación completa para gestión de inventario, ventas y carrito con apartado de productos de cosméticos",
  keywords: "cosméticos, inventario, ventas, carrito, apartado, belleza",
  authors: [{ name: "Cosmetics App Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
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
