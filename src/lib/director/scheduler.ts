import { DirectorMessage } from '../../workers/director.worker';
import { Logger } from '../logger';

export interface Task {
  id: string;
  type: 'ONE_TIME' | 'RECURRING';
  priority: number; // Higher is better
  executeAt: number; // Timestamp
  interval?: number; // ms for recurring
  payload: DirectorMessage;
}

export class TaskQueue {
  private queue: Task[] = [];

  addTask(task: Task) {
    this.queue.push(task);
    this.sortQueue();
  }

  popNextTask(): Task | null {
    if (this.queue.length === 0) return null;

    const now = Date.now();
    // Check if the highest priority task is ready to run
    const nextTask = this.queue[0];
    if (nextTask && nextTask.executeAt <= now) {
      return this.queue.shift() || null;
    }
    return null;
  }

  // Peek for debugging/UI
  peek(): Task[] {
    return this.queue;
  }

  private sortQueue() {
    this.queue.sort((a, b) => {
      // Primary Sort: Execution Time (Ascending - Sooner first)
      if (Math.abs(a.executeAt - b.executeAt) > 100) {
        // Tolerance for "same time"
        return a.executeAt - b.executeAt;
      }
      // Secondary Sort: Priority (Descending - Higher first)
      return b.priority - a.priority;
    });
  }
}

export class Scheduler {
  private queue: TaskQueue;
  private worker: Worker;
  private isRunning = false;
  private tickInterval: number = 1000; // 1 second
  // P26 — when the queue is empty the scheduler "parks" itself: no more
  // setTimeout(tick, 1s) chain. Previously the recursive tick ran forever and
  // kept the main thread busy every 1 s, which prevented Lighthouse's
  // waitForCPUIdle gate from ever resolving on /services (PAGE_HUNG across
  // P22–P25). schedule() and the RECURRING branch re-arm the loop.
  private parked = true;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(worker: Worker) {
    this.queue = new TaskQueue();
    this.worker = worker;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.armNextTick(0);
  }

  stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.parked = true;
  }

  schedule(task: Task) {
    this.queue.addTask(task);
    // Re-arm the loop if it was parked.
    if (this.isRunning && this.parked) {
      this.armNextTick(this.delayUntilNext());
    }
  }

  private delayUntilNext(): number {
    const tasks = this.queue.peek();
    if (tasks.length === 0) return this.tickInterval;
    const nextAt = tasks[0]?.executeAt ?? Date.now();
    return Math.max(0, nextAt - Date.now());
  }

  private armNextTick(delay: number) {
    if (this.timerId !== null) clearTimeout(this.timerId);
    this.parked = false;
    this.timerId = setTimeout(() => this.tick(), delay);
  }

  private tick() {
    this.timerId = null;
    if (!this.isRunning) {
      this.parked = true;
      return;
    }

    const task = this.queue.popNextTask();
    if (task) {
      Logger.info(`[Scheduler] Executing task: ${task.id}`);
      this.worker.postMessage(task.payload);

      // Handle recurrence
      if (task.type === 'RECURRING' && task.interval) {
        const nextTask = { ...task, executeAt: Date.now() + task.interval };
        this.queue.addTask(nextTask);
      }
    }

    // Park when no work is pending — release the main thread so Lighthouse
    // can detect CPU idle. Wake up on schedule() or RECURRING re-queue.
    if (this.queue.peek().length === 0) {
      this.parked = true;
      return;
    }
    this.armNextTick(this.delayUntilNext());
  }
}
