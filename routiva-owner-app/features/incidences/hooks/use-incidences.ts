import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createIncidence, getIncidences, getRouteStopsByEmpresa } from '../api/incidence-api';
import type { IncidenceFormInput } from '../schemas/incidence-schema';

function incidencesQueryKey(empresaId: string) {
  return ['incidences', empresaId] as const;
}

function incidenceRouteStopsQueryKey(empresaId: string, routeId: string | null) {
  return ['incidence-route-stops', empresaId, routeId] as const;
}

export function useIncidencesQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['incidences', empresaId],
    queryFn: () => getIncidences(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useIncidenceRouteStopsQuery(empresaId: string | null, routeId: string | null) {
  return useQuery({
    queryKey: ['incidence-route-stops', empresaId, routeId],
    queryFn: () => getRouteStopsByEmpresa(empresaId as string, routeId as string),
    enabled: Boolean(empresaId && routeId),
  });
}

export function useCreateIncidenceMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: IncidenceFormInput) => createIncidence(empresaId as string, input),
    onSuccess: async (_, variables) => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: incidencesQueryKey(empresaId) });
      await queryClient.invalidateQueries({ queryKey: ['routes', empresaId] });
      if (variables.rutaId) {
        await queryClient.invalidateQueries({ queryKey: incidenceRouteStopsQueryKey(empresaId, variables.rutaId) });
        await queryClient.invalidateQueries({ queryKey: ['route-stops', empresaId, variables.rutaId] });
      }
    },
  });
}
