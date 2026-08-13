import { ModelRuntimeAPI } from './runtimeAPI';

async function run() {
  const api = new ModelRuntimeAPI();

  // basic registration test
  const meta = {
    id: 'test-model',
    name: 'Test Model',
    version: '1.0.0',
    capabilities: ['chat'] as any,
    hardware: { cpuCores: 1, ramMb: 256 },
  };

  try {
    await api.registerModel(meta as any);
    const list = api.listInstalledModels();
    if (list.length !== 1) throw new Error('Model registration failed');

    await api.loadModel('test-model');
    const status = api.getModelStatus('test-model');
    if (!status) throw new Error('Model missing after load');

    await api.activateModel('test-model');
    const health = await api.getRuntimeHealth();
    console.log('Health:', health);

    await api.deactivateModel('test-model');
    await api.unloadModel('test-model');

    console.log('Runtime tests completed successfully');
  } catch (e) {
    console.error('Runtime tests failed:', e instanceof Error ? e.message : e);
    process.exit(2);
  }
}

run();
