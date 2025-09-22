import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP não suportado');
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const firstEntry = entries[0] as PerformanceEntry;
        setMetrics(prev => ({ ...prev, fid: firstEntry.processingStart - firstEntry.startTime }));
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID não suportado');
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS não suportado');
      }

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          setMetrics(prev => ({ ...prev, fcp: fcpEntry.startTime }));
        }
      });
      
      try {
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('FCP não suportado');
      }

      // Time to First Byte (TTFB)
      if (window.performance && window.performance.timing) {
        const navigationTiming = window.performance.timing;
        const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
        setMetrics(prev => ({ ...prev, ttfb }));
      }

      // Log performance warnings
      const checkPerformance = () => {
        if (metrics.lcp && metrics.lcp > 2500) {
          console.warn('LCP acima do recomendado (< 2.5s):', metrics.lcp + 'ms');
        }
        if (metrics.fid && metrics.fid > 100) {
          console.warn('FID acima do recomendado (< 100ms):', metrics.fid + 'ms');
        }
        if (metrics.cls && metrics.cls > 0.1) {
          console.warn('CLS acima do recomendado (< 0.1):', metrics.cls);
        }
      };

      // Check performance after 3 seconds
      setTimeout(checkPerformance, 3000);

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
      };
    }
  }, []);

  return metrics;
}