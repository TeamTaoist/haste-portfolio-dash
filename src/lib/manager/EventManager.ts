export class EventManager {
  private static _instance: EventManager;
  private constructor() {}

  public static get instance() {
    if (!EventManager._instance) {
      EventManager._instance = new EventManager();
    }
    return this._instance;
  }

  subscribe(eventName: string, listener: EventListener) {
    document.addEventListener(eventName, listener);
  }

  unsubscribe(eventName: string, listener: EventListener) {
    document.removeEventListener(eventName, listener);
  }

  publish(eventName: string, data: { [key: string]: unknown }) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  }
}
