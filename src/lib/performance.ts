/**
 * EcyPro — Performance Resource Hints
 *
 * Dynamically injects preload, prefetch, and preconnect hints
 * to improve loading performance and Lighthouse scores.
 */

// ─── Critical Resource Preloading ────────────────────────
// Fonts are self-hosted via @fontsource — no CDN preconnect needed.

/**
 * Inject resource hints into <head>
 */
export function injectResourceHints(): void {
  // DNS prefetch for API
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      const apiOrigin = new URL(apiUrl).origin;
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${apiOrigin}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = apiOrigin;
        document.head.appendChild(link);
      }
    } catch {
      // Invalid URL — skip
    }
  }
}

/**
 * Prefetch non-critical routes on idle
 */
export function prefetchRoutes(): void {
  const routes = ['/services', '/about', '/contact', '/case-studies', '/pricing'];

  const prefetch = () => {
    for (const route of routes) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    }
  };

  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(prefetch);
  } else {
    setTimeout(prefetch, 3000);
  }
}

/**
 * Lazy load images with IntersectionObserver
 */
export function setupLazyImages(): void {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          }
          observer.unobserve(img);
        }
      }
    },
    {
      rootMargin: '200px',
      threshold: 0.01,
    }
  );

  // Observe all images with data-src
  const lazyImages = document.querySelectorAll('img[data-src]');
  lazyImages.forEach((img) => observer.observe(img));
}

/**
 * Initialize all performance optimizations
 */
export function initPerformance(): void {
  // Immediate: resource hints
  injectResourceHints();

  // Deferred: route prefetching + lazy images
  if (document.readyState === 'complete') {
    prefetchRoutes();
    setupLazyImages();
  } else {
    window.addEventListener('load', () => {
      prefetchRoutes();
      setupLazyImages();
    });
  }
}
