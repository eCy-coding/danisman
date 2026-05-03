import { useCallback } from 'react';

export const useScrollToSection = () => {
  const scrollToSection = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string) => {
      e.preventDefault();

      // Remove the '#' if present
      const elementId = id.startsWith('#') ? id.substring(1) : id;
      const element = document.getElementById(elementId);

      if (element) {
        // Offset for fixed header (approx 96px for desktop, 80px for mobile)
        const headerOffset = 96;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });

        // Update URL hash without jumping
        window.history.pushState(null, '', `#${elementId}`);
      }
    },
    [],
  );

  return scrollToSection;
};
