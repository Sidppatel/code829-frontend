import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchasesApi } from '../services/purchasesApi';
import type { CreatePurchaseRequest } from '../services/PurchaseService';
import { queryKeys } from './keys';

export function usePurchasesQuery() {
  return useQuery({
    queryKey: queryKeys.purchases.mine(),
    queryFn: async () => (await purchasesApi.getMine()).data,
  });
}

export function usePurchaseDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.purchases.detail(id ?? ''),
    queryFn: async () => (await purchasesApi.getById(id!)).data,
    enabled: !!id,
  });
}

export function useCreatePurchaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreatePurchaseRequest) => (await purchasesApi.create(req)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all }),
  });
}

export function useConfirmPurchaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentIntentId: string) =>
      (await purchasesApi.confirmByPaymentIntent(paymentIntentId)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all }),
  });
}

export function useCancelPurchaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await purchasesApi.cancel(id)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all }),
  });
}
