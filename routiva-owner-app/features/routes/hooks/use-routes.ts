import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createRoute, getRouteStops, getRoutes } from '../api/route-api';
import type { RouteFormInput } from '../schemas/route-schema';

function routesQueryKey(empresaId: string) {
  return ['routes', empresaId] as const;
}

function routeStopsQueryKey(empresaId: string, routeId: string | null) {
  return ['route-stops', empresaId, routeId] as const;
}

export function useRoutesQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['routes', empresaId],
    queryFn: () => getRoutes(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useRouteStopsQuery(empresaId: string | null, routeId: string | null) {
  return useQuery({
    queryKey: ['route-stops', empresaId, routeId],
    queryFn: () => getRouteStops(empresaId as string, routeId as string),
    enabled: Boolean(empresaId && routeId),
  });
}

export function useCreateRouteMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RouteFormInput) => createRoute(empresaId as string, input),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: routesQueryKey(empresaId) });
    },
  });
}

export function useRefreshRouteStops(empresaId: string | null, routeId: string | null) {
  const queryClient = useQueryClient();

  return async function refreshRouteStops() {
    if (!empresaId || !routeId) return;
    await queryClient.invalidateQueries({ queryKey: routeStopsQueryKey(empresaId, routeId) });
  };
}
