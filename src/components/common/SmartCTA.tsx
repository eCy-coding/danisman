import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const SmartCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  // Logic: Show after scrolling 300px, hide on Contact page
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't show on contact page or if dismissed
  if (location.pathname === '/contact' || isDismissed) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative group">
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -left-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Dismiss CTA"
        >
          <X size={12} />
        </button>

        <a
          href="/contact"
          data-testid="smart-cta-link"
          className="flex items-center space-x-3 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl hover:bg-black hover:scale-105 transition-all border border-gray-800"
        >
          <div className="relative">
            <Calendar className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </div>
          <div className="flex flex-col text-left leading-none">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              Available Now
            </span>
            <span className="font-bold text-sm">Book Discovery Call</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </a>
      </div>
    </div>
  );
};
