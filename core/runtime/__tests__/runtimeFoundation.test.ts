import { describe, it, expect } from 'vitest';
import { ModelRuntimeAPI } from '../runtimeAPI';
import { DefaultModelRuntime } from '../ModelRuntime';
import { ConfigManager } from '../configManager';

describe('runtime foundation', () => {
  it('registers, loads, activates, and unloads models with state transitions', async () => {
    const api = new ModelRuntimeAPI();
    await api.registerModel({
      id: 'model-a',
      name: 'Model A',
      version: '1.0.0',
      capabilities: ['chat'],
      hardware: { ramMb: 512 },
    });

    await api.loadModel('model-a');
    await api.activateModel('model-a');
    const status = api.getModelStatus('model-a');
    expect(status?.status).toBe('active');

    await api.deactivateModel('model-a');
    await api.unloadModel('model-a');
    const reloaded = api.getModelStatus('model-a');
    expect(reloaded?.status).toBe('unloaded');
  });

  it('routes to a preferred model and reports health', async () => {
    const runtime = new DefaultModelRuntime();
    await runtime.initialize();
    runtime.registerModel({ id: 'primary', name: 'Primary', capabilities: ['chat'], executionMode: 'local', isActive: true, version: '1.0.0' });
    runtime.registerModel({ id: 'secondary', name: 'Secondary', capabilities: ['chat'], executionMode: 'remote', isActive: true, version: '1.0.0' });

    const routed = await runtime.route({ capability: 'chat', requestId: 'req-1', preferredModel: 'secondary' });
    expect(routed?.id).toBe('secondary');

    const health = await runtime.getHealth();
    expect(health.status).toBe('healthy');
  });

  it('normalizes config values and persists them', () => {
    const manager = new ConfigManager();
    manager.set({ maxCpuPercent: 55, loggingLevel: 'debug' });
    const loaded = manager.get();
    expect(loaded.maxCpuPercent).toBe(55);
    expect(loaded.loggingLevel).toBe('debug');
  });
});
