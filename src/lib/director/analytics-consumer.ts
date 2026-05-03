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
    if (this.idleTimer) clearInterval(this.idleTimer);
    if (this.evaluationTimer) clearInterval(this.evaluationTimer);
    Logger.debug('[AnalyticsConsumer] Stopped');
  }

  /**
   * Track page view changes
   */
  private trackPageViews(): void {
    // Initial page view
    this.context.pageViews++;
    this.context.currentPage = window.location.pathname;

    // Listen for route changes (SPA)
    const observer = new MutationObserver(() => {
      const newPath = window.location.pathname;
      if (newPath !== this.context.currentPage) {
        this.context.currentPage = newPath;
        this.context.pageViews++;
        this.context.scrollDepth = 0; // Reset scroll on page change
        Logger.debug(`[AnalyticsConsumer] Page: ${newPath} (views: ${this.context.pageViews})`);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
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
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('#contact') || target.closest('[data-contact-form]')) {
        this.context.contactFormStarted = true;
      }
    });

    // Watch for form submission
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      if (form.closest('#contact') || form.hasAttribute('data-contact-form')) {
        this.context.contactFormSubmitted = true;
      }
    });
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
