export class PriorityManager {
  // Lower numeric value => higher priority
  private priorities: Map<string, number> = new Map();

  constructor(defaults?: Record<string, number>) {
    if (defaults) {
      for (const k of Object.keys(defaults)) this.priorities.set(k, defaults[k]);
    }
  }

  getPriority(type: string, fallback = 100): number {
    return this.priorities.get(type) ?? fallback;
  }

  setPriority(type: string, value: number) {
    this.priorities.set(type, value);
  }

  getAll() {
    return Object.fromEntries(this.priorities.entries());
  }
}
