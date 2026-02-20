import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useActivateProductMutation,
  useCreateProductMutation,
  useDeactivateProductMutation,
  useProductsQuery,
  useUpdateProductMutation,
} from '@/features/products/hooks/use-products';
import { productSchema, type ProductFormInput, type ProductItem } from '@/features/products/schemas/product-schema';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

export default function ProductsScreen() {
  const empresaId = useSessionStore((state) => state.empresaId);
  const { data: products, isLoading, isError, error } = useProductsQuery(empresaId);

  const createProductMutation = useCreateProductMutation(empresaId);
  const updateProductMutation = useUpdateProductMutation(empresaId);
  const deactivateProductMutation = useDeactivateProductMutation(empresaId);
  const activateProductMutation = useActivateProductMutation(empresaId);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductItem | null>(null);
  const [deactivatingProduct, setDeactivatingProduct] = React.useState<ProductItem | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: '',
      unidad: '',
      precio: '',
    },
  });

  function openCreateDialog() {
    setEditingProduct(null);
    reset({ nombre: '', unidad: '', precio: '' });
    setIsFormOpen(true);
  }

  function openEditDialog(product: ProductItem) {
    setEditingProduct(product);
    reset({
      nombre: product.nombre,
      unidad: product.unidad,
      precio: product.precioActual !== null ? String(product.precioActual) : '',
    });
    setIsFormOpen(true);
  }

  async function onSubmit(input: ProductFormInput) {
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ productId: editingProduct.id, input });
      } else {
        await createProductMutation.mutateAsync(input);
      }
      setIsFormOpen(false);
    } catch {
      return;
    }
  }

  async function confirmDeactivateProduct() {
    if (!deactivatingProduct) return;
    try {
      await deactivateProductMutation.mutateAsync(deactivatingProduct.id);
    } finally {
      setDeactivatingProduct(null);
    }
  }

  const isSaving = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-32 pt-3"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Productos</Text>
        </View>

        <View>
          <Button className="h-11 rounded-xl" onPress={openCreateDialog} disabled={!empresaId}>
            <Text>Nuevo producto</Text>
          </Button>
        </View>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator />
          </View>
        ) : null}

        {isError ? (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">{(error as Error).message}</Text>
          </View>
        ) : null}

        {(products ?? []).map((product) => (
          <View
            key={product.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text variant="large">{product.nombre}</Text>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pressable
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: product.activo ? '#10b981' : '#ef4444' }}
                      accessibilityRole="button"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>{product.activo ? 'Producto activo' : 'Producto inactivo'}</Text>
                  </TooltipContent>
                </Tooltip>
              </View>
              <Text className="text-muted-foreground">Unidad: {product.unidad}</Text>
              <Text className="text-muted-foreground">
                Precio vigente: {product.precioActual !== null ? `$${product.precioActual.toFixed(2)}` : 'Sin precio'}
              </Text>
            </View>

            <View className="mt-4 border-t border-slate-200 pt-4 dark:border-zinc-800" />

            <View className="flex-row flex-wrap gap-2">
              <Button variant="outline" onPress={() => openEditDialog(product)}>
                <Text>Editar</Text>
              </Button>
              <Button
                variant="destructive"
                onPress={() => setDeactivatingProduct(product)}
                disabled={!product.activo || deactivateProductMutation.isPending}>
                <Text>Desactivar</Text>
              </Button>
              {!product.activo ? (
                <Button
                  variant="secondary"
                  onPress={() => activateProductMutation.mutate(product.id)}
                  disabled={activateProductMutation.isPending}>
                  <Text>{activateProductMutation.isPending ? 'Activando...' : 'Activar'}</Text>
                </Button>
              ) : null}
            </View>
          </View>
        ))}

        {!isLoading && !isError && (products ?? []).length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              Aun no tienes productos
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Crea tu primer producto para usarlo en precios y operaciones.
            </Text>
            <View className="mt-4 w-full">
              <Button onPress={openCreateDialog} disabled={!empresaId}>
                <Text>Crear producto</Text>
              </Button>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>Completa la informacion del producto.</DialogDescription>
          </DialogHeader>

          <View className="mt-4 gap-4">
            <View className="gap-1">
              <Label>Nombre</Label>
              <Controller
                control={control}
                name="nombre"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Refresco 600ml" />
                )}
              />
              {errors.nombre ? <Text className="text-destructive">{errors.nombre.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Label>Unidad</Label>
              <Controller
                control={control}
                name="unidad"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="pieza" />
                )}
              />
              {errors.unidad ? <Text className="text-destructive">{errors.unidad.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Label>Precio</Label>
              <Controller
                control={control}
                name="precio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="25.50" />
                )}
              />
              {errors.precio ? <Text className="text-destructive">{errors.precio.message}</Text> : null}
            </View>

            {createProductMutation.error ? (
              <Text className="text-destructive">{createProductMutation.error.message}</Text>
            ) : null}
            {updateProductMutation.error ? (
              <Text className="text-destructive">{updateProductMutation.error.message}</Text>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onPress={() => setIsFormOpen(false)}>
                <Text>Cancelar</Text>
              </Button>
              <Button onPress={handleSubmit(onSubmit)} disabled={isSaving || !empresaId}>
                <Text>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
              </Button>
            </DialogFooter>
          </View>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deactivatingProduct)} onOpenChange={(open) => !open && setDeactivatingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar producto</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingProduct
                ? `Se desactivara ${deactivatingProduct.nombre}.`
                : 'Esta accion desactivara el producto.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">
                <Text>Cancelar</Text>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onPress={confirmDeactivateProduct} disabled={deactivateProductMutation.isPending}>
                <Text>{deactivateProductMutation.isPending ? 'Desactivando...' : 'Desactivar'}</Text>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
