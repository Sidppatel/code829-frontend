import { useEffect, useMemo } from 'react';
import { BaseViewModel } from './BaseViewModel';
import { useVMState } from './useVM';
import { eventController, EventController } from '../controllers/EventController';
import type { EventDetail } from '../types/event';

interface EventDetailState {
  event: EventDetail | null;
  loading: boolean;
  error: string | null;
}

export class EventDetailViewModel extends BaseViewModel<EventDetailState> {
  private reqKey = '';

  private identifier: { id?: string; slug?: string };
  private readonly ctrl: EventController;

  constructor(identifier: { id?: string; slug?: string }, ctrl: EventController = eventController) {
    super({ event: null, loading: false, error: null });
    this.identifier = identifier;
    this.ctrl = ctrl;
  }

  async load(): Promise<void> {
    const key = JSON.stringify(this.identifier);
    this.reqKey = key;
    this.setState({ loading: true, error: null });
    try {
      const data = this.identifier.id
        ? await this.ctrl.getById(this.identifier.id)
        : this.identifier.slug
          ? await this.ctrl.getBySlug(this.identifier.slug)
          : null;
      if (this.reqKey !== key) return;
      this.setState({ event: data, loading: false });
    } catch (err: unknown) {
      if (this.reqKey !== key) return;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load event';
      this.setState({ loading: false, error: msg });
    }
  }

  refresh = () => this.load();
}

export interface UseEventDetailVMResult extends EventDetailState {
  vm: EventDetailViewModel;
  refresh: () => void;
}

export function useEventDetailVM(identifier: { id?: string; slug?: string }): UseEventDetailVMResult {
  const key = JSON.stringify(identifier);
  const vm = useMemo(() => new EventDetailViewModel(identifier), [key]);
  const state = useVMState(vm);

  useEffect(() => {
    if (identifier.id || identifier.slug) void vm.load();
    return () => vm.dispose();
  }, [vm, identifier.id, identifier.slug]);

  return { ...state, vm, refresh: vm.refresh };
}
