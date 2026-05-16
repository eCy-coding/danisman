/**
 * EcyPro Director — Analytics Consumer
 *
 * Bridges the analytics tracking layer with the Director's
 * personalization engine, building a real-time user context
 * from browser events and SSE metrics.
 */

import { personalization } from './personalization';
import type { RuleContext } from './engine';
import { Logger } from '../logger';

// ─── User Context State ──────────────────────────────────

interface UserContext {
  pageViews: number;
  sessionDuration: number;
  visitCount: number;
  hasBooking: boolean;
  currentPage: string;
  scrollDepth: number;
  idleSeconds: number;
  contactFormStarted: boolean;
  contactFormSubmitted: boolean;
  lastActivity: number;
}



function getStoredVisitCount(): number {
  try {
    const stored = localStorage.getItem('ecypro-visit-count');
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function incrementVisitCount(): void {
  try {
    const count = getStoredVisitCount() + 1;
    localStorage.setItem('ecypro-visit-count', String(count));
  } catch {
    // ignore
  }
}

// ─── Analytics Consumer ──────────────────────────────────

export class AnalyticsConsumer {
  private context: UserContext;
  private idleTimer: ReturnType<typeof setInterval> | null = null;
  private evaluationTimer: ReturnType<typeof setInterval> | null = null;
  private sessionStart: number;
  private isRunning = false;
  // P8 — replace MutationObserver(document.body, subtree:true) with History API
  // patch + popstate. The original observer fired on every DOM mutation during
  // hydration (200+ events for ServicesPage's 29 cards) which contributed to
  // Lighthouse PAGE_HUNG on /services under Slow 4G + 4× CPU throttling.
  private pageChangePollTimer: ReturnType<typeof setInterval> | null = null;
  private originalPushState: typeof history.pushState | null = null;
  private originalReplaceState: typeof history.replaceState | null = null;
  private popstateHandler: (() => void) | null = null;
  // P14 — track all window/document handlers so stop() can detach them.
  // Previously: trackScroll/trackIdle/trackContactForm leaked 6 listeners.
  private scrollHandler: (() => void) | null = null;
  private idleResetHandler: (() => void) | null = null;
  private focusInHandler: ((e: FocusEvent) => void) | null = null;
  private submitHandler: ((e: SubmitEvent) => void) | null = null;

  constructor() {
    incrementVisitCount();
    this.sessionStart = Date.now();
    this.context = {
      pageViews: 0,
      sessionDuration: 0,
      visitCount: getStoredVisitCount(),
      hasBooking: false,
      currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
      scrollDepth: 0,
      idleSeconds: 0,
      contactFormStarted: false,
      contactFormSubmitted: false,
      lastActivity: Date.now(),
    };
  }

  /**
   * Start tracking user behavior
   */
  start(): void {
    if (this.isRunning || typeof window === 'undefined') return;
    this.isRunning = true;

    Logger.info('[AnalyticsConsumer] Started tracking');

    // Track page changes
    this.trackPageViews();

    // Track scroll depth
    this.trackScroll();

    // Track idle time
    this.trackIdle();

    // Track contact form interaction
    this.trackContactForm();

    // Evaluate rules every 10 seconds
    this.evaluationTimer = setInterval(() => {
      this.context.sessionDuration = Math.floor((Date.now() - this.sessionStart) / 1000);
      this.evaluateRules();
    }, 10_000);
  }

  /**
   * Stop all tracking
   */
  stop(): void {
    this.isRunning = false;
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
    if (this.pageChangePollTimer) {
      clearInterval(this.pageChangePollTimer);
      this.pageChangePollTimer = null;
    }
    // Restore History API
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
      this.originalPushState = null;
    }
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }
    // P14 — detach scroll/idle/form listeners so HMR or repeated start() doesn't accumulate.
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    if (this.idleResetHandler) {
      window.removeEventListener('mousemove', this.idleResetHandler);
      window.removeEventListener('keydown', this.idleResetHandler);
      window.removeEventListener('touchstart', this.idleResetHandler);
      this.idleResetHandler = null;
    }
    if (this.focusInHandler) {
      document.removeEventListener('focusin', this.focusInHandler);
      this.focusInHandler = null;
    }
    if (this.submitHandler) {
      document.removeEventListener('submit', this.submitHandler);
      this.submitHandler = null;
    }
    Logger.debug('[AnalyticsConsumer] Stopped');
  }

  /**
   * Track page view changes via History API + popstate.
   *
   * P8 hotfix: previously used MutationObserver(document.body, {subtree:true})
   * which fired on every DOM mutation during hydration. On ServicesPage with
   * 29 motion-cards this produced 200+ mutation records → Lighthouse PAGE_HUNG
   * under Slow 4G + 4× CPU throttling (CPU idle gate never reached).
   *
   * The History API approach hooks the same SPA navigation events React Router
   * uses internally (pushState/replaceState/popstate) — zero DOM observation.
   */
  private trackPageViews(): void {
    // Initial page view
    this.context.pageViews++;
    this.context.currentPage = window.location.pathname;

    const checkPathChange = () => {
      const newPath = window.location.pathname;
      if (newPath !== this.context.currentPage) {
        this.context.currentPage = newPath;
        this.context.pageViews++;
        this.context.scrollDepth = 0; // Reset scroll on page change
        Logger.debug(`[AnalyticsConsumer] Page: ${newPath} (views: ${this.context.pageViews})`);
      }
    };

    // Patch history.pushState / replaceState — React Router calls these for
    // every client-side navigation. We restore them in stop().
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;

    const originalPush = this.originalPushState;
    const originalReplace = this.originalReplaceState;
    history.pushState = (...args: Parameters<History['pushState']>) => {
      originalPush.apply(history, args);
      queueMicrotask(checkPathChange);
    };
    history.replaceState = (...args: Parameters<History['replaceState']>) => {
      originalReplace.apply(history, args);
      queueMicrotask(checkPathChange);
    };

    // Browser back/forward
    this.popstateHandler = checkPathChange;
    window.addEventListener('popstate', this.popstateHandler);
  }

  /**
   * Track maximum scroll depth
   */
  private trackScroll(): void {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      this.context.scrollDepth = Math.max(this.context.scrollDepth, depth);
      this.context.lastActivity = Date.now();
      this.context.idleSeconds = 0;
    };

    this.scrollHandler = handler;
    window.addEventListener('scroll', handler, { passive: true });
  }

  /**
   * Track idle time
   */
  private trackIdle(): void {
    // Reset idle on any interaction
    const resetIdle = () => {
      this.context.idleSeconds = 0;
      this.context.lastActivity = Date.now();
    };

    this.idleResetHandler = resetIdle;
    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });

    // Increment idle counter
    this.idleTimer = setInterval(() => {
      this.context.idleSeconds = Math.floor((Date.now() - this.context.lastActivity) / 1000);
    }, 1000);
  }

  /**
   * Track contact form interactions
   */
  private trackContactForm(): void {
    // Watch for focus on contact form fields
    this.focusInHandler = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('#contact') || target.closest('[data-contact-form]')) {
        this.context.contactFormStarted = true;
      }
    };
    document.addEventListener('focusin', this.focusInHandler);

    // Watch for form submission
    this.submitHandler = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form) return;
      if (form.closest('#contact') || form.hasAttribute('data-contact-form')) {
        this.context.contactFormSubmitted = true;
      }
    };
    document.addEventListener('submit', this.submitHandler);
  }

  /**
   * Evaluate personalization rules against current context
   */
  private evaluateRules(): void {
    const ruleContext: RuleContext = {
      pageViews: this.context.pageViews,
      sessionDuration: this.context.sessionDuration,
      visitCount: this.context.visitCount,
      hasBooking: this.context.hasBooking,
      currentPage: this.context.currentPage,
      scrollDepth: this.context.scrollDepth,
      idleSeconds: this.context.idleSeconds,
      contactFormStarted: this.context.contactFormStarted,
      contactFormSubmitted: this.context.contactFormSubmitted,
    };

    personalization.evaluate(ruleContext);
  }

  /**
   * Update external context (e.g., booking status from API)
   */
  updateContext(partial: Partial<UserContext>): void {
    Object.assign(this.context, partial);
  }

  /**
   * Get current context snapshot
   */
  getContext(): Readonly<UserContext> {
    return { ...this.context };
  }
}

// Singleton
export const analyticsConsumer = new AnalyticsConsumer();
