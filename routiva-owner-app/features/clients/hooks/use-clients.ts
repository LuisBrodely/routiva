import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { activateClient, createClient, deactivateClient, getClients, updateClient } from '../api/client-api';
import type { ClientFormInput } from '../schemas/client-schema';

function clientsQueryKey(empresaId: string) {
  return ['clients', empresaId] as const;
}

export function useClientsQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['clients', empresaId],
    queryFn: () => getClients(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useCreateClientMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ClientFormInput) => createClient(empresaId as string, input),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: clientsQueryKey(empresaId) });
    },
  });
}

export function useUpdateClientMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { clientId: string; input: ClientFormInput }) =>
      updateClient(params.clientId, params.input),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: clientsQueryKey(empresaId) });
    },
  });
}

export function useDeactivateClientMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => deactivateClient(clientId),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: clientsQueryKey(empresaId) });
    },
  });
}

export function useActivateClientMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => activateClient(clientId),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: clientsQueryKey(empresaId) });
    },
  });
}
