import { createHash } from 'crypto';
import type { IdentityRecord, IdentityStore, SecuritySubject, SessionRecord } from './types';

export class InMemoryIdentityStore implements IdentityStore {
  private identities = new Map<string, IdentityRecord>();

  async createUser(identity: IdentityRecord): Promise<void> {
    this.identities.set(identity.id, { ...identity });
  }

  async getUser(id: string): Promise<IdentityRecord | undefined> {
    return this.identities.get(id);
  }

  async listUsers(): Promise<IdentityRecord[]> {
    return Array.from(this.identities.values());
  }
}

export class DefaultAuthenticationService {
  constructor(private readonly identities: IdentityStore) {}

  async authenticate(subject: SecuritySubject): Promise<SecuritySubject | null> {
    const record = await this.identities.getUser(subject.id);
    if (!record || record.disabled || record.tenantId !== subject.tenantId) {
      return null;
    }
    return { ...subject, roles: record.roles, attributes: { ...(record.attributes ?? {}), ...(subject.attributes ?? {}) } };
  }

  async createSession(subject: SecuritySubject): Promise<SessionRecord> {
    const authenticated = await this.authenticate(subject);
    if (!authenticated) {
      throw new Error(`Authentication failed for ${subject.id}`);
    }
    return {
      id: createHash('sha256').update(`${subject.id}:${subject.tenantId}`).digest('hex'),
      subjectId: subject.id,
      tenantId: subject.tenantId,
      valid: true,
      createdAt: Date.now(),
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    void sessionId;
  }
}
