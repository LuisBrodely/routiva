import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { activateProduct, createProduct, deactivateProduct, getProducts, updateProduct } from '../api/product-api';
import type { ProductFormInput } from '../schemas/product-schema';

function productsQueryKey(empresaId: string) {
  return ['products', empresaId] as const;
}

export function useProductsQuery(empresaId: string | null) {
  return useQuery({
    queryKey: ['products', empresaId],
    queryFn: () => getProducts(empresaId as string),
    enabled: Boolean(empresaId),
  });
}

export function useCreateProductMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProductFormInput) => createProduct(empresaId as string, input),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: productsQueryKey(empresaId) });
    },
  });
}

export function useUpdateProductMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { productId: string; input: ProductFormInput }) =>
      updateProduct(empresaId as string, params.productId, params.input),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: productsQueryKey(empresaId) });
    },
  });
}

export function useDeactivateProductMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deactivateProduct(productId),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: productsQueryKey(empresaId) });
    },
  });
}

export function useActivateProductMutation(empresaId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => activateProduct(productId),
    onSuccess: async () => {
      if (!empresaId) return;
      await queryClient.invalidateQueries({ queryKey: productsQueryKey(empresaId) });
    },
  });
}
