import React, { useEffect, useRef } from 'react';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  const elRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!elRef.current) {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-jsonld', 'true');
      document.head.appendChild(el);
      elRef.current = el;
    }
    elRef.current.textContent = JSON.stringify(data);

    return () => {
      if (elRef.current?.parentNode) {
        elRef.current.parentNode.removeChild(elRef.current);
        elRef.current = null;
      }
    };
  }, [data]);

  return null;
};
