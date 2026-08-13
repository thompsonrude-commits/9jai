import { ModelRuntimeAPI } from '../runtimeAPI';

async function testRegistration() {
  const api = new ModelRuntimeAPI();
  const meta = {
    id: 't1',
    name: 't1',
    version: '0.0.1',
    capabilities: ['chat'],
    hardware: { ramMb: 128 },
  } as any;
  await api.registerModel(meta);
  const list = api.listInstalledModels();
  if (list.length !== 1) throw new Error('register failed');
}

async function testLoadUnload() {
  const api = new ModelRuntimeAPI();
  const meta = { id: 't2', name: 't2', version: '0.0.1', capabilities: ['chat'], hardware: {} } as any;
  await api.registerModel(meta);
  await api.loadModel('t2');
  await api.activateModel('t2');
  await api.deactivateModel('t2');
  await api.unloadModel('t2');
}

async function run() {
  await testRegistration();
  await testLoadUnload();
  console.log('tests passed');
}

run().catch((e) => { console.error(e); process.exit(2); });
