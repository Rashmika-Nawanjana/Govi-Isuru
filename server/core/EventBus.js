/**
 * Singleton Event Bus.
 *
 * Node caches CommonJS modules, but the explicit getInstance method documents
 * and enforces that the application has one shared event coordinator.
 */
class EventBus {
  static instance;

  constructor() {
    if (EventBus.instance) {
      return EventBus.instance;
    }

    this.listeners = new Map();
    EventBus.instance = this;
  }

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Event listener must be a function');
    }

    const listeners = this.listeners.get(eventName) || new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  async publish(eventName, payload) {
    const listeners = [...(this.listeners.get(eventName) || [])];
    await Promise.all(listeners.map((listener) => listener(payload)));
  }
}

module.exports = EventBus.getInstance();
module.exports.EventBus = EventBus;
