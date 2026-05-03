/**
 * EcyPro Director — Personalization Engine
 *
 * Consumes analytics data from the SSE stream and triggers
 * UI personalization rules based on user behavior heuristics.
 */

import { RuleEngine, type Rule, type Action, type RuleContext } from './engine';
import { Logger } from '../logger';

// ─── Personalization Rules ───────────────────────────────

const PERSONALIZATION_RULES: Rule[] = [
  {
    id: 'high-engagement-upsell',
    name: 'High Engagement → Premium Upsell',
    priority: 10,
    conditions: [
      { field: 'pageViews', operator: 'GREATER_THAN', value: 5 },
      { field: 'sessionDuration', operator: 'GREATER_THAN', value: 120 },
    ],
    actions: [
      { type: 'NOTIFY', payload: { variant: 'premium-cta', message: 'Unlock Premium Features' } },
    ],
  },
  {
    id: 'returning-visitor-welcome',
    name: 'Returning Visitor Welcome',
    priority: 8,
    conditions: [
      { field: 'visitCount', operator: 'GREATER_THAN', value: 2 },
      { field: 'hasBooking', operator: 'EQUALS', value: false },
    ],
    actions: [
      { type: 'NOTIFY', payload: { variant: 'welcome-back', message: 'Welcome back! Schedule a free consultation.' } },
    ],
  },
  {
    id: 'pricing-page-exit-intent',
    name: 'Pricing Page Exit Intent → Discount',
    priority: 9,
    conditions: [
      { field: 'currentPage', operator: 'EQUALS', value: '/pricing' },
      { field: 'scrollDepth', operator: 'GREATER_THAN', value: 70 },
      { field: 'hasBooking', operator: 'EQUALS', value: false },
    ],
    actions: [
      { type: 'NOTIFY', payload: { variant: 'discount-popup', discount: 15, message: '15% off your first consultation!' } },
    ],
  },
  {
    id: 'long-idle-engagement',
    name: 'Long Idle → Re-engage',
    priority: 6,
    conditions: [
      { field: 'idleSeconds', operator: 'GREATER_THAN', value: 30 },
      { field: 'pageViews', operator: 'GREATER_THAN', value: 2 },
    ],
    actions: [
      { type: 'NOTIFY', payload: { variant: 'idle-prompt', message: 'Need help? Chat with our team.' } },
    ],
  },
  {
    id: 'contact-form-abandonment',
    name: 'Contact Form Abandonment Recovery',
    priority: 7,
    conditions: [
      { field: 'contactFormStarted', operator: 'EQUALS', value: true },
      { field: 'contactFormSubmitted', operator: 'EQUALS', value: false },
    ],
    actions: [
      { type: 'NOTIFY', payload: { variant: 'form-recovery', message: 'Complete your inquiry to get a free analysis.' } },
    ],
  },
];

// ─── Personalization Manager ─────────────────────────────

export type PersonalizationCallback = (actions: Action[]) => void;

export class PersonalizationEngine {
  private ruleEngine: RuleEngine;
  private executedRules = new Set<string>();
  private callback: PersonalizationCallback | null = null;

  constructor() {
    this.ruleEngine = new RuleEngine(PERSONALIZATION_RULES);
  }

  /**
   * Register a callback for when personalization actions fire
   */
  onAction(cb: PersonalizationCallback): void {
    this.callback = cb;
  }

  /**
   * Evaluate the current user context and trigger matching rules
   */
  evaluate(context: RuleContext): Action[] {
    const allActions = this.ruleEngine.evaluate(context);

    // Deduplicate: don't fire the same rule twice per session
    const newActions = allActions.filter((action) => {
      const key = `${action.type}:${JSON.stringify(action.payload)}`;
      if (this.executedRules.has(key)) return false;
      this.executedRules.add(key);
      return true;
    });

    if (newActions.length > 0) {
      Logger.info(`[Personalization] Triggered ${newActions.length} action(s)`);
      this.callback?.(newActions);
    }

    return newActions;
  }

  /**
   * Reset executed rules (e.g., on new session)
   */
  reset(): void {
    this.executedRules.clear();
    Logger.debug('[Personalization] Rules reset for new session');
  }
}

// Singleton export
export const personalization = new PersonalizationEngine();
