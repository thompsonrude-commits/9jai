export type SecurityRole = 'viewer' | 'editor' | 'admin' | 'agent' | 'service' | 'plugin' | 'connector' | 'device' | 'application';

export interface SecuritySubject {
  id: string;
  tenantId: string;
  roles?: SecurityRole[];
  attributes?: Record<string, unknown>;
}

export interface IdentityRecord {
  id: string;
  tenantId: string;
  roles: SecurityRole[];
  attributes?: Record<string, unknown>;
  disabled?: boolean;
}

export interface SessionRecord {
  id: string;
  subjectId: string;
  tenantId: string;
  valid: boolean;
  createdAt: number;
}

export interface PolicyDecision {
  allowed: boolean;
  policyVersion: string;
  reason: string;
  explanation?: string;
}

export interface PolicyEvaluationRequest {
  subject: SecuritySubject;
  action: string;
  resource: string;
  context?: Record<string, unknown>;
}

export interface AuditRecord {
  id: string;
  type: string;
  subjectId?: string;
  tenantId?: string;
  outcome: 'allow' | 'deny' | 'error';
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface TrustRecord {
  id: string;
  action: string;
  subjectId: string;
  outcome: 'allow' | 'deny' | 'error';
  reason?: string;
  timestamp: number;
}

export interface IdentityStore {
  createUser(identity: IdentityRecord): Promise<void>;
  getUser(id: string): Promise<IdentityRecord | undefined>;
  listUsers(): Promise<IdentityRecord[]>;
}

export interface AuthenticationService {
  authenticate(subject: SecuritySubject): Promise<SecuritySubject | null>;
  createSession(subject: SecuritySubject): Promise<SessionRecord>;
  revokeSession(sessionId: string): Promise<void>;
}

export interface AuthorizationService {
  authorize(subject: SecuritySubject, action: string, context?: Record<string, unknown>): Promise<boolean>;
}

export interface PolicyEngine {
  evaluate(request: PolicyEvaluationRequest): Promise<PolicyDecision>;
}

export interface SecretStore {
  storeSecret(scope: string, key: string, value: string): Promise<void>;
  getSecret(scope: string, key: string): Promise<string | undefined>;
  deleteSecret(scope: string, key: string): Promise<void>;
}

export interface EncryptionEngine {
  encrypt(scope: string, plaintext: string): Promise<string>;
  decrypt(scope: string, ciphertext: string): Promise<string>;
}

export interface AuditEngine {
  record(entry: Omit<AuditRecord, 'id' | 'timestamp'>): Promise<void>;
  list(): Promise<AuditRecord[]>;
}

export interface TrustLedger {
  record(entry: Omit<TrustRecord, 'id' | 'timestamp'>): Promise<void>;
  list(): Promise<TrustRecord[]>;
}

export interface TenantIsolationManager {
  isolate(input: { tenantId: string; subjectId: string }): boolean;
}

export interface SecuritySandbox {
  execute(input: { action: string; resource: string }): Promise<{ allowed: boolean; reason: string }>;
}
