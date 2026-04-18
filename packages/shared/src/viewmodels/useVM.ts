import { useSyncExternalStore } from 'react';
import type { BaseViewModel } from './BaseViewModel';

/**
 * Bridge a BaseViewModel into React. Re-renders the caller whenever the VM
 * calls setState. The VM itself is returned as-is so callers can invoke its
 * methods (`vm.refresh()`, `vm.setFilter(...)`) directly.
 */
export function useVMState<TState>(vm: BaseViewModel<TState>): TState {
  return useSyncExternalStore(vm.subscribe, vm.getState, vm.getState);
}
