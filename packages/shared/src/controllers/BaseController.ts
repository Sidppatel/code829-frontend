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
