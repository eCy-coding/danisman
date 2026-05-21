/**
 * eCyPro — Toast Notification Manager
 *
 * Bridges the Personalization Engine with Sonner toast notifications.
 * Each personalization variant maps to a specific toast style.
 */

import { toast } from 'sonner';
import type { Action } from '../director/engine';

// ─── Variant → Toast Mapping ─────────────────────────────

interface NotifyPayload {
  variant: string;
  message: string;
  discount?: number;
}

const VARIANT_ICONS: Record<string, string> = {
  'premium-cta': '💎',
  'welcome-back': '👋',
  'discount-popup': '🎁',
  'idle-prompt': '💬',
  'form-recovery': '📋',
};

const VARIANT_STYLES: Record<string, { duration: number; position: 'top-right' | 'bottom-right' }> =
  {
    'premium-cta': { duration: 8000, position: 'bottom-right' },
    'welcome-back': { duration: 6000, position: 'top-right' },
    'discount-popup': { duration: 10000, position: 'bottom-right' },
    'idle-prompt': { duration: 7000, position: 'bottom-right' },
    'form-recovery': { duration: 9000, position: 'bottom-right' },
  };

/**
 * Show a personalization toast from a Director action
 */
export function showPersonalizationToast(action: Action): void {
  const payload = action.payload as unknown as NotifyPayload | undefined;
  if (!payload?.message) return;

  const icon = VARIANT_ICONS[payload.variant] || '✨';
  const style = VARIANT_STYLES[payload.variant] || {
    duration: 6000,
    position: 'bottom-right' as const,
  };

  const title = getVariantTitle(payload.variant);
  const description = payload.message;

  toast(title, {
    description,
    icon,
    duration: style.duration,
    action: getVariantAction(payload.variant),
    className: 'ecypro-director-toast',
  });
}

/**
 * Map variant to human-readable title
 */
function getVariantTitle(variant: string): string {
  const titles: Record<string, string> = {
    'premium-cta': 'Premium Opportunity',
    'welcome-back': 'Welcome Back',
    'discount-popup': 'Special Offer',
    'idle-prompt': 'Need Assistance?',
    'form-recovery': 'Complete Your Inquiry',
  };
  return titles[variant] || 'eCyPro Update';
}

/**
 * Get CTA button for specific variants
 */
function getVariantAction(variant: string): { label: string; onClick: () => void } | undefined {
  const actions: Record<string, { label: string; onClick: () => void }> = {
    'premium-cta': {
      label: 'Explore Premium',
      onClick: () => {
        window.location.hash = '#pricing';
      },
    },
    'welcome-back': {
      label: 'Book Now',
      onClick: () => {
        window.location.hash = '#contact';
      },
    },
    'discount-popup': {
      label: 'Claim 15% Off',
      onClick: () => {
        window.location.hash = '#contact';
      },
    },
    'idle-prompt': {
      label: 'Start Chat',
      onClick: () => {
        window.location.hash = '#contact';
      },
    },
    'form-recovery': {
      label: 'Continue',
      onClick: () => {
        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
  };
  return actions[variant];
}

/**
 * Batch process Director actions → toasts
 */
export function processDirectorActions(actions: Action[]): void {
  let delay = 0;
  for (const action of actions) {
    if (action.type === 'NOTIFY') {
      // Stagger toasts by 800ms
      setTimeout(() => showPersonalizationToast(action), delay);
      delay += 800;
    }
  }
}
