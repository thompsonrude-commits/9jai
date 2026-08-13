import InMemoryKnowledgeStore, { knowledgeEvents } from '../knowledgeStore';

async function run() {
  const store = new InMemoryKnowledgeStore();

  // events
  let saved = false;
  knowledgeEvents.once('DocumentSaved', (e) => { saved = true; });

  // basic CRUD
  const doc = { id: 'd1', text: 'hello world', title: 't1' };
  await store.saveDocument(doc as any);
  if (!saved) throw new Error('DocumentSaved event not emitted');

  const fetched = await store.getDocument('d1');
  if (fetched.text !== 'hello world') throw new Error('unexpected text');

  const updated = await store.updateDocument('d1', { text: 'updated' });
  if (updated.text !== 'updated') throw new Error('update failed');

  const exists = await store.documentExists('d1');
  if (!exists) throw new Error('documentExists false');

  const list = await store.listDocuments({ limit: 10 });
  if (list.total !== 1) throw new Error('listDocuments total wrong');

  const count = await store.countDocuments();
  if (count !== 1) throw new Error('countDocuments wrong');

  // transaction no-op
  const tx = await store.beginTransaction();
  await tx.commit();

  await store.deleteDocument('d1');

  try {
    await store.getDocument('d1');
    throw new Error('expected not found');
  } catch (e) {
    // expected
  }

  const health = await store.health();
  if (health.documentCount !== 0) throw new Error('health doc count wrong');

  console.log('knowledgeStore tests passed');
}

run().catch((e) => { console.error(e); process.exit(2); });
