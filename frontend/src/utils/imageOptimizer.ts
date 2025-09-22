export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  progressive?: boolean;
  blur?: number;
}

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  sizes: string;
  type: string;
  width: number;
  height: number;
}

export class ImageOptimizer {
  private static readonly CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/demo/image/upload';
  private static readonly DEFAULT_QUALITY = 85;
  private static readonly DEFAULT_FORMAT = 'auto';

  static generateOptimizedUrl(
    src: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      return src;
    }

    if (src.includes('cloudinary.com')) {
      return this.optimizeCloudinaryImage(src, options);
    }

    return this.optimizeLocalImage(src, options);
  }

  private static optimizeCloudinaryImage(
    src: string,
    options: ImageOptimizationOptions
  ): string {
    const url = new URL(src);
    const transformations: string[] = [];

    if (options.width || options.height) {
      const size = `${options.width || 'auto'}x${options.height || 'auto'}`;
      transformations.push(`c_${options.crop || 'fill'},${size}`);
    }

    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    } else {
      transformations.push(`q_${this.DEFAULT_QUALITY}`);
    }

    if (options.format && options.format !== 'auto') {
      transformations.push(`f_${options.format}`);
    } else {
      transformations.push('f_auto');
    }

    if (options.progressive) {
      transformations.push('fl_progressive');
    }

    if (options.blur) {
      transformations.push(`e_blur:${options.blur}`);
    }

    const existingTransformations = url.pathname.split('/').slice(2, -1);
    const newTransformations = [...existingTransformations, ...transformations];
    
    const pathParts = url.pathname.split('/');
    const imageName = pathParts[pathParts.length - 1];
    
    url.pathname = `/image/upload/${newTransformations.join(',')}/${imageName}`;
    
    return url.toString();
  }

  private static optimizeLocalImage(
    src: string,
    options: ImageOptimizationOptions
  ): string {
    if (process.env.NODE_ENV === 'development') {
      return src;
    }

    const params = new URLSearchParams();
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    if (options.crop) params.set('crop', options.crop);
    if (options.progressive) params.set('progressive', 'true');

    return `${src}?${params.toString()}`;
  }

  static generateResponsiveImages(
    src: string,
    breakpoints: number[] = [640, 768, 1024, 1280, 1920],
    options: Omit<ImageOptimizationOptions, 'width' | 'height'> = {}
  ): ResponsiveImage[] {
    return breakpoints.map(width => ({
      src: this.generateOptimizedUrl(src, { ...options, width }),
      srcSet: `${this.generateOptimizedUrl(src, { ...options, width })} ${width}w`,
      sizes: `(max-width: ${width}px) ${width}px, ${width}px`,
      type: options.format === 'webp' ? 'image/webp' : 'image/jpeg',
      width,
      height: Math.round(width * 0.75), // Proporção 4:3 por padrão
    }));
  }

  static generateImageSet(
    src: string,
    options: ImageOptimizationOptions = {}
  ): { srcSet: string; type: string }[] {
    const formats = options.format === 'auto' 
      ? ['avif', 'webp', 'jpeg'] 
      : [options.format || 'jpeg'];

    return formats.map(format => ({
      srcSet: this.generateOptimizedUrl(src, { ...options, format }),
      type: `image/${format === 'jpeg' ? 'jpg' : format}`,
    }));
  }

  static getLQIPPlaceholder(src: string): string {
    return this.generateOptimizedUrl(src, {
      width: 20,
      quality: 10,
      blur: 20,
      format: 'jpeg',
    });
  }

  static getDominantColor(src: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#8B4513');
          return;
        }

        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);

        try {
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          resolve(`rgb(${r}, ${g}, ${b})`);
        } catch {
          resolve('#8B4513');
        }
      };
      img.onerror = () => resolve('#8B4513');
      img.src = src;
    });
  }
}

export function getOptimizedImageProps(
  src: string,
  alt: string,
  options: ImageOptimizationOptions = {},
  responsive: boolean = true
) {
  const imageSet = ImageOptimizer.generateImageSet(options);
  const lqip = ImageOptimizer.getLQIPPlaceholder(src);
  
  const props: any = {
    src: ImageOptimizer.generateOptimizedUrl(src, options),
    alt,
    loading: 'lazy',
    decoding: 'async',
  };

  if (responsive) {
    const responsiveImages = ImageOptimizer.generateResponsiveImages(src, [640, 768, 1024, 1280], options);
    props.srcSet = responsiveImages.map(img => img.srcSet).join(', ');
    props.sizes = '(max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1280px';
  }

  return {
    ...props,
    'data-lqip': lqip,
    'data-src': src,
  };
}