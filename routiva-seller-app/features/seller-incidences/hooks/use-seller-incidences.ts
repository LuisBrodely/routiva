import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createSellerIncidence, getSellerIncidences } from '../api/seller-incidence-api';

export function useSellerIncidencesQuery(empresaId: string | null, vendedorId: string | null) {
  return useQuery({
    queryKey: ['seller-incidences', empresaId, vendedorId],
    queryFn: () => getSellerIncidences(empresaId as string, vendedorId as string),
    enabled: Boolean(empresaId && vendedorId),
    refetchInterval: 15000,
  });
}

export function useCreateSellerIncidenceMutation(empresaId: string | null, vendedorId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      clienteId: string;
      tipo: 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO';
      descripcion?: string;
      rutaParadaId?: string;
      evidencias?: Array<{ uri: string; name: string; mimeType?: string | null }>;
    }) => createSellerIncidence(empresaId as string, vendedorId as string, input),
    onSuccess: async () => {
      if (!empresaId || !vendedorId) return;
      await queryClient.invalidateQueries({ queryKey: ['seller-incidences', empresaId, vendedorId] });
      await queryClient.invalidateQueries({ queryKey: ['seller-route', empresaId, vendedorId] });
    },
  });
}
