import { useAriaLive } from '@/hooks/useA11y';
import { useEffect, useState } from 'react';

interface AriaLiveProps {
  announcement: string;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

export function AriaLive({ announcement, priority = 'polite', delay = 0 }: AriaLiveProps) {
  const [delayedAnnouncement, setDelayedAnnouncement] = useState('');

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setDelayedAnnouncement(announcement);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setDelayedAnnouncement(announcement);
    }
  }, [announcement, delay]);

  useAriaLive(delayedAnnouncement, priority);

  return null;
}

interface AriaLiveRegionProps {
  id: string;
  priority?: 'polite' | 'assertive';
  className?: string;
  children?: React.ReactNode;
}

export function AriaLiveRegion({ id, priority = 'polite', className, children }: AriaLiveRegionProps) {
  return (
    <div
      id={id}
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className || ''}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </div>
  );
}