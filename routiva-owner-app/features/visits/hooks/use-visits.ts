import { useQuery } from '@tanstack/react-query';

import { getVisits } from '../api/visit-api';

export function useVisitsQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['visits', empresaId],
    queryFn: () => getVisits(empresaId as string),
    enabled: Boolean(empresaId),
    refetchInterval: 15000,
  });
}
