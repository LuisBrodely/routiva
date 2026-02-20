import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  activateVendor,
  createVendor,
  deactivateVendor,
  getSellerUsers,
  getVendors,
  updateVendor,
} from '../api/vendor-api';
import type { VendorFormInput } from '../schemas/vendor-schema';

function vendorsQueryKey(empresaId: string) {
  return ['vendors', empresaId] as const;
}

export function useVendorsQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['vendors', empresaId],
    queryFn: () => getVendors(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useSellerUsersQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['seller-users', empresaId],
    queryFn: () => getSellerUsers(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useCreateVendorMutation(empresaId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorFormInput) => createVendor(empresaId as string, input),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: vendorsQueryKey(empresaId) });
    },
  });
}

export function useUpdateVendorMutation(empresaId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { vendorId: string; input: VendorFormInput }) => updateVendor(params.vendorId, params.input),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: vendorsQueryKey(empresaId) });
    },
  });
}

export function useActivateVendorMutation(empresaId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) => activateVendor(vendorId),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: vendorsQueryKey(empresaId) });
    },
  });
}

export function useDeactivateVendorMutation(empresaId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) => deactivateVendor(vendorId),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: vendorsQueryKey(empresaId) });
    },
  });
}
