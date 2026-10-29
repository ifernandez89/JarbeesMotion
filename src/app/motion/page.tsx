"use client";

import { useState, useEffect } from "react";
import { MotionController } from "@/components/motion/MotionController";

export default function MotionPage() {
  const [bridgeUrl, setBridgeUrl] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => {
    // Try to load saved bridge URL from localStorage
    const saved = localStorage.getItem("jarbees-motion-bridge-url");
    if (saved) {
      setBridgeUrl(saved);
      setIsConfigured(true);
    }
  }, []);

  const handleAutoDetect = () => {
    // Try common local IP patterns
    const hostname = window.location.hostname;
    
    // If running on localhost, use localhost
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const url = "wss://localhost:8443/motion";
      setBridgeUrl(url);
      localStorage.setItem("jarbees-motion-bridge-url", url);
      setIsConfigured(true);
      return;
    }

    // Otherwise, prompt user for their PC's IP
    const detectedUrl = "wss://192.168.1.100:8443/motion";
    setManualUrl(detectedUrl);
  };

  const handleManualConnect = () => {
    if (!manualUrl.trim()) return;
    
    // Ensure URL has protocol
    let url = manualUrl.trim();
    if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      url = "wss://" + url;
    }
    
    // Ensure URL has path
    if (!url.endsWith("/motion")) {
      url = url + "/motion";
    }

    setBridgeUrl(url);
    localStorage.setItem("jarbees-motion-bridge-url", url);
    setIsConfigured(true);
  };

  // Show controller if URL is configured
  if (isConfigured && bridgeUrl) {
    return <MotionController bridgeUrl={bridgeUrl} />;
  }

  // Show setup screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 select-none">🐝🖱️</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            JarBees Motion
          </h1>
          <p className="text-blue-200/80 text-sm">
            Control Remoto PC: Mouse, Sensores y Teclado
          </p>
        </div>

        {/* Setup card */}
        <div className="bg-slate-900/80 border border-blue-500/20 backdrop-blur-md rounded-2xl shadow-2xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Configurar Conexión
          </h2>

          {/* Auto-detect option */}
          <div className="mb-6">
            <button
              onClick={handleAutoDetect}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all"
            >
              🔍 Detectar Bridge Automáticamente
            </button>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Recomendado para comenzar rápidamente
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-900 text-slate-400 uppercase tracking-wider">
                O ingresar IP manualmente
              </span>
            </div>
          </div>

          {/* Manual input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Dirección del Bridge en PC Windows
              </label>
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="192.168.1.100:8443"
                className="w-full px-4 py-3 border border-slate-700 rounded-xl bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualConnect();
                }}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Formato: IP:PUERTO o wss://IP:PUERTO/motion
              </p>
            </div>

            <button
              onClick={handleManualConnect}
              disabled={!manualUrl.trim()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-xl shadow-md transition-all disabled:cursor-not-allowed"
            >
              Conectar al Bridge
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-950/40 border border-blue-500/20 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-blue-200 text-sm mb-2">
            📝 Pasos antes de conectar:
          </h3>
          <ol className="text-xs text-blue-300/80 space-y-1.5 list-decimal list-inside">
            <li>Ejecuta <strong>JarbeesMotionBridge.exe</strong> en tu PC Windows</li>
            <li>Revisa la dirección IP mostrada en la ventana del Bridge</li>
            <li>Asegúrate de que el teléfono y la PC estén en la misma red WiFi</li>
            <li>Ingresa la IP arriba y pulsa <strong>Conectar</strong></li>
          </ol>
        </div>

        {/* Reset URL button if needed */}
        {savedUrlExists() && (
          <div className="text-center mt-3">
            <button
              onClick={() => {
                localStorage.removeItem("jarbees-motion-bridge-url");
                setBridgeUrl("");
                setIsConfigured(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Limpiar conexión guardada
            </button>
          </div>
        )}
      </div>
    </div>
  );

  function savedUrlExists() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("jarbees-motion-bridge-url");
  }
}
