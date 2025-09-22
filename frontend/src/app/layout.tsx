'use client';

import { useState, useEffect } from 'react';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/Header/Header';

import { MobileBottomNav } from '@/components/MobileBottomNav/MobileBottomNav';
import { LoadingScreen } from '@/components/LoadingScreen/LoadingScreen';
import { UnifiedLoadingScreen } from '@/components/UnifiedLoadingScreen/UnifiedLoadingScreen';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { SkipLinks } from '@/components/SkipLinks';
import { AriaLive } from '@/components/AriaLive';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  
  usePerformanceMonitor();

  useEffect(() => {
    // Monitorar status online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Simular carregamento inicial
    const timer = setTimeout(() => setIsLoading(false), 1000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return (
      <html lang="pt-BR">
        <body className="bg-gray-50">
          <ServiceWorkerRegister />
          <SkipLinks />
          <AriaLive />
          <UnifiedLoadingScreen isLoading={isLoading} context="default" />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 font-sans">
        <ServiceWorkerRegister />
        <SkipLinks />
        <AriaLive />
        
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            
            <main id="main-content" className="flex-1">
              {children}
            </main>
            
            <MobileBottomNav />
          </div>
          
          {!isOnline && <OfflineIndicator />}
        </CartProvider>
      </body>
    </html>
  );
}