import { useQuery } from '@tanstack/react-query';

import { getSellerInventory } from '../api/seller-inventory-api';

export function useSellerInventoryQuery(empresaId: string | null, vendedorId: string | null) {
  return useQuery({
    queryKey: ['seller-inventory', empresaId, vendedorId],
    queryFn: () => getSellerInventory(empresaId as string, vendedorId as string),
    enabled: Boolean(empresaId && vendedorId),
    refetchInterval: 15000,
  });
}
