import { EventEmitter } from 'events';

export enum ConnectorLifecycleState {
  Uninitialized = 'uninitialized',
  Initialized = 'initialized',
  Authenticating = 'authenticating',
  Authenticated = 'authenticated',
  Registered = 'registered',
  Healthy = 'healthy',
  Degraded = 'degraded',
  Failed = 'failed',
  Shutdown = 'shutdown',
}

export interface ConnectorCapability {
  id: string;
  kind: 'action' | 'event' | 'stream';
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectorManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  capabilities: ConnectorCapability[];
  permissions: string[];
  supportedAuthTypes: string[];
  metadata?: Record<string, unknown>;
}

export interface ConnectorAuthRequest {
  method: string;
  config?: Record<string, unknown>;
}

export interface ConnectorAuthResult {
  authenticated: boolean;
  provider?: string;
  token?: string;
  expiresAt?: number;
  details?: Record<string, unknown>;
}

export interface ConnectorExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ConnectorHealthSnapshot {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  state: ConnectorLifecycleState;
  details?: Record<string, unknown>;
}

export interface ConnectorDefinition {
  manifest: ConnectorManifest;
  initialize?: () => Promise<void> | void;
  authenticate?: (request?: ConnectorAuthRequest) => Promise<ConnectorAuthResult> | ConnectorAuthResult;
  discoverCapabilities?: () => Promise<ConnectorCapability[] | ConnectorCapability> | ConnectorCapability[] | ConnectorCapability;
  validatePermissions?: () => Promise<boolean> | boolean;
  register?: () => Promise<void> | void;
  monitorHealth?: () => Promise<ConnectorHealthSnapshot> | ConnectorHealthSnapshot;
  executeAction?: (...args: unknown[]) => Promise<ConnectorExecutionResult> | ConnectorExecutionResult;
  shutdown?: () => Promise<void> | void;
}

export interface RegisteredConnector extends ConnectorDefinition {
  manifest: ConnectorManifest;
  state: ConnectorLifecycleState;
  lastHealth?: ConnectorHealthSnapshot;
}

export interface ConnectorRegistry {
  registerConnector(connector: RegisteredConnector): Promise<void>;
  unregisterConnector(connectorId: string): Promise<void>;
  getConnector(connectorId: string): Promise<RegisteredConnector | undefined>;
  listConnectors(): Promise<RegisteredConnector[]>;
  discoverCapabilities(connectorId: string): Promise<ConnectorCapability[]>;
  getHealth(connectorId: string): Promise<ConnectorHealthSnapshot | undefined>;
}

export interface CredentialVault {
  storeSecret(scope: string, key: string, value: string): Promise<void>;
  getSecret(scope: string, key: string): Promise<string | undefined>;
  deleteSecret(scope: string, key: string): Promise<void>;
  listSecrets(scope: string): Promise<string[]>;
}

export interface SecretProvider {
  getSecret(scope: string, key: string): Promise<string | undefined>;
  storeSecret(scope: string, key: string, value: string): Promise<void>;
}

export interface AuthenticationManager {
  authenticate(connectorId: string, request: ConnectorAuthRequest): Promise<ConnectorAuthResult>;
  refreshToken(connectorId: string): Promise<ConnectorAuthResult>;
  rotateCredential(connectorId: string, key: string, newValue: string): Promise<boolean>;
}

export interface WebhookDefinition {
  id: string;
  name: string;
  targetUrl: string;
  secret?: string;
  events: string[];
  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface IncomingWebhookEvent {
  id: string;
  type: string;
  payload: unknown;
  signature?: string;
  secret?: string;
  expectedSignature?: string;
}

export interface WebhookEngine {
  registerWebhook(definition: WebhookDefinition): Promise<void>;
  subscribe(eventType: string, handler: (event: IncomingWebhookEvent) => Promise<void> | void): Promise<void>;
  processIncomingWebhook(event: IncomingWebhookEvent): Promise<boolean>;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export interface RetryManager {
  execute<T>(operation: () => Promise<T> | T): Promise<T>;
}

export interface CircuitBreakerManager {
  recordFailure(key: string): Promise<void>;
  recordSuccess(key: string): Promise<void>;
  getState(key: string): Promise<'closed' | 'open' | 'half-open'> | 'closed' | 'open' | 'half-open';
}

export interface HealthMonitoringEngine {
  recordOutcome(connectorId: string, outcome: { success: boolean; latencyMs: number; errorCount: number }): ConnectorHealthSnapshot;
  getSnapshot(connectorId: string): ConnectorHealthSnapshot | undefined;
}

export interface ConnectionPoolManager {
  acquire(key: string): Promise<unknown>;
  release(key: string, resource: unknown): Promise<void>;
}

export interface RateLimitingEngine {
  allow(key: string): boolean;
}

export interface ApiGateway {
  registerRoute(path: string, handler: (request: unknown) => Promise<unknown> | unknown): void;
  route(request: unknown): Promise<unknown>;
}

export interface DiagnosticsInterface {
  getDiagnostics(connectorId: string): Record<string, unknown>;
}

export interface MetricsCollector {
  recordMetric(name: string, value: number): void;
  getMetrics(): Record<string, number>;
}

export const connectorEvents = new EventEmitter();
