"use client";
import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
      navigator.serviceWorker.register(`${basePath}/sw.js`, {
        scope: `${basePath}/`,
      }).catch((error: unknown) => {
        console.error('No se pudo registrar el service worker de JarBees Motion.', error);
      });
    }
  }, []);

  return null;
}
