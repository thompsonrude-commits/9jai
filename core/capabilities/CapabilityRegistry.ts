/**
 * CapabilityRegistry.ts
 *
 * Phase 23: Supports capability discovery, structured metadata, selection,
 * version compatibility, and future plugin-driven extensibility.
 */

export type CapabilityCategory =
  | 'language'
  | 'vision'
  | 'memory'
  | 'speech'
  | 'image'
  | 'video'
  | 'translation'
  | 'ocr'
  | 'tool'
  | 'utility'
  | 'other';

export interface ResourceRequirements {
  cpuCores?: number;
  memoryMb?: number;
  gpuCount?: number;
  custom?: Record<string, any>;
}

export interface CapabilityDescriptor {
  capabilityId: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  inputTypes: string[];
  outputTypes: string[];
  supportedLanguages?: string[];
  streaming?: boolean;
  priority?: number;
  resourceRequirements?: ResourceRequirements;
  confidenceSupport?: boolean;
  version: string;
  pluginId: string;
  deprecated?: boolean;
  metadata?: Record<string, any>;
}

export interface CapabilityQuery {
  capabilityId?: string;
  name?: string;
  category?: CapabilityCategory;
  supportedInput?: string[];
  supportedOutput?: string[];
  languages?: string[];
  streaming?: boolean;
  minPriority?: number;
  pluginId?: string;
  versionRange?: string;
}

export interface CapabilityRegistry {
  register(registration: CapabilityDescriptor): void;
  unregister(capabilityId: string): void;
  update(registration: CapabilityDescriptor): void;
  get(capabilityId: string): CapabilityDescriptor | undefined;
  list(): CapabilityDescriptor[];
  search(query: CapabilityQuery): CapabilityDescriptor[];
  findBest(query: CapabilityQuery): CapabilityDescriptor | undefined;
  listByPlugin(pluginId: string): CapabilityDescriptor[];
  count(): number;
}

function versionMatches(range: string | undefined, version: string): boolean {
  if (!range) return true;
  if (range === version) return true;
  if (range.startsWith('^')) {
    const major = range.slice(1).split('.')[0];
    return version.split('.')[0] === major;
  }
  if (range.startsWith('~')) {
    const [major, minor] = range.slice(1).split('.');
    const [vMajor, vMinor] = version.split('.');
    return vMajor === major && vMinor === minor;
  }
  return false;
}

function matchesQuery(candidate: CapabilityDescriptor, query: CapabilityQuery): boolean {
  if (query.capabilityId && candidate.capabilityId !== query.capabilityId) return false;
  if (query.name && candidate.name !== query.name) return false;
  if (query.category && candidate.category !== query.category) return false;
  if (query.pluginId && candidate.pluginId !== query.pluginId) return false;
  if (query.minPriority !== undefined && (candidate.priority ?? 100) > query.minPriority) return false;
  if (query.streaming !== undefined && candidate.streaming !== query.streaming) return false;
  if (query.languages && query.languages.length > 0) {
    const supported = candidate.supportedLanguages ?? [];
    if (!query.languages.every((lang) => supported.includes(lang))) return false;
  }
  if (query.supportedInput && query.supportedInput.length > 0) {
    const inputs = candidate.inputTypes.map((t) => t.toLowerCase());
    if (!query.supportedInput.every((t) => inputs.includes(t.toLowerCase()))) return false;
  }
  if (query.supportedOutput && query.supportedOutput.length > 0) {
    const outputs = candidate.outputTypes.map((t) => t.toLowerCase());
    if (!query.supportedOutput.every((t) => outputs.includes(t.toLowerCase()))) return false;
  }
  if (!versionMatches(query.versionRange, candidate.version)) return false;
  return true;
}

export class DefaultCapabilityRegistry implements CapabilityRegistry {
  private readonly registrations = new Map<string, CapabilityDescriptor>();

  register(registration: CapabilityDescriptor): void {
    this.registrations.set(registration.capabilityId, registration);
  }

  unregister(capabilityId: string): void {
    this.registrations.delete(capabilityId);
  }

  update(registration: CapabilityDescriptor): void {
    if (!this.registrations.has(registration.capabilityId)) {
      throw new Error(`Cannot update unknown capability ${registration.capabilityId}`);
    }
    this.registrations.set(registration.capabilityId, registration);
  }

  get(capabilityId: string): CapabilityDescriptor | undefined {
    return this.registrations.get(capabilityId);
  }

  list(): CapabilityDescriptor[] {
    return Array.from(this.registrations.values());
  }

  search(query: CapabilityQuery): CapabilityDescriptor[] {
    return this.list().filter((candidate) => matchesQuery(candidate, query));
  }

  findBest(query: CapabilityQuery): CapabilityDescriptor | undefined {
    return this.search(query)
      .filter((candidate) => !candidate.deprecated)
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || b.version.localeCompare(a.version))
      .shift();
  }

  listByPlugin(pluginId: string): CapabilityDescriptor[] {
    return this.list().filter((registration) => registration.pluginId === pluginId);
  }

  count(): number {
    return this.registrations.size;
  }
}
