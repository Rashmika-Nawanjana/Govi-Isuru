const { config } = require('./config');

/**
 * Paced outbound queue.
 *
 * Baileys drives a real WhatsApp account, and accounts that emit bursts of
 * messages to many recipients get banned. Every push - especially outbreak
 * fan-out to a whole GN division - leaves through here: one message at a
 * time, with jitter, under a daily cap.
 */
class Outbox {
  constructor(send) {
    this.send = send;
    this.queue = [];
    this.running = false;
    this.sentToday = 0;
    this.dayStamp = new Date().toDateString();
    this.dropped = 0;
  }

  rollDay() {
    const today = new Date().toDateString();
    if (today !== this.dayStamp) {
      this.dayStamp = today;
      this.sentToday = 0;
      this.dropped = 0;
    }
  }

  enqueue(messages) {
    this.rollDay();

    const accepted = [];
    for (const msg of messages) {
      if (this.sentToday + this.queue.length + accepted.length >= config.outboxDailyCap) {
        this.dropped += 1;
        continue;
      }
      accepted.push(msg);
    }

    this.queue.push(...accepted);
    this.drain();
    return { queued: accepted.length, dropped: messages.length - accepted.length };
  }

  async drain() {
    if (this.running) return;
    this.running = true;

    while (this.queue.length) {
      const msg = this.queue.shift();
      try {
        await this.send(msg);
        this.sentToday += 1;
      } catch (err) {
        console.warn(`Outbox delivery to ${msg.jid} failed:`, err.message);
      }

      if (this.queue.length) {
        const jitter = Math.floor(Math.random() * config.outboxJitterMs);
        await new Promise((r) => setTimeout(r, config.outboxIntervalMs + jitter));
      }
    }

    this.running = false;
  }

  stats() {
    this.rollDay();
    return {
      queued: this.queue.length,
      sentToday: this.sentToday,
      droppedToday: this.dropped,
      dailyCap: config.outboxDailyCap
    };
  }
}

module.exports = { Outbox };
