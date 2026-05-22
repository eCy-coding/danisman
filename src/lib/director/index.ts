import { Scheduler } from './scheduler';
import DirectorWorker from '../../workers/director.worker?worker';
import { Logger } from '../logger';

class Director {
  private static instance: Director;
  private scheduler: Scheduler | null = null;
  private worker: Worker | null = null;
  private initialized = false; // Add initialized property

  private constructor() {}

  static getInstance(): Director {
    if (!Director.instance) {
      Director.instance = new Director();
    }
    return Director.instance;
  }

  init() {
    if (this.initialized) return; // Already initialized

    Logger.info('[Director] System Starting...');

    // Initialize Web Worker
    this.worker = new DirectorWorker();

    // Initialize Scheduler
    this.scheduler = new Scheduler(this.worker);
    this.scheduler.start();

    // Setup Worker Listener
    this.worker.onmessage = (e) => {
      const { type, payload } = e.data;
      Logger.debug(`[Director] Received from Worker: ${type}`, payload);
    };

    // Send Init Signal
    this.worker.postMessage({ type: 'INIT', payload: null });

    this.initialized = true;
    Logger.success('🎬 The Automatic Director is Online');

    // Expose for E2E Testing
    if (typeof window !== 'undefined') {
      window.__DIRECTOR__ = this;
    }
  }

  scheduleTask(
    type: 'ONE_TIME' | 'RECURRING',
    payload: Record<string, unknown>,
    delay: number = 0,
  ) {
    Logger.debug(`[Director] Scheduling task: ${type} in ${delay}ms`);
    if (!this.scheduler) {
      Logger.error('[Director] Scheduler not initialized');
      return;
    }

    this.scheduler.schedule({
      id: crypto.randomUUID(),
      type: type,
      priority: 5,
      executeAt: Date.now() + delay,
      payload: { type: 'RUN_RULES', payload }, // Ensure this matches Worker message structure
    });
  }
}

export const director = Director.getInstance();
