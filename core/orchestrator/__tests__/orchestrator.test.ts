import AIOrchestrator from '../index';
import InferenceScheduler from '../../scheduler';

async function run() {
  const scheduler = new InferenceScheduler();
  const orch = new AIOrchestrator(scheduler);

  // register a mock adapter for 'chat' capability
  orch.registerAdapter({ engineId: 'mock-chat', capability: 'chat', execute: async (req) => ({ reply: 'ok', input: req.input }) });

  scheduler.start();

  const resp = await orch.handleRequest({ sessionId: 's1', userId: 'u1', input: 'Hello, how are you?', type: 'chat' });
  if (resp.status !== 'ok') throw new Error('unexpected status');

  scheduler.stop();
  console.log('orchestrator tests passed');
}

run().catch((e) => { console.error(e); process.exit(2); });
