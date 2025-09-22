'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import { usePromotionalBanners, PromotionalBanner } from '@/hooks/usePromotionalBanners';
import { UnifiedLoadingScreen } from '@/components/UnifiedLoadingScreen/UnifiedLoadingScreen';

interface PromotionalBannerProps {
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  showCloseButton?: boolean;
  onBannerClick?: (banner: PromotionalBanner) => void;
  onBannerClose?: (bannerId: string) => void;
}

export default function PromotionalBanner({
  className = '',
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  showCloseButton = true,
  onBannerClick,
  onBannerClose
}: PromotionalBannerProps) {
  const { banners, loading, error } = usePromotionalBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [closedBanners, setClosedBanners] = useState<string[]>([]);

  // Filter out closed banners
  const visibleBanners = banners.filter(banner => !closedBanners.includes(banner.id));

  useEffect(() => {
    if (!autoPlay || visibleBanners.length <= 1) return;

    const interval = setInterval(() => {
      if (isAutoPlaying) {
        setCurrentIndex((prev) => (prev + 1) % visibleBanners.length);
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, visibleBanners.length, isAutoPlaying]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visibleBanners.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + visibleBanners.length) % visibleBanners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleBannerClick = (banner: PromotionalBanner) => {
    if (onBannerClick) {
      onBannerClick(banner);
    } else {
      // Default behavior: navigate to banner link
      window.location.href = banner.link;
    }
  };

  const handleCloseBanner = (bannerId: string) => {
    setClosedBanners(prev => [...prev, bannerId]);
    if (onBannerClose) {
      onBannerClose(bannerId);
    }
    // Adjust current index if necessary
    if (currentIndex >= visibleBanners.length - 1) {
      setCurrentIndex(Math.max(0, visibleBanners.length - 2));
    }
  };

  if (loading) {
    return <UnifiedLoadingScreen isLoading={true} context="default" />;
  }

  if (error || visibleBanners.length === 0) {
    return null; // Don't render anything if there are no banners or an error
  }

  const currentBanner = visibleBanners[currentIndex];

  return (
    <div className={`relative overflow-hidden rounded-lg shadow-lg ${className}`}>
      <div className="relative h-48 md:h-64">
        <div
          key={currentBanner.id}
          className={`absolute inset-0 ${currentBanner.backgroundColor} cursor-pointer`}
          onClick={() => handleBannerClick(currentBanner)}
        >
          <div className="h-full flex items-center justify-between px-6 md:px-8">
            {/* Content */}
            <div className="flex-1 max-w-2xl">
              <h2 className={`text-2xl md:text-3xl font-bold ${currentBanner.textColor} mb-2`}>
                {currentBanner.title}
              </h2>
              <p className={`${currentBanner.textColor} text-opacity-90 mb-4 text-sm md:text-base`}>
                {currentBanner.description}
              </p>
              <button
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${currentBanner.buttonColor}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick(currentBanner);
                }}
              >
                <span>{currentBanner.buttonText}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Image */}
            <div className="hidden md:block flex-shrink-0 ml-8">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <div className="w-24 h-24 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-white bg-opacity-40 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseBanner(currentBanner.id);
              }}
              className="absolute top-2 right-2 p-2 bg-black bg-opacity-20 text-white rounded-full hover:bg-opacity-30"
              title="Fechar banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls */}
        {showControls && visibleBanners.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-20 text-white rounded-full hover:bg-opacity-30"
              title="Banner anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-20 text-white rounded-full hover:bg-opacity-30"
              title="Próximo banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicators */}
        {showIndicators && visibleBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {visibleBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex
                    ? 'bg-white'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Ir para banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}