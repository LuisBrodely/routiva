import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { getSellerLocationHistory, pushSellerLocation } from '../api/seller-tracking-api';

export function usePushSellerLocationMutation(empresaId: string | null, vendedorId: string | null) {
  return useMutation({
    mutationFn: (input: {
      latitud: number;
      longitud: number;
      precisionMetros?: number | null;
      velocidadKmh?: number | null;
      bateriaPorcentaje?: number | null;
    }) => pushSellerLocation(empresaId as string, vendedorId as string, input),
  });
}

export function useSellerLocationHistoryQuery(empresaId: string | null, vendedorId: string | null) {
  return useQuery({
    queryKey: ['seller-location-history', empresaId, vendedorId],
    queryFn: () => getSellerLocationHistory(empresaId as string, vendedorId as string),
    enabled: Boolean(empresaId && vendedorId),
    refetchInterval: 15000,
  });
}
