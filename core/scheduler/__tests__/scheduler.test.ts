import InferenceScheduler from '../index';
import { schedulerEvents } from '../events';

async function basicQueueTest() {
  const events: string[] = [];
  schedulerEvents.on('JobQueued', (e: any) => events.push('q:' + e.job.id));
  schedulerEvents.on('JobStarted', (e: any) => events.push('s:' + e.job.id));
  schedulerEvents.on('JobCompleted', (e: any) => events.push('c:' + e.job.id));

  const scheduler = new InferenceScheduler(async (job) => {
    // simulate work and progress
    for (let i = 1; i <= 3; i++) {
      (job as any).progress?.(i / 3);
      await new Promise((r) => setTimeout(r, 10));
    }
    return { ok: true };
  });

  scheduler.start();
  scheduler.submit({ id: 'j1', type: 'chat', priority: 50 });
  // wait for processing
  await new Promise((r) => setTimeout(r, 200));
  scheduler.stop();

  if (!events.some((x) => x.startsWith('c:j1'))) throw new Error('job did not complete');
}

async function cancellationTest() {
  const scheduler = new InferenceScheduler(async (job, ctx) => {
    for (let i = 0; i < 50; i++) {
      if (ctx.cancelToken.cancelled) throw new Error('cancelled');
      await new Promise((r) => setTimeout(r, 10));
    }
  });
  scheduler.start();
  scheduler.submit({ id: 'cj1', type: 'chat', priority: 10 });
  // cancel soon
  await new Promise((r) => setTimeout(r, 30));
  scheduler.cancelJob('cj1');
  await new Promise((r) => setTimeout(r, 200));
  scheduler.stop();
}

async function run() {
  await basicQueueTest();
  await cancellationTest();
  console.log('scheduler tests passed');
}

run().catch((e) => { console.error(e); process.exit(2); });
