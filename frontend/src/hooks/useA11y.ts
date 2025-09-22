import { useState, useEffect, useCallback } from 'react';

export function useScreenReader() {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  useEffect(() => {
    const checkScreenReader = () => {
      // Detecta se há tecnologias assistivas ativas
      const hasLargeText = window.matchMedia('(min-resolution: 2dppx)').matches;
      const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      setIsScreenReaderActive(hasLargeText || hasHighContrast || hasReducedMotion);
    };

    checkScreenReader();
    window.addEventListener('resize', checkScreenReader);
    
    return () => window.removeEventListener('resize', checkScreenReader);
  }, []);

  return { isScreenReaderActive };
}

export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = containerRef.current?.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, handleKeyDown]);
}

export function useAriaLive(announcement: string, priority: 'polite' | 'assertive' = 'polite') {
  const [ariaLiveRegion, setAriaLiveRegion] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    
    document.body.appendChild(region);
    setAriaLiveRegion(region);

    return () => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    };
  }, [priority]);

  useEffect(() => {
    if (ariaLiveRegion && announcement) {
      ariaLiveRegion.textContent = announcement;
      
      const timer = setTimeout(() => {
        if (ariaLiveRegion) {
          ariaLiveRegion.textContent = '';
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [announcement, ariaLiveRegion]);
}

export function useSkipLinks() {
  const [skipLinks, setSkipLinks] = useState<Array<{ id: string; text: string; target: string }>>([]);

  const addSkipLink = (id: string, text: string, target: string) => {
    setSkipLinks(prev => [...prev.filter(link => link.id !== id), { id, text, target }]);
  };

  const removeSkipLink = (id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  };

  return { skipLinks, addSkipLink, removeSkipLink };
}