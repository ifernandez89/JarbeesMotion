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
  title: "JarBees",
  description: "Asistente conversacional con IA",
  manifest: `${BASE_PATH}/manifest.json`,
  icons: {
    icon: `${BASE_PATH}/JarBees_logo.png`,
    apple: `${BASE_PATH}/JarBees_logo.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JarBees",
  },
};

export const viewport: Viewport = {
  themeColor: "#06b6d4",
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
