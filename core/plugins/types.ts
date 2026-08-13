export type PluginState =
  | 'registered'
  | 'initializing'
  | 'initialized'
  | 'starting'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'disabled'
  | 'unknown';

export type CompatibilityLevel = 'compatible' | 'incompatible' | 'deprecated';

export interface PluginDependency {
  pluginId: string;
  versionRange: string;
  optional?: boolean;
}

export interface PluginDescriptor {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  capabilities: string[];
  capabilityDescriptors?: import('../capabilities/CapabilityRegistry').CapabilityDescriptor[];
  dependencies?: PluginDependency[];
  permissions?: string[];
  signature?: string;
  healthCheck?: () => Promise<PluginHealth>;
  initialize?: (context: PluginContext) => Promise<void>;
  start?: () => Promise<void>;
  stop?: () => Promise<void>;
  dispose?: () => Promise<void>;
  onEvent?: (event: PluginEvent) => void;
}

export interface PluginHealth {
  pluginId?: string;
  state?: PluginState;
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown';
  startupTime?: number | null;
  memoryUsageMb?: number | null;
  cpuUsagePercent?: number | null;
  errorCount?: number;
  lastSuccess?: number | null;
  lastFailure?: number | null;
  version?: string;
}

export interface PluginSecurityProvider {
  authorize(pluginId: string, permission: string): Promise<boolean>;
  verifySignature?(pluginId: string, signature: string): Promise<boolean>;
  isTrusted?(pluginId: string): boolean;
}

export interface PluginContext {
  registry: {
    registerCapability: (capability: string) => void;
    registerCapabilityDescriptor: (descriptor: import('../capabilities/CapabilityRegistry').CapabilityDescriptor) => void;
    getCapability: (capabilityId: string) => import('../capabilities/CapabilityRegistry').CapabilityDescriptor | undefined;
    listCapabilities: () => import('../capabilities/CapabilityRegistry').CapabilityDescriptor[];
  };
  security: PluginSecurityProvider;
  logger: { info: (msg: string, meta?: Record<string, any>) => void; warn: (msg: string, meta?: Record<string, any>) => void; error: (msg: string, meta?: Record<string, any>) => void; };
}

export type PluginLifecycle = 'initialize' | 'start' | 'stop' | 'dispose';

export interface PluginEvent {
  type: string;
  pluginId: string;
  payload?: Record<string, any>;
}
