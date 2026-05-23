import { useEffect, useState } from 'react';
import { BaseViewModel } from './BaseViewModel';
import { useVMState } from './useVM';
import { purchaseController, PurchaseController } from '../controllers/PurchaseController';
import type { CheckoutQuote, PricingQuoteRequest } from '../types/pricing';
import { createLogger } from '../lib/logger';

const log = createLogger('CheckoutQuoteViewModel');

interface CheckoutQuoteState {
  quote: CheckoutQuote | null;
  isLoading: boolean;
  error: string | null;
}

export class CheckoutQuoteViewModel extends BaseViewModel<CheckoutQuoteState> {
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
      const quote = await this.ctrl.getCheckoutQuote(sel);
      if (this.reqKey !== key) return;
      this.setState({ quote, isLoading: false });
    } catch (err: unknown) {
      if (this.reqKey !== key) return;
      log.error('Failed to fetch checkout quote', { err });
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Unable to calculate pricing';
      this.setState({ quote: null, isLoading: false, error: msg });
    }
  }
}

export interface UseCheckoutQuoteVMResult extends CheckoutQuoteState {
  vm: CheckoutQuoteViewModel;
  refresh: () => void;
}

export function useCheckoutQuoteVM(selection: PricingQuoteRequest | null): UseCheckoutQuoteVMResult {
  const [vm] = useState(() => new CheckoutQuoteViewModel(selection));
  const state = useVMState(vm);

  const selectionStr = JSON.stringify(selection);
  const [memo, setMemo] = useState({ str: selectionStr, obj: selection });
  useEffect(() => {
    if (memo.str !== selectionStr) {
      const t = setTimeout(() => setMemo({ str: selectionStr, obj: selection }), 0);
      return () => clearTimeout(t);
    }
  }, [selectionStr, selection, memo.str]);
  const selectionObj = memo.str === selectionStr ? memo.obj : selection;

  useEffect(() => {
    vm.setSelection(selectionObj);
    return () => { };
  }, [vm, selectionObj]);

  useEffect(() => () => vm.dispose(), [vm]);

  return { ...state, vm, refresh: vm.refresh };
}
