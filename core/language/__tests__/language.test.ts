import assert from 'assert';
import { defaultLanguageEngine } from '../languageEngine';

async function run() {
  const req = { sessionId: 's1', userId: 'u1', input: 'Plan a trip to Lagos, include budget and itinerary.' };
  const res = await defaultLanguageEngine.handleRequest(req as any);
  assert(res.text.includes('Plan a trip to Lagos'));
  console.log('language test passed');
}

run().catch(e => { console.error(e); process.exit(1); });
