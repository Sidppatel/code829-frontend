/**
 * Base class for ViewModels. Holds immutable UI state, notifies subscribers
 * when the state changes, and exposes `getState` / `subscribe` so React can
 * consume it via `useSyncExternalStore`.
 *
 * Subclasses call `this.setState(partial)` to mutate. State equality is
 * shallow — listeners fire on every setState so subclasses should only call
 * it when something actually changed.
 */
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

  /** Override to release controller subscriptions / in-flight requests. */
  dispose(): void {
    this.listeners.clear();
  }
}
