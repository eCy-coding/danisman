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
      if (Math.abs(a.executeAt - b.executeAt) > 100) { // Tolerance for "same time"
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

  constructor(worker: Worker) {
    this.queue = new TaskQueue();
    this.worker = worker;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
  }

  stop() {
    this.isRunning = false;
  }

  schedule(task: Task) {
    this.queue.addTask(task);
  }

  private tick() {
    if (!this.isRunning) return;

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

    setTimeout(() => this.tick(), this.tickInterval);
  }
}
