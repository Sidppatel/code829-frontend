/**
 * Abstract base for singleton controllers. Controllers orchestrate service
 * calls and compose multi-service flows. They hold NO React state — any UI
 * state lives in ViewModels, which subscribe to controller events.
 *
 * Subclasses extend this class, expose a `static getInstance()` returning a
 * memoized singleton, and emit domain events via `this.emit(type, detail)`.
 * Consumers subscribe with `controller.on(type, listener)` which returns an
 * unsubscribe function.
 */
export abstract class BaseController {
  private readonly bus = new EventTarget();

  protected emit<T>(type: string, detail?: T): void {
    this.bus.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on<T = unknown>(type: string, listener: (detail: T) => void): () => void {
    const handler = (e: Event) => listener((e as CustomEvent<T>).detail);
    this.bus.addEventListener(type, handler);
    return () => this.bus.removeEventListener(type, handler);
  }
}
