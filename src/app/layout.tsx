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
  description: "Controla tu PC Windows desde tu móvil. Mouse táctil, teclado virtual y control remoto seguro.",
  manifest: `${BASE_PATH}/manifest.json`,
  icons: {
    icon: `${BASE_PATH}/JarBees_logo.png`,
    apple: `${BASE_PATH}/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JarBees Motion",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
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
          "min-h-screen bg-background font-sans antialiased",
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
