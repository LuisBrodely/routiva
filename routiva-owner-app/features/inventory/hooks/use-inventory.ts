import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createInventoryMovement,
  getInventoryMovements,
  getInventorySummary,
} from '../api/inventory-api';
import type { InventoryMovementFormInput } from '../schemas/inventory-schema';

function inventorySummaryQueryKey(empresaId: string) {
  return ['inventory-summary', empresaId] as const;
}

function inventoryMovementsQueryKey(empresaId: string) {
  return ['inventory-movements', empresaId] as const;
}

export function useInventorySummaryQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['inventory-summary', empresaId],
    queryFn: () => getInventorySummary(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useInventoryMovementsQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['inventory-movements', empresaId],
    queryFn: () => getInventoryMovements(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useCreateInventoryMovementMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InventoryMovementFormInput) => createInventoryMovement(empresaId as string, input),
    onSuccess: async () => {
      if (!empresaId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inventorySummaryQueryKey(empresaId) }),
        queryClient.invalidateQueries({ queryKey: inventoryMovementsQueryKey(empresaId) }),
        queryClient.invalidateQueries({ queryKey: ['products', empresaId] }),
      ]);
    },
  });
}
