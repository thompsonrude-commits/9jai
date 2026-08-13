import type { CapabilityDescriptor } from '../capabilities/CapabilityRegistry';
import type { EvaluationEngine } from '../evaluation/EvaluationEngine';
import type { AIOrchestrator } from '../orchestrator/index';

export type DeveloperTargetCategory = 'project' | 'plugin' | 'agent' | 'engine' | 'workflow' | 'documentation';

export interface GeneratorArtifact {
  path: string;
  content: string;
}

export interface ScaffoldResult {
  success: boolean;
  message: string;
  artifacts: GeneratorArtifact[];
  metadata?: Record<string, unknown>;
}

export interface TemplateDescriptor {
  id: string;
  name: string;
  description: string;
  category: DeveloperTargetCategory;
  version: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  generatorHints?: Record<string, unknown>;
}

export interface PackageSource {
  id: string;
  name: string;
  url: string;
  type: 'npm' | 'git' | 'local' | 'template';
  signature?: string;
  trusted?: boolean;
}

export interface CLICommandDescriptor {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[]) => Promise<ScaffoldResult | void>;
}

export interface DeveloperDiagnosticsReport {
  timestamp: string;
  issues: string[];
  warnings: string[];
  passed: boolean;
}

export interface DeveloperPlatformOptions {
  orchestrator?: AIOrchestrator;
  capabilityRegistry?: { register: (descriptor: CapabilityDescriptor) => void; list: () => CapabilityDescriptor[] };
  evaluationEngine?: EvaluationEngine;
}

export interface ProjectScaffoldOptions {
  projectName: string;
  description: string;
  author?: string;
  language?: 'typescript' | 'javascript';
  destination?: string;
}

export interface PluginScaffoldOptions {
  pluginId: string;
  name: string;
  description: string;
  version?: string;
  author?: string;
  capabilities?: CapabilityDescriptor[];
}

export interface AgentScaffoldOptions {
  agentId: string;
  name: string;
  role: string;
  capabilities: string[];
  description?: string;
}

export interface EngineScaffoldOptions {
  engineId: string;
  name: string;
  category: string;
  capabilities: CapabilityDescriptor[];
  description?: string;
}

export interface WorkflowScaffoldOptions {
  workflowId: string;
  name: string;
  description?: string;
  triggers?: string[];
}

export interface DocumentationScaffoldOptions {
  title: string;
  description: string;
  sections?: Record<string, string>;
}
