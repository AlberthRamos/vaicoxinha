'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  fill?: boolean;
  fallbackSrc?: string;
}

export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  sizes,
  fill = false,
  fallbackSrc = '/images/placeholder-food.png'
}: ImageWithFallbackProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setImageError(false);
  }, [src]);

  const handleImageError = () => {
    if (!imageError) {
      setImageSrc(fallbackSrc);
      setImageError(true);
    }
  };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      sizes={sizes}
      loading={loading}
      priority={priority}
      className={className}
      onError={handleImageError}
    />
  );
}