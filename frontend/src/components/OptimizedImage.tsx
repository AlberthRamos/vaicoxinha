import { useState, useEffect, useRef } from 'react';
import { ImageOptimizer, getOptimizedImageProps, ImageOptimizationOptions } from '@/utils/imageOptimizer';
import { useLazyLoad } from '@/hooks/useLazyLoad';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  optimization?: ImageOptimizationOptions;
  placeholder?: 'blur' | 'dominant' | 'lqip' | 'none';
  responsive?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  optimization = {},
  placeholder = 'blur',
  responsive = true,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [placeholderColor, setPlaceholderColor] = useState('#8B4513');
  const imgRef = useRef<HTMLImageElement>(null);
  const { isVisible, ref: containerRef } = useLazyLoad({
    rootMargin: '50px',
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (placeholder === 'dominant' && src) {
      ImageOptimizer.getDominantColor(src).then(color => {
        setPlaceholderColor(color);
      });
    }
  }, [src, placeholder]);

  useEffect(() => {
    if (priority || isVisible) {
      const img = new Image();
      img.onload = () => {
        setIsLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        setIsError(true);
        onError?.();
      };
      img.src = ImageOptimizer.generateOptimizedUrl(src, {
        width,
        height,
        ...optimization,
      });
    }
  }, [src, isVisible, priority, width, height, optimization, onLoad, onError]);

  const getPlaceholderStyle = () => {
    if (placeholder === 'none') return {};
    
    if (placeholder === 'blur') {
      return {
        filter: 'blur(20px)',
        transform: 'scale(1.1)',
      };
    }

    if (placeholder === 'dominant') {
      return {
        backgroundColor: placeholderColor,
      };
    }

    return {};
  };

  const shouldShowPlaceholder = !isLoaded && !isError;
  const shouldShowImage = (priority || isVisible) && !isError;

  return (
    <div
      ref={containerRef}
      className={`optimized-image-container ${className}`}
      style={{
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        overflow: 'hidden',
        backgroundColor: placeholder === 'dominant' ? placeholderColor : '#f0f0f0',
      }}
    >
      {shouldShowPlaceholder && (
        <div
          className="image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...getPlaceholderStyle(),
          }}
        >
          <div className="placeholder-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

      {shouldShowImage && (
        <img
          ref={imgRef}
          {...getOptimizedImageProps(src, alt, {
            width,
            height,
            ...optimization,
          }, responsive)}
          className={`optimized-image ${isLoaded ? 'loaded' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
        />
      )}

      {isError && (
        <div
          className="image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f8f8',
            color: '#666',
          }}
        >
          <div className="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p style={{ marginTop: '8px', fontSize: '12px', textAlign: 'center' }}>
              Erro ao carregar imagem
            </p>
          </div>
        </div>
      )}
    </div>
  );
}