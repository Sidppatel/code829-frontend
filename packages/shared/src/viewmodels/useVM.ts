import { useSyncExternalStore } from 'react';
import type { BaseViewModel } from './BaseViewModel';

export function useVMState<TState>(vm: BaseViewModel<TState>): TState {
  return useSyncExternalStore(vm.subscribe, vm.getState, vm.getState);
}
