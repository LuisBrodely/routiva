import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createOrderForStop,
  getActiveProductsWithPrice,
  getTodaySellerRoute,
  registerCheckIn,
  registerCheckOut,
} from '../api/seller-route-api';
import type { CheckOutInput, OrderDraftItem, StopCoordinateInput } from '../schemas/route-schema';

function sellerRouteQueryKey(empresaId: string, vendedorId: string) {
  return ['seller-route', empresaId, vendedorId] as const;
}

export function useTodaySellerRouteQuery(empresaId: string | null, vendedorId: string | null) {
  return useQuery({
    queryKey: ['seller-route', empresaId, vendedorId],
    queryFn: () => getTodaySellerRoute(empresaId as string, vendedorId as string),
    enabled: Boolean(empresaId && vendedorId),
    refetchInterval: 10000,
  });
}

export function useActiveProductsQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['seller-active-products', empresaId],
    queryFn: () => getActiveProductsWithPrice(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useCheckInMutation(empresaId: string | null, vendedorId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { routeStopId: string; location: StopCoordinateInput }) =>
      registerCheckIn(empresaId as string, vendedorId as string, params.routeStopId, params.location),
    onSuccess: async () => {
      if (!empresaId || !vendedorId) return;
      await queryClient.invalidateQueries({ queryKey: sellerRouteQueryKey(empresaId, vendedorId) });
      await queryClient.invalidateQueries({ queryKey: ['seller-orders', empresaId, vendedorId] });
      await queryClient.invalidateQueries({ queryKey: ['seller-incidences', empresaId, vendedorId] });
    },
  });
}

export function useCheckOutMutation(empresaId: string | null, vendedorId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { routeStopId: string; input: CheckOutInput }) =>
      registerCheckOut(empresaId as string, vendedorId as string, params.routeStopId, params.input),
    onSuccess: async () => {
      if (!empresaId || !vendedorId) return;
      await queryClient.invalidateQueries({ queryKey: sellerRouteQueryKey(empresaId, vendedorId) });
      await queryClient.invalidateQueries({ queryKey: ['seller-orders', empresaId, vendedorId] });
      await queryClient.invalidateQueries({ queryKey: ['seller-incidences', empresaId, vendedorId] });
    },
  });
}

export function useCreateOrderForStopMutation(empresaId: string | null, vendedorId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { routeStopId: string; items: OrderDraftItem[] }) =>
      createOrderForStop(empresaId as string, vendedorId as string, params.routeStopId, params.items),
    onSuccess: async () => {
      if (!empresaId || !vendedorId) return;
      await queryClient.invalidateQueries({ queryKey: sellerRouteQueryKey(empresaId, vendedorId) });
      await queryClient.invalidateQueries({ queryKey: ['seller-orders', empresaId, vendedorId] });
    },
  });
}
