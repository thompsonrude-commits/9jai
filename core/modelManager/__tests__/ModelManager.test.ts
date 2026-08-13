/// <reference types="vitest" />

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModelManager } from '../ModelManager';
import type { ModelDescriptor } from '../types';
import { modelEvents } from '../events';

const sampleModel: ModelDescriptor = {
  id: 'test-model-1',
  name: 'Test Model',
  category: 'language',
  version: '1.0.0',
  provider: 'local',
  filePath: './build/test-model.bin',
  sizeBytes: 1024,
  supportedTasks: ['chat'],
  supportedLanguages: ['en'],
  requiredHardware: {
    cpuCores: 2,
    minRamMb: 256,
  },
  gpuSupport: false,
  cpuSupport: true,
  quantization: 'int8',
  license: 'MIT',
  status: 'discovered',
  installedAt: new Date().toISOString(),
  lastValidatedAt: new Date().toISOString(),
  lastUsedAt: undefined,
  health: {
    status: 'unknown',
    errorCount: 0,
    validationStatus: 'pending',
    availability: false,
  },
  source: 'local',
  checksum: '',
  signature: '',
};

describe('ModelManager', () => {
  let manager: ModelManager;
  let events: string[];

  beforeEach(() => {
    manager = new ModelManager({ discoveryPaths: ['./core/modelManager/__tests__/fixtures'] });
    events = [];
    modelEvents.on('ModelRegistered', () => events.push('registered'));
    modelEvents.on('ModelValidated', () => events.push('validated'));
    modelEvents.on('ModelSelected', () => events.push('selected'));
  });

  afterEach(() => {
    modelEvents.removeAllListeners();
  });

  it('registers and retrieves model descriptors', async () => {
    await manager.registerModel(sampleModel);
    const model = manager.getModel('test-model-1');
    expect(model).toBeDefined();
    expect(model?.name).toBe('Test Model');
    expect(events).toContain('registered');
  });

  it('selects a model by task and criteria', async () => {
    await manager.registerModel(sampleModel);
    const selected = manager.selectModel({ task: 'chat', supportedLanguage: 'en' });
    expect(selected?.id).toBe('test-model-1');
    expect(events).toContain('selected');
  });

  it('deprecates a model and avoids selecting deprecated models by default', async () => {
    await manager.registerModel(sampleModel);
    manager.deprecateModel('test-model-1');
    const selected = manager.selectModel({ task: 'chat' });
    expect(selected).toBeUndefined();
  });

  it('validates a model and updates health status', async () => {
    const model = { ...sampleModel, filePath: './README.md' };
    manager.registerModel(model);
    const result = await manager.validateModel('test-model-1');
    expect(result.valid).toBe(true);
    expect(events).toContain('validated');
    const updated = manager.getModel('test-model-1');
    expect(updated?.status).toBe('ready');
  });
});
