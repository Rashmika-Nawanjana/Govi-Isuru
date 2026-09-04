const test = require('node:test');
const assert = require('node:assert');

const { Limiter } = require('../src/limits');

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

test('messages from one person are handled strictly in order', async () => {
  const limiter = new Limiter({ concurrency: 4, maxQueuePerUser: 10 });
  const seen = [];

  const jid = 'a@s.whatsapp.net';
  const jobs = [
    limiter.run(jid, async () => { await tick(20); seen.push(1); }),
    limiter.run(jid, async () => { await tick(1); seen.push(2); }),
    limiter.run(jid, async () => { await tick(1); seen.push(3); })
  ];

  await Promise.all(jobs);
  assert.deepStrictEqual(seen, [1, 2, 3], 'a photo must be handled before the reply to it');
});

test('different people are served in parallel, not behind each other', async () => {
  const limiter = new Limiter({ concurrency: 4, maxQueuePerUser: 5 });
  let concurrent = 0;
  let peak = 0;

  const job = async () => {
    concurrent += 1;
    peak = Math.max(peak, concurrent);
    await tick(20);
    concurrent -= 1;
  };

  await Promise.all([
    limiter.run('a@x', job),
    limiter.run('b@x', job),
    limiter.run('c@x', job)
  ]);

  assert.strictEqual(peak, 3, 'one slow user must not block the others');
});

test('the global cap is never exceeded', async () => {
  const limiter = new Limiter({ concurrency: 2, maxQueuePerUser: 10 });
  let concurrent = 0;
  let peak = 0;

  const job = async () => {
    concurrent += 1;
    peak = Math.max(peak, concurrent);
    await tick(15);
    concurrent -= 1;
  };

  await Promise.all(
    Array.from({ length: 8 }, (_, i) => limiter.run(`u${i}@x`, job))
  );

  assert.strictEqual(peak, 2, 'model inference must stay within the box');
});

test('all queued work still completes once slots free up', async () => {
  const limiter = new Limiter({ concurrency: 2, maxQueuePerUser: 10 });
  let done = 0;

  await Promise.all(
    Array.from({ length: 9 }, (_, i) => limiter.run(`u${i}@x`, async () => { await tick(5); done += 1; }))
  );

  assert.strictEqual(done, 9);
  assert.strictEqual(limiter.snapshot().active, 0, 'every slot is handed back');
});

test('one person spamming is rejected instead of starving everyone', async () => {
  const limiter = new Limiter({ concurrency: 2, maxQueuePerUser: 2 });
  const jid = 'flood@x';

  const a = limiter.run(jid, async () => { await tick(30); });
  const b = limiter.run(jid, async () => { await tick(30); });
  const c = limiter.run(jid, async () => { await tick(30); });

  await assert.rejects(c, (e) => e.code === 'BUSY');
  await Promise.all([a, b]);
  assert.strictEqual(limiter.snapshot().rejected, 1);
});

test('a capacity rejection clears once the user drains', async () => {
  const limiter = new Limiter({ concurrency: 2, maxQueuePerUser: 1 });
  const jid = 'x@x';

  await limiter.run(jid, async () => { await tick(2); });
  // Previous work finished, so the next message is accepted again
  await limiter.run(jid, async () => { await tick(2); });
  assert.strictEqual(limiter.snapshot().completed, 2);
});

test('a thrown handler releases its slot and does not poison the user chain', async () => {
  const limiter = new Limiter({ concurrency: 1, maxQueuePerUser: 5 });
  const jid = 'e@x';

  await assert.rejects(limiter.run(jid, async () => { throw new Error('boom'); }));

  let ran = false;
  await limiter.run(jid, async () => { ran = true; });

  assert.ok(ran, 'the next message from the same person must still be handled');
  assert.strictEqual(limiter.snapshot().active, 0);
  assert.strictEqual(limiter.snapshot().failed, 1);
});

test('per-user bookkeeping does not leak once everyone is idle', async () => {
  const limiter = new Limiter({ concurrency: 3, maxQueuePerUser: 5 });

  await Promise.all(
    Array.from({ length: 12 }, (_, i) => limiter.run(`u${i}@x`, async () => { await tick(2); }))
  );
  await tick(10);

  const s = limiter.snapshot();
  assert.strictEqual(s.users, 0, 'chain map must not grow forever');
  assert.strictEqual(s.active, 0);
});
