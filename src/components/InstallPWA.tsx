"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user already dismissed the prompt recently
    const dismissedUntil = localStorage.getItem("pwa-motion-install-dismissed");
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("JarBees Motion PWA instalada exitosamente");
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Dismiss for 7 days
    const dismissUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pwa-motion-install-dismissed", dismissUntil.toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slide-up">
      <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900/95 to-blue-950/95 p-4 shadow-2xl shadow-blue-500/20 backdrop-blur-md">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-1.5 shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Image 
              src={`${BASE_PATH}/icons/icon-192x192.png`}
              alt="JarBees Motion" 
              width={40} 
              height={40} 
              className="object-contain rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Instalar JarBees Motion
            </h3>
            <p className="mt-1 text-xs text-blue-200/80 leading-relaxed">
              Control remoto táctil, sensores de movimiento y teclado para Windows. Funciona offline y sin cables.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all"
          >
            Instalar
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  );
}
