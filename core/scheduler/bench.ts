import InferenceScheduler from './index';

async function runBench() {
  const handler = async () => {
    // simulate minimal work
    await new Promise((r) => setTimeout(r, 5));
    return true;
  };

  const s = new InferenceScheduler(async (job, ctx) => handler());
  s.start();
  const n = 100;
  const t0 = Date.now();
  for (let i = 0; i < n; i++) s.submit({ id: `b${i}`, type: 'bench', priority: 100 });
  // wait until processed
  while (s.listJobs().filter((j: any) => j.status !== 'completed' && j.status !== 'failed' && j.status !== 'cancelled').length > 0) {
    await new Promise((r) => setTimeout(r, 50));
  }
  const took = Date.now() - t0;
  s.stop();
  console.log(`bench: processed ${n} jobs in ${took}ms`);
}

runBench().catch((e) => { console.error(e); process.exit(2); });
