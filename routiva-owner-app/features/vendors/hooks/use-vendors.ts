import { useQuery } from '@tanstack/react-query';

import { getVendors } from '../api/vendor-api';

export function useVendorsQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['vendors', empresaId],
    queryFn: () => getVendors(empresaId as string),
    enabled: Boolean(empresaId),
  });
}
