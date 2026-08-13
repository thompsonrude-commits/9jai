import assert from 'assert';
import { defaultMemoryEngine } from '../memoryEngine';

async function run() {
  const userId = 'user123';
  // save a long-term memory
  const m = await defaultMemoryEngine.saveMemory({ userId, text: 'User likes spicy food', tags: ['preference'] } as any);
  const listed = await defaultMemoryEngine.listMemories(userId);
  assert(listed.length >= 1, 'expected at least one memory');

  // search
  const res = await defaultMemoryEngine.searchMemories('spicy', userId, 3);
  assert(res.length >= 1, 'expected search hit');
  console.log('memory tests passed');
}

run().catch(e => { console.error(e); process.exit(1); });
