import { useQuery } from '@tanstack/react-query';

import { getLiveVendorPositions, getVendorLocationHistory } from '../api/tracking-api';

export function useLiveVendorPositionsQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['tracking-live-vendors', empresaId],
    queryFn: () => getLiveVendorPositions(empresaId as string),
    enabled: Boolean(empresaId),
    refetchInterval: 15000,
  });
}

export function useVendorLocationHistoryQuery(empresaId: string | null, vendedorId: string | null) {
  return useQuery({
    queryKey: ['tracking-history', empresaId, vendedorId],
    queryFn: () => getVendorLocationHistory(empresaId as string, vendedorId as string),
    enabled: Boolean(empresaId && vendedorId),
    refetchInterval: 20000,
  });
}
