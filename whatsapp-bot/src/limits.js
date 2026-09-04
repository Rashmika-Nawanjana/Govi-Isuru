/**
 * Concurrency control for a shared bot.
 *
 * Baileys delivers every chat down one socket. Handling messages in a plain
 * awaited loop means one farmer's 15-second disease diagnosis blocks everyone
 * else in the queue - with 10-15 people at a demo stand that reads as "the
 * bot is dead". So work is dispatched instead of awaited, under three rules:
 *
 *   1. Messages from ONE person stay strictly ordered (a photo must be
 *      handled before the "1" that answers it).
 *   2. Different people run in parallel.
 *   3. A global cap keeps simultaneous model inference within what a small
 *      EC2 box running TensorFlow can actually serve.
 */

class Limiter {
  constructor({ concurrency = 4, maxQueuePerUser = 3 } = {}) {
    this.concurrency = concurrency;
    this.maxQueuePerUser = maxQueuePerUser;

    this.active = 0;
    this.pending = [];        // waiting for a global slot
    this.chains = new Map();  // jid -> promise tail, preserves per-user order
    this.depth = new Map();   // jid -> queued count, for the busy guard

    this.stats = { accepted: 0, rejected: 0, completed: 0, failed: 0, peakActive: 0 };
  }

  /** A global slot, resolved when one frees up. */
  acquire() {
    if (this.active < this.concurrency) {
      this.active += 1;
      this.stats.peakActive = Math.max(this.stats.peakActive, this.active);
      return Promise.resolve();
    }
    return new Promise((resolve) => this.pending.push(resolve));
  }

  release() {
    const next = this.pending.shift();
    if (next) {
      next(); // hand the slot straight over, active stays the same
      return;
    }
    this.active = Math.max(0, this.active - 1);
  }

  /** True when this person already has too much work outstanding. */
  isFlooding(jid) {
    return (this.depth.get(jid) || 0) >= this.maxQueuePerUser;
  }

  /**
   * Runs fn for jid. Returns a promise that settles when fn does, but callers
   * are expected NOT to await it, so the socket keeps reading.
   */
  run(jid, fn) {
    if (this.isFlooding(jid)) {
      this.stats.rejected += 1;
      const err = new Error('BUSY');
      err.code = 'BUSY';
      return Promise.reject(err);
    }

    this.stats.accepted += 1;
    this.depth.set(jid, (this.depth.get(jid) || 0) + 1);

    const previous = this.chains.get(jid) || Promise.resolve();

    const task = previous
      .catch(() => {})               // one failure must not poison the chain
      .then(async () => {
        await this.acquire();
        try {
          return await fn();
        } finally {
          this.release();
        }
      });

    // Bookkeeping runs whether the task worked or not
    const settled = task.then(
      (v) => { this.stats.completed += 1; return v; },
      (e) => { this.stats.failed += 1; throw e; }
    ).finally(() => {
      const left = (this.depth.get(jid) || 1) - 1;
      if (left <= 0) {
        this.depth.delete(jid);
        // Drop the chain once this user is idle so the map cannot grow forever
        if (this.chains.get(jid) === task) this.chains.delete(jid);
      } else {
        this.depth.set(jid, left);
      }
    });

    this.chains.set(jid, task);
    return settled;
  }

  snapshot() {
    return {
      active: this.active,
      waiting: this.pending.length,
      users: this.chains.size,
      concurrency: this.concurrency,
      ...this.stats
    };
  }
}

module.exports = { Limiter };
