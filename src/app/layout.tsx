import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import RegisterSW from "@/components/RegisterSW";
import InstallPWA from "@/components/InstallPWA";

const fontSans = FontSans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "JarBees Motion - Control Remoto PC",
  description: "Controla tu PC Windows desde tu móvil. Mouse táctil, teclado virtual y sensores de movimiento.",
  manifest: `${BASE_PATH}/manifest.json`,
  icons: {
    icon: [
      { url: `${BASE_PATH}/icons/icon-192x192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icons/icon-512x512.png`, sizes: "512x512", type: "image/png" },
      { url: `${BASE_PATH}/favicon-32.png`, sizes: "32x32", type: "image/png" },
    ],
    apple: `${BASE_PATH}/apple-touch-icon.png`,
    shortcut: `${BASE_PATH}/favicon.ico`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JarBees Motion",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased select-none touch-none",
          fontSans.variable
        )}
      >
        {children}
        <RegisterSW />
        <InstallPWA />
      </body>
    </html>
  );
}
