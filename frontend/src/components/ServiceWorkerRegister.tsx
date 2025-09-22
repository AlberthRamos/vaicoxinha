'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('ServiceWorker registrado com sucesso:', registration.scope);
            
            // Verificar por atualizações periodicamente
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000); // Verificar a cada hora
          })
          .catch((error) => {
            console.log('Falha ao registrar ServiceWorker:', error);
          });
      });

      // Escutar por atualizações do Service Worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  return null;
}