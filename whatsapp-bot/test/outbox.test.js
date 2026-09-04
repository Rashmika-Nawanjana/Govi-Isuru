const test = require('node:test');
const assert = require('node:assert');

// Pace the queue down so the tests are not sleeping for real intervals
process.env.OUTBOX_INTERVAL_MS = '1';
process.env.OUTBOX_JITTER_MS = '0';
process.env.OUTBOX_DAILY_CAP = '5';

const { Outbox } = require('../src/outbox');

function settle() {
  return new Promise((resolve) => setTimeout(resolve, 60));
}

test('every queued message is delivered exactly once', async () => {
  const sent = [];
  const outbox = new Outbox(async (m) => { sent.push(m.jid); });

  outbox.enqueue([{ jid: 'a', text: 'x' }, { jid: 'b', text: 'y' }]);
  await settle();

  assert.deepStrictEqual(sent, ['a', 'b']);
});

test('messages are sent one at a time, never concurrently', async () => {
  let inFlight = 0;
  let maxInFlight = 0;

  const outbox = new Outbox(async () => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight -= 1;
  });

  outbox.enqueue([
    { jid: 'a', text: '1' },
    { jid: 'b', text: '2' },
    { jid: 'c', text: '3' }
  ]);
  await settle();

  assert.strictEqual(maxInFlight, 1, 'fan-out must stay serial to avoid a ban');
});

test('the daily cap drops the overflow instead of sending it', async () => {
  const sent = [];
  const outbox = new Outbox(async (m) => { sent.push(m.jid); });

  const result = outbox.enqueue(
    Array.from({ length: 8 }, (_, i) => ({ jid: `n${i}`, text: 'x' }))
  );
  await settle();

  assert.strictEqual(result.queued, 5);
  assert.strictEqual(result.dropped, 3);
  assert.strictEqual(sent.length, 5);
});

test('one failed delivery does not stop the rest of the queue', async () => {
  const sent = [];
  const outbox = new Outbox(async (m) => {
    if (m.jid === 'bad') throw new Error('recipient unreachable');
    sent.push(m.jid);
  });

  outbox.enqueue([
    { jid: 'good1', text: 'x' },
    { jid: 'bad', text: 'x' },
    { jid: 'good2', text: 'x' }
  ]);
  await settle();

  assert.deepStrictEqual(sent, ['good1', 'good2']);
});

test('stats report what is queued and what was sent', async () => {
  const outbox = new Outbox(async () => {});
  outbox.enqueue([{ jid: 'a', text: 'x' }]);
  await settle();

  const stats = outbox.stats();
  assert.strictEqual(stats.queued, 0);
  assert.strictEqual(stats.sentToday, 1);
  assert.strictEqual(stats.dailyCap, 5);
});
