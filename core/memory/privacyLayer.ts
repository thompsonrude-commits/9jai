import { MemoryRecord } from './types';

export class PrivacyLayer {
  async checkOwnership(userId: string, record: MemoryRecord) {
    return record.userId === userId;
  }

  // encryption hooks - no-op placeholders
  async encrypt(record: MemoryRecord) { return record; }
  async decrypt(record: MemoryRecord) { return record; }
}

export const defaultPrivacyLayer = new PrivacyLayer();
