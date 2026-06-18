import React, { useEffect, useRef } from 'react';

interface JsonLdProps {
  data: Record<string, unknown>;
  /**
   * Optional dedup key. When set, JsonLd adopts an existing
   * `script[data-seo-id="<id>"]` (e.g. a static one baked into index.html)
   * and overwrites its content instead of appending a duplicate. Mirrors the
   * upsert convention used by SchemaOrg/SEO so prerender + client injection
   * don't stack duplicate schemas (M9). Adopted (not self-created) scripts are
   * left in place on unmount.
   */
  id?: string;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data, id }) => {
  const elRef = useRef<HTMLScriptElement | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    let el: HTMLScriptElement | null = id
      ? document.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`)
      : null;

    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-jsonld', 'true');
      if (id) el.setAttribute('data-seo-id', id);
      document.head.appendChild(el);
      createdRef.current = true;
    }
    el.textContent = JSON.stringify(data);
    elRef.current = el;

    return () => {
      // Only remove scripts WE created — never yank an adopted static/template
      // script (it must survive for no-JS crawlers / other consumers).
      if (createdRef.current && elRef.current?.parentNode) {
        elRef.current.parentNode.removeChild(elRef.current);
      }
      elRef.current = null;
      createdRef.current = false;
    };
  }, [data, id]);

  return null;
};
