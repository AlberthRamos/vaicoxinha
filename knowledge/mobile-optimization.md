# Mobile Optimization Guide - Vai Coxinha PWA

## Performance Optimization

### 1. Bundle Size Optimization
```javascript
// next.config.js - Bundle splitting
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};
```

### 2. Image Optimization
```javascript
// Image component with lazy loading
import Image from 'next/image';

const OptimizedImage = ({ src, alt, priority = false }) => (
  <Image
    src={src}
    alt={alt}
    width={400}
    height={300}
    loading={priority ? 'eager' : 'lazy'}
    placeholder="blur"
    blurDataURL="data:image/webp;base64,..."
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    quality={85}
  />
);
```

### 3. Critical CSS
```javascript
// Inline critical CSS
const criticalCSS = `
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; }
  .header { background: #ff6b35; color: white; padding: 1rem; }
  .btn-primary { background: #ff6b35; color: white; border: none; padding: 0.75rem 1.5rem; }
`;

export const CriticalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
);
```

## Network Optimization

### 1. Service Worker Caching
```javascript
// service-worker.js
const CACHE_NAME = 'vai-coxinha-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(() => caches.match('/offline.html'))
  );
});
```

### 2. Resource Hints
```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/main-font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/css/critical.css" as="style">
<link rel="dns-prefetch" href="https://api.vai-coxinha.com">
<link rel="preconnect" href="https://fonts.googleapis.com">

<!-- Prefetch next page resources -->
<link rel="prefetch" href="/menu">
<link rel="prefetch" href="/order">
```

### 3. Network Adaptation
```javascript
// Network-aware loading
const NetworkAwareLoader = () => {
  const [connection, setConnection] = useState(null);
  
  useEffect(() => {
    if ('connection' in navigator) {
      setConnection(navigator.connection);
      
      const updateConnection = () => setConnection(navigator.connection);
      navigator.connection.addEventListener('change', updateConnection);
      
      return () => {
        navigator.connection.removeEventListener('change', updateConnection);
      };
    }
  }, []);
  
  const getImageQuality = () => {
    if (!connection) return 85;
    
    switch (connection.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 50;
      case '3g':
        return 70;
      case '4g':
      default:
        return 85;
    }
  };
  
  return { connection, getImageQuality };
};
```

## Touch and Gesture Optimization

### 1. Touch Target Sizing
```css
/* Touch-friendly button sizes */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
  margin: 8px;
}

/* Prevent zoom on double tap */
.no-zoom {
  touch-action: manipulation;
}

/* Smooth scrolling */
.smooth-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
```

### 2. Gesture Recognition
```javascript
// Swipe gesture detection
const useSwipeGesture = (onSwipeLeft, onSwipeRight) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      onSwipeLeft();
    }
    
    if (isRightSwipe) {
      onSwipeRight();
    }
  };
  
  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};
```

## Battery and Resource Optimization

### 1. Background Sync
```javascript
// Background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  const orders = await getOfflineOrders();
  
  for (const order of orders) {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      
      await removeOfflineOrder(order.id);
    } catch (error) {
      console.error('Failed to sync order:', error);
    }
  }
}
```

### 2. CPU Throttling Detection
```javascript
// Detect CPU throttling
const detectCPUThrottling = () => {
  const start = performance.now();
  let iterations = 0;
  
  while (performance.now() - start < 100) {
    // Perform some calculations
    Math.sqrt(Math.random() * 1000000);
    iterations++;
  }
  
  const end = performance.now();
  const timeTaken = end - start;
  const iterationsPerMs = iterations / timeTaken;
  
  // If performance is poor, reduce animations
  if (iterationsPerMs < 100) {
    document.body.classList.add('reduce-motion');
  }
};
```

### 3. Memory Management
```javascript
// Memory-efficient image loading
const MemoryEfficientImage = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const imageRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
    
    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (isVisible) {
      setImageSrc(src);
    }
  }, [isVisible, src]);
  
  return (
    <div ref={imageRef} style={{ minHeight: '200px' }}>
      {imageSrc && <img src={imageSrc} alt={alt} loading="lazy" />}
    </div>
  );
};
```

## Offline Functionality

### 1. Offline Menu Cache
```javascript
// Cache menu data offline
const cacheMenuData = async () => {
  try {
    const response = await fetch('/api/menu');
    const menuData = await response.json();
    
    // Store in IndexedDB
    const db = await openDB('vai-coxinha-cache', 1);
    await db.put('menu', menuData, 'current');
    
    // Also cache in localStorage as backup
    localStorage.setItem('cached-menu', JSON.stringify(menuData));
  } catch (error) {
    console.error('Failed to cache menu:', error);
  }
};
```

### 2. Offline Order Queue
```javascript
// Offline order management
const OfflineOrderManager = () => {
  const [offlineOrders, setOfflineOrders] = useState([]);
  
  const addOfflineOrder = async (order) => {
    const orderWithTimestamp = {
      ...order,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'pending-sync'
    };
    
    const db = await openDB('vai-coxinha-orders', 1);
    await db.put('orders', orderWithTimestamp, orderWithTimestamp.id);
    
    setOfflineOrders(prev => [...prev, orderWithTimestamp]);
    
    // Register background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-orders');
      });
    }
  };
  
  return { addOfflineOrder, offlineOrders };
};
```

## Mobile-Specific Features

### 1. App Installation Prompt
```javascript
// PWA installation prompt
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('App installed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };
  
  return showPrompt ? (
    <div className="install-prompt">
      <p>Install Vai Coxinha for better experience!</p>
      <button onClick={installApp}>Install</button>
      <button onClick={() => setShowPrompt(false)}>Later</button>
    </div>
  ) : null;
};
```

### 2. Vibration Feedback
```javascript
// Haptic feedback
const HapticFeedback = () => {
  const vibrate = (pattern = [50]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
  
  const successFeedback = () => vibrate([50, 30, 50]);
  const errorFeedback = () => vibrate([100, 50, 100]);
  const lightFeedback = () => vibrate([20]);
  
  return { vibrate, successFeedback, errorFeedback, lightFeedback };
};
```

### 3. Device Orientation
```javascript
// Orientation-aware layout
const OrientationHandler = () => {
  const [orientation, setOrientation] = useState('portrait');
  
  useEffect(() => {
    const handleOrientationChange = () => {
      const angle = screen.orientation.angle;
      setOrientation(angle === 90 || angle === 270 ? 'landscape' : 'portrait');
    };
    
    screen.orientation.addEventListener('change', handleOrientationChange);
    handleOrientationChange();
    
    return () => {
      screen.orientation.removeEventListener('change', handleOrientationChange);
    };
  }, []);
  
  return orientation;
};
```

## Performance Metrics

### 1. Core Web Vitals Monitoring
```javascript
// Monitor Core Web Vitals
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Send metrics to analytics
const sendToAnalytics = (metric) => {
  // Send to your analytics service
  window.gtag('event', metric.name, {
    value: Math.round(metric.value),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
  });
};
```

### 2. Performance Budget
```javascript
// Performance budget configuration
const performanceBudget = {
  // Bundle size limits (KB)
  javascript: 200,
  css: 50,
  images: 300,
  fonts: 50,
  
  // Timing budgets (ms)
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  firstInputDelay: 100,
  cumulativeLayoutShift: 0.1,
  
  // Network budgets
  totalRequests: 50,
  apiRequests: 10
};
```

## Testing Strategy

### 1. Device Testing Matrix
```javascript
// Test devices configuration
const testDevices = [
  { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'Samsung Galaxy S20', width: 360, height: 800, deviceScaleFactor: 3 },
  { name: 'iPad', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'Desktop', width: 1920, height: 1080, deviceScaleFactor: 1 }
];
```

### 2. Network Throttling
```javascript
// Network throttling for testing
const networkProfiles = {
  'slow-2g': {
    offline: false,
    downloadThroughput: 250 * 1024 / 8,
    uploadThroughput: 250 * 1024 / 8,
    latency: 2000
  },
  '2g': {
    offline: false,
    downloadThroughput: 450 * 1024 / 8,
    uploadThroughput: 150 * 1024 / 8,
    latency: 1500
  },
  '3g': {
    offline: false,
    downloadThroughput: 1.6 * 1024 * 1024 / 8,
    uploadThroughput: 750 * 1024 / 8,
    latency: 562
  },
  '4g': {
    offline: false,
    downloadThroughput: 9 * 1024 * 1024 / 8,
    uploadThroughput: 9 * 1024 * 1024 / 8,
    latency: 170
  }
};
```

## Deployment Checklist

### Pre-deployment
- [ ] Test on multiple devices
- [ ] Verify offline functionality
- [ ] Check performance on slow networks
- [ ] Validate PWA manifest
- [ ] Test service worker
- [ ] Verify security headers

### Post-deployment
- [ ] Monitor Core Web Vitals
- [ ] Check error rates
- [ ] Verify analytics data
- [ ] Test payment flow
- [ ] Validate push notifications
- [ ] Monitor crash reports