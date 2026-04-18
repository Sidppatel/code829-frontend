import { useEffect, useMemo } from 'react';
import { BaseViewModel } from './BaseViewModel';
import { useVMState } from './useVM';
import { eventController, EventController } from '../controllers/EventController';
import type { EventListParams } from '../services/EventService';
import type { EventSummary } from '../types/event';
import type { PagedResponse } from '../types/shared';

interface EventListState {
  events: EventSummary[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

export class EventListViewModel extends BaseViewModel<EventListState> {
  private reqKey = '';

  private params: EventListParams;
  private readonly ctrl: EventController;

  constructor(params: EventListParams = {}, ctrl: EventController = eventController) {
    super({ events: [], total: 0, page: 1, pageSize: params.pageSize ?? 20, loading: false, error: null });
    this.params = params;
    this.ctrl = ctrl;
  }

  setParams(params: EventListParams): void {
    this.params = params;
    this.load();
  }

  async load(): Promise<void> {
    const key = JSON.stringify(this.params);
    this.reqKey = key;
    this.setState({ loading: true, error: null });
    try {
      const data: PagedResponse<EventSummary> = await this.ctrl.list(this.params);
      if (this.reqKey !== key) return;
      this.setState({
        events: data.items,
        total: data.totalCount,
        page: data.page,
        pageSize: data.pageSize,
        loading: false,
      });
    } catch (err: unknown) {
      if (this.reqKey !== key) return;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load events';
      this.setState({ loading: false, error: msg });
    }
  }

  refresh = () => this.load();
}

export interface UseEventListVMResult extends EventListState {
  vm: EventListViewModel;
  refresh: () => void;
}

export function useEventListVM(params: EventListParams = {}): UseEventListVMResult {
  const key = JSON.stringify(params);
  const vm = useMemo(() => new EventListViewModel(params), [key]);
  const state = useVMState(vm);

  useEffect(() => {
    void vm.load();
    return () => vm.dispose();
  }, [vm]);

  return { ...state, vm, refresh: vm.refresh };
}
