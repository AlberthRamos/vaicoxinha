import { useFocusTrap } from '@/hooks/useA11y';
import { useRef, ReactNode, useEffect } from 'react';

interface FocusTrapProps {
  children: ReactNode;
  isActive: boolean;
  className?: string;
  restoreFocus?: boolean;
  initialFocus?: string | (() => HTMLElement | null);
}

export function FocusTrap({
  children,
  isActive,
  className,
  restoreFocus = true,
  initialFocus
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useFocusTrap(containerRef);

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Salva o elemento focado anteriormente
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Define o foco inicial
      let focusElement: HTMLElement | null = null;

      if (typeof initialFocus === 'string') {
        focusElement = containerRef.current.querySelector(initialFocus) as HTMLElement;
      } else if (typeof initialFocus === 'function') {
        focusElement = initialFocus();
      }

      if (!focusElement) {
        // Se não houver elemento específico, foca no primeiro elemento focável
        const focusableElements = containerRef.current.querySelectorAll(
          'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
        );
        focusElement = focusableElements[0] as HTMLElement;
      }

      if (focusElement) {
        focusElement.focus();
      }
    }

    return () => {
      if (restoreFocus && previousFocusRef.current && !isActive) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, initialFocus, restoreFocus]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`focus-trap ${className || ''}`}
      role="application"
      aria-label="Área de foco restrito"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}