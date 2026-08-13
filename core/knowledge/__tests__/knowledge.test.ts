import { InMemoryKnowledgeStore } from '../knowledgeStore';
import { RetrievalManager } from '../retrievalManager';
import { DocumentIndexer } from '../indexer';
import { ContextBuilder } from '../contextBuilder';

async function run() {
  const store = new InMemoryKnowledgeStore();
  const rm = new RetrievalManager(store);

  const doc = { id: 'd1', title: 'Test Doc', text: 'Hello world.\n\nThis is a test document about Edo language and translation.' };
  await rm.indexDocument(doc as any);

  const res = await rm.retrieve('Edo translation', 3);
  if (res.length === 0) throw new Error('no results');

  const cb = new ContextBuilder();
  const ctx = cb.build(res, 1000);
  if (ctx.length === 0) throw new Error('context builder failed');

  console.log('knowledge tests passed');
}

run().catch((e) => { console.error(e); process.exit(2); });
