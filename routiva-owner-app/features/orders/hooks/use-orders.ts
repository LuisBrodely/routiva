import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { confirmOrder, createOrderDraft, getOrderItems, getOrders } from '../api/order-api';
import type { OrderFormInput } from '../schemas/order-schema';

function ordersQueryKey(empresaId: string) {
  return ['orders', empresaId] as const;
}

function orderItemsQueryKey(empresaId: string, orderId: string | null) {
  return ['order-items', empresaId, orderId] as const;
}

export function useOrdersQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['orders', empresaId],
    queryFn: () => getOrders(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useOrderItemsQuery(empresaId: string | null, orderId: string | null) {
  return useQuery({
    queryKey: ['order-items', empresaId, orderId],
    queryFn: () => getOrderItems(empresaId as string, orderId as string),
    enabled: Boolean(empresaId && orderId),
  });
}

export function useCreateOrderDraftMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OrderFormInput) => createOrderDraft(empresaId as string, input),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: ordersQueryKey(empresaId) });
    },
  });
}

export function useConfirmOrderMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => confirmOrder(empresaId as string, orderId),
    onSuccess: async (_, orderId) => {
      if (!empresaId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKey(empresaId) }),
        queryClient.invalidateQueries({ queryKey: orderItemsQueryKey(empresaId, orderId) }),
        queryClient.invalidateQueries({ queryKey: ['inventory-summary', empresaId] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-movements', empresaId] }),
      ]);
    },
  });
}
