import { useEffect, useMemo } from 'react';
import { BaseViewModel } from './BaseViewModel';
import { useVMState } from './useVM';
import { purchaseController, PurchaseController } from '../controllers/PurchaseController';
import type { PricingQuote, PricingQuoteRequest } from '../types/pricing';
import { createLogger } from '../lib/logger';

const log = createLogger('PurchaseQuoteViewModel');

interface PurchaseQuoteState {
  quote: PricingQuote | null;
  isLoading: boolean;
  error: string | null;
}

export class PurchaseQuoteViewModel extends BaseViewModel<PurchaseQuoteState> {
  private reqKey = '';
  private refreshTick = 0;

  private selection: PricingQuoteRequest | null;
  private readonly ctrl: PurchaseController;

  constructor(selection: PricingQuoteRequest | null, ctrl: PurchaseController = purchaseController) {
    super({ quote: null, isLoading: false, error: null });
    this.selection = selection;
    this.ctrl = ctrl;
  }

  setSelection(selection: PricingQuoteRequest | null): void {
    this.selection = selection;
    void this.load();
  }

  refresh = (): void => {
    this.refreshTick++;
    void this.load();
  };

  async load(): Promise<void> {
    const sel = this.selection;
    if (!sel) {
      this.setState({ quote: null, error: null, isLoading: false });
      return;
    }
    const hasSelection = (sel.tableIds && sel.tableIds.length > 0) || (sel.seatCount && sel.seatCount > 0);
    if (!hasSelection) {
      this.setState({ quote: null, error: null, isLoading: false });
      return;
    }

    const key = `${JSON.stringify(sel)}::${this.refreshTick}`;
    this.reqKey = key;
    this.setState({ isLoading: true, error: null });

    try {
      const quote = await this.ctrl.getQuote(sel);
      if (this.reqKey !== key) return;
      this.setState({ quote, isLoading: false });
    } catch (err: unknown) {
      if (this.reqKey !== key) return;
      log.error('Failed to fetch purchase quote', { err });
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unable to calculate pricing';
      this.setState({ quote: null, isLoading: false, error: msg });
    }
  }
}

export interface UsePurchaseQuoteVMResult extends PurchaseQuoteState {
  vm: PurchaseQuoteViewModel;
  refresh: () => void;
}

export function usePurchaseQuoteVM(selection: PricingQuoteRequest | null): UsePurchaseQuoteVMResult {
  const key = JSON.stringify(selection);
  const vm = useMemo(() => new PurchaseQuoteViewModel(selection), []);
  const state = useVMState(vm);

  useEffect(() => {
    vm.setSelection(selection);
    return () => { /* keep VM alive across selection edits; dispose on unmount below */ };
  }, [vm, key]);

  useEffect(() => () => vm.dispose(), [vm]);

  return { ...state, vm, refresh: vm.refresh };
}
