import { useSkipLinks } from '@/hooks/useA11y';
import { useEffect } from 'react';

interface SkipLinkProps {
  id: string;
  text: string;
  target: string;
}

export function SkipLinks() {
  const { skipLinks } = useSkipLinks();

  const handleSkipLinkClick = (target: string) => {
    const targetElement = document.querySelector(target);
    if (targetElement) {
      targetElement.setAttribute('tabindex', '-1');
      (targetElement as HTMLElement).focus();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Remove tabindex após o foco
      setTimeout(() => {
        targetElement.removeAttribute('tabindex');
      }, 1000);
    }
  };

  if (skipLinks.length === 0) return null;

  return (
    <div className="skip-links" aria-label="Links de navegação rápida">
      {skipLinks.map((link) => (
        <a
          key={link.id}
          href={link.target}
          className="skip-link"
          onClick={(e) => {
            e.preventDefault();
            handleSkipLinkClick(link.target);
          }}
        >
          {link.text}
        </a>
      ))}
      
      <style jsx>{`
        .skip-links {
          position: absolute;
          top: -100px;
          left: 0;
          z-index: 9999;
        }
        
        .skip-link {
          position: absolute;
          top: 0;
          left: 0;
          background: #DC2626;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 0 0 4px 0;
          font-weight: 600;
        }
        
        .skip-link:focus {
          top: 100px;
          outline: 2px solid #B91C1C;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export function SkipLink({ id, text, target }: SkipLinkProps) {
  const { addSkipLink, removeSkipLink } = useSkipLinks();

  useEffect(() => {
    addSkipLink(id, text, target);
    return () => removeSkipLink(id);
  }, [id, text, target, addSkipLink, removeSkipLink]);

  return null;
}