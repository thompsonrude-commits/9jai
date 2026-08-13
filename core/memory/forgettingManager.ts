import { defaultLongTermMemory } from './longTermMemory';

export class ForgettingManager {
  async expireByTime() {
    const now = Date.now();
    // scan all users
    // (inefficient in-memory scan – replace with DB queries in production)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (defaultLongTermMemory as any).store.forEach((arr: any[], userId: string) => {
      const keep = arr.filter(r => !r.expiresAt || r.expiresAt > now);
      (defaultLongTermMemory as any).store.set(userId, keep);
    });
    return true;
  }

  async deleteMemory(userId: string, id: string) {
    return defaultLongTermMemory.delete(userId, id);
  }
}

export const defaultForgetting = new ForgettingManager();
