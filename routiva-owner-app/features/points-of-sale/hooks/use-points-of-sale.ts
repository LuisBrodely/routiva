import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPointOfSale,
  deactivatePointOfSale,
  getPointsOfSaleByEmpresa,
  getPointsOfSale,
  updatePointOfSale,
} from '../api/points-of-sale-api';
import type { PointOfSaleFormInput } from '../schemas/point-of-sale-schema';

function pointsQueryKey(empresaId: string, clienteId: string) {
  return ['points-of-sale', empresaId, clienteId] as const;
}

export function usePointsOfSaleQuery(empresaId: string | null, clienteId: string | null) {
  return useQuery({
    queryKey: ['points-of-sale', empresaId, clienteId],
    queryFn: () => getPointsOfSale(empresaId as string, clienteId as string),
    enabled: Boolean(empresaId && clienteId),
  });
}

export function usePointsOfSaleByEmpresaQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['points-of-sale-by-company', empresaId],
    queryFn: () => getPointsOfSaleByEmpresa(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useCreatePointMutation(empresaId: string | null, clienteId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PointOfSaleFormInput) =>
      createPointOfSale(empresaId as string, clienteId as string, input),
    onSuccess: async () => {
      if (!empresaId || !clienteId) return;
      await queryClient.invalidateQueries({ queryKey: pointsQueryKey(empresaId, clienteId) });
    },
  });
}

export function useUpdatePointMutation(empresaId: string | null, clienteId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { pointId: string; input: PointOfSaleFormInput }) =>
      updatePointOfSale(params.pointId, params.input),
    onSuccess: async () => {
      if (!empresaId || !clienteId) return;
      await queryClient.invalidateQueries({ queryKey: pointsQueryKey(empresaId, clienteId) });
    },
  });
}

export function useDeactivatePointMutation(empresaId: string | null, clienteId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pointId: string) => deactivatePointOfSale(pointId),
    onSuccess: async () => {
      if (!empresaId || !clienteId) return;
      await queryClient.invalidateQueries({ queryKey: pointsQueryKey(empresaId, clienteId) });
    },
  });
}
