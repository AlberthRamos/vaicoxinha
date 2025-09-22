import { useState, useEffect, useCallback } from 'react';

interface PreloadOptions {
  priority?: 'high' | 'low';
  timeout?: number;
  retryCount?: number;
}

interface PreloadedImage {
  src: string;
  status: 'loading' | 'loaded' | 'error';
  error?: Error;
}

export function useImagePreloader(imageUrls: string[], options: PreloadOptions = {}) {
  const [images, setImages] = useState<Record<string, PreloadedImage>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const {
    priority = 'low',
    timeout = 30000,
    retryCount = 3,
  } = options;

  const preloadImage = useCallback(async (src: string, attempt = 0): Promise<void> => {
    setImages(prev => ({
      ...prev,
      [src]: { src, status: 'loading' },
    }));

    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => {
        reject(new Error(`Timeout loading image: ${src}`));
      }, timeout);

      img.onload = () => {
        clearTimeout(timer);
        setImages(prev => ({
          ...prev,
          [src]: { src, status: 'loaded' },
        }));
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timer);
        if (attempt < retryCount) {
          setTimeout(() => {
            preloadImage(src, attempt + 1).then(resolve).catch(reject);
          }, Math.pow(2, attempt) * 1000); // Backoff exponencial
        } else {
          setImages(prev => ({
            ...prev,
            [src]: { src, status: 'error', error: new Error(`Failed to load image: ${src}`) },
          }));
          setErrorCount(prev => prev + 1);
          reject(new Error(`Failed to load image after ${retryCount} attempts: ${src}`));
        }
      };

      img.decoding = priority === 'high' ? 'sync' : 'async';
      img.fetchPriority = priority;
      img.src = src;
    });
  }, [timeout, retryCount, priority]);

  const preloadImages = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;

    setIsLoading(true);
    setProgress(0);
    setErrorCount(0);

    const startTime = Date.now();
    let loadedCount = 0;

    const preloadPromises = urls.map(async (url) => {
      try {
        await preloadImage(url);
        loadedCount++;
        setProgress((loadedCount / urls.length) * 100);
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      }
    });

    if (priority === 'high') {
      await Promise.all(preloadPromises);
    } else {
      await Promise.allSettled(preloadPromises);
    }

    const endTime = Date.now();
    console.log(`Image preloading completed in ${endTime - startTime}ms`);
    setIsLoading(false);
  }, [preloadImage, priority]);

  const retryFailedImages = useCallback(() => {
    const failedImages = Object.values(images)
      .filter(img => img.status === 'error')
      .map(img => img.src);

    if (failedImages.length > 0) {
      preloadImages(failedImages);
    }
  }, [images, preloadImages]);

  const getImageStatus = useCallback((src: string) => {
    return images[src]?.status || 'loading';
  }, [images]);

  const isImageLoaded = useCallback((src: string) => {
    return images[src]?.status === 'loaded';
  }, [images]);

  const getLoadProgress = useCallback(() => {
    if (imageUrls.length === 0) return 100;
    const loadedImages = Object.values(images).filter(img => img.status === 'loaded').length;
    return (loadedImages / imageUrls.length) * 100;
  }, [images, imageUrls]);

  useEffect(() => {
    if (imageUrls.length > 0) {
      preloadImages(imageUrls);
    }
  }, [JSON.stringify(imageUrls), preloadImages]);

  return {
    images,
    isLoading,
    progress,
    errorCount,
    loadedCount: Object.values(images).filter(img => img.status === 'loaded').length,
    totalCount: imageUrls.length,
    retryFailedImages,
    getImageStatus,
    isImageLoaded,
    getLoadProgress,
    preloadImages,
  };
}

export function useCriticalImagePreloader(imageUrls: string[]) {
  return useImagePreloader(imageUrls, {
    priority: 'high',
    timeout: 10000,
    retryCount: 5,
  });
}

export function useLazyImagePreloader(imageUrls: string[]) {
  return useImagePreloader(imageUrls, {
    priority: 'low',
    timeout: 60000,
    retryCount: 2,
  });
}