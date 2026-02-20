import { useQuery } from '@tanstack/react-query';

import { getSellerOrders } from '../api/seller-order-api';

export function useSellerOrdersQuery(empresaId: string | null, vendedorId: string | null) {
  return useQuery({
    queryKey: ['seller-orders', empresaId, vendedorId],
    queryFn: () => getSellerOrders(empresaId as string, vendedorId as string),
    enabled: Boolean(empresaId && vendedorId),
    refetchInterval: 15000,
  });
}
