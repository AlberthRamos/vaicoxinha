import { useState, useEffect } from 'react';

interface UseCodeSplittingOptions {
  delay?: number;
  condition?: boolean;
}

export function useCodeSplitting(
  componentName: string,
  options: UseCodeSplittingOptions = {}
) {
  const { delay = 0, condition = true } = options;
  const [isReady, setIsReady] = useState(delay === 0 && condition);

  useEffect(() => {
    if (!condition) return;

    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setIsReady(true);
    }
  }, [delay, condition]);

  return {
    isReady,
    componentName,
    loadPriority: delay === 0 ? 'high' : 'low'
  };
}

export function usePriorityLoader() {
  const [criticalComponents, setCriticalComponents] = useState<Set<string>>(new Set());
  const [secondaryComponents, setSecondaryComponents] = useState<Set<string>>(new Set());

  const markAsCritical = (componentName: string) => {
    setCriticalComponents(prev => new Set([...prev, componentName]));
  };

  const markAsSecondary = (componentName: string) => {
    setSecondaryComponents(prev => new Set([...prev, componentName]));
  };

  const isCritical = (componentName: string) => criticalComponents.has(componentName);
  const isSecondary = (componentName: string) => secondaryComponents.has(componentName);

  return {
    markAsCritical,
    markAsSecondary,
    isCritical,
    isSecondary,
    criticalCount: criticalComponents.size,
    secondaryCount: secondaryComponents.size
  };
}