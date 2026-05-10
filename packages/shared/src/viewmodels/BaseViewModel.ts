export abstract class BaseViewModel<TState> {
  protected state: TState;
  private readonly listeners = new Set<() => void>();

  constructor(initial: TState) {
    this.state = initial;
  }

  getState = (): TState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  protected setState(partial: Partial<TState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach(l => l());
  }

  dispose(): void {
    this.listeners.clear();
  }
}
