import { ReactNode } from 'react';
import { useLazyLoad } from '@/hooks/useLazyLoad';

interface LazyLoadWrapperProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function LazyLoadWrapper({
  children,
  placeholder,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  className,
  as: Component = 'div'
}: LazyLoadWrapperProps) {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>({
    rootMargin,
    threshold,
    triggerOnce
  });

  return (
    <Component
      ref={ref}
      className={`lazy-load-wrapper ${className || ''}`}
      style={{
        minHeight: placeholder ? '200px' : undefined
      }}
    >
      {isVisible ? children : placeholder}
    </Component>
  );
}