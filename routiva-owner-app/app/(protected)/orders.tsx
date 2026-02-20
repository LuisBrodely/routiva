import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { useClientsQuery } from '@/features/clients/hooks/use-clients';
import {
  useConfirmOrderMutation,
  useCreateOrderDraftMutation,
  useOrderItemsQuery,
  useOrdersQuery,
} from '@/features/orders/hooks/use-orders';
import { orderSchema, type OrderFormInput } from '@/features/orders/schemas/order-schema';
import { usePointsOfSaleByEmpresaQuery } from '@/features/points-of-sale/hooks/use-points-of-sale';
import { useProductsQuery } from '@/features/products/hooks/use-products';
import { useVendorsQuery } from '@/features/vendors/hooks/use-vendors';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusStyle: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-700',
  CONFIRMADO: 'bg-emerald-100 text-emerald-800',
  ENTREGADO: 'bg-indigo-100 text-indigo-800',
  CANCELADO: 'bg-rose-100 text-rose-800',
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }) ?? insets.bottom,
    left: 12,
    right: 12,
  };

  const empresaId = useSessionStore((state) => state.empresaId);

  const { data: orders, isLoading, isError, error } = useOrdersQuery(empresaId);
  const { data: clients } = useClientsQuery(empresaId);
  const { data: points } = usePointsOfSaleByEmpresaQuery(empresaId);
  const { data: products } = useProductsQuery(empresaId);
  const { data: vendors } = useVendorsQuery(empresaId);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  const createOrderMutation = useCreateOrderDraftMutation(empresaId);
  const confirmOrderMutation = useConfirmOrderMutation(empresaId);
  const { data: selectedOrderItems } = useOrderItemsQuery(empresaId, selectedOrderId);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, submitCount },
  } = useForm<OrderFormInput>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clienteId: '',
      puntoVentaId: '',
      vendedorId: '',
      items: [{ productoId: '', cantidad: '1' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedClienteId = watch('clienteId');

  const activeClients = (clients ?? []).filter((item) => item.activo);
  const activePoints = (points ?? []).filter((item) => item.activo && item.clienteId === selectedClienteId);
  const activeProducts = (products ?? []).filter((item) => item.activo);
  const activeVendors = (vendors ?? []).filter((item) => item.status === 'ACTIVO');

  function openCreateDialog() {
    reset({
      clienteId: '',
      puntoVentaId: '',
      vendedorId: '',
      items: [{ productoId: '', cantidad: '1' }],
    });
    setIsFormOpen(true);
  }

  async function onSubmit(input: OrderFormInput) {
    try {
      await createOrderMutation.mutateAsync(input);
      setIsFormOpen(false);
    } catch {
      return;
    }
  }

  async function handleConfirmOrder(orderId: string) {
    try {
      await confirmOrderMutation.mutateAsync(orderId);
    } catch {
      return;
    }
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-32 pt-3"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Pedidos</Text>
          <Text className="text-muted-foreground">Crea pedidos en borrador y confirma para descontar inventario.</Text>
        </View>

        <Button className="h-11 rounded-xl" onPress={openCreateDialog} disabled={!empresaId}>
          <Text>Nuevo pedido</Text>
        </Button>

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

        {(orders ?? []).map((order) => (
          <View
            key={order.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="mb-2 flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text variant="large">{order.clienteNombre}</Text>
                <Text className="text-muted-foreground">Punto: {order.puntoVentaNombre}</Text>
                <Text className="text-muted-foreground">Vendedor: {order.vendedorNombre}</Text>
                <Text className="text-xs text-muted-foreground">{formatDate(order.fecha)}</Text>
              </View>
              <Text
                className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[order.estatus] ?? 'bg-slate-100 text-slate-700'}`}>
                {order.estatus}
              </Text>
            </View>

            <Text className="mb-3 text-xl font-bold text-foreground">${order.total.toFixed(2)}</Text>

            <View className="flex-row flex-wrap gap-2">
              <Button variant="outline" onPress={() => setSelectedOrderId(order.id)}>
                <Text>Ver items</Text>
              </Button>
              {order.estatus === 'BORRADOR' ? (
                <Button onPress={() => handleConfirmOrder(order.id)} disabled={confirmOrderMutation.isPending}>
                  <Text>{confirmOrderMutation.isPending ? 'Confirmando...' : 'Confirmar'}</Text>
                </Button>
              ) : null}
            </View>
          </View>
        ))}

        {!isLoading && !isError && (orders ?? []).length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              Aun no tienes pedidos
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Crea el primer pedido para iniciar la operacion comercial.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pedido</DialogTitle>
            <DialogDescription>Configura cliente, punto, vendedor y productos del pedido.</DialogDescription>
          </DialogHeader>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              className="max-h-[540px]"
              contentContainerClassName="gap-4 pt-4"
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled">
              <View className="gap-1">
                <Text className="text-sm font-medium text-foreground">Cliente</Text>
                <Controller
                  control={control}
                  name="clienteId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? { value, label: activeClients.find((item) => item.id === value)?.nombreCompleto ?? 'Cliente' }
                          : undefined
                      }
                      onValueChange={(option) => {
                        onChange(option?.value ?? '');
                        setValue('puntoVentaId', '');
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona cliente" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Clientes</SelectLabel>
                          {activeClients.map((item) => (
                            <SelectItem key={item.id} label={item.nombreCompleto} value={item.id}>
                              {item.nombreCompleto}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {submitCount > 0 && errors.clienteId ? <Text className="text-destructive">{errors.clienteId.message}</Text> : null}
              </View>

              <View className="gap-1">
                <Text className="text-sm font-medium text-foreground">Punto de venta</Text>
                <Controller
                  control={control}
                  name="puntoVentaId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? { value, label: activePoints.find((item) => item.id === value)?.nombre ?? 'Punto de venta' }
                          : undefined
                      }
                      onValueChange={(option) => onChange(option?.value ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona punto de venta" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Puntos de venta</SelectLabel>
                          {activePoints.map((item) => (
                            <SelectItem key={item.id} label={item.nombre} value={item.id}>
                              {item.nombre}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {submitCount > 0 && errors.puntoVentaId ? <Text className="text-destructive">{errors.puntoVentaId.message}</Text> : null}
              </View>

              <View className="gap-1">
                <Text className="text-sm font-medium text-foreground">Vendedor</Text>
                <Controller
                  control={control}
                  name="vendedorId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? {
                              value,
                              label: activeVendors.find((item) => item.id === value)?.nombreCompleto ?? 'Vendedor',
                            }
                          : undefined
                      }
                      onValueChange={(option) => onChange(option?.value ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona vendedor" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Vendedores</SelectLabel>
                          {activeVendors.map((item) => (
                            <SelectItem key={item.id} label={item.nombreCompleto} value={item.id}>
                              {item.nombreCompleto}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {submitCount > 0 && errors.vendedorId ? <Text className="text-destructive">{errors.vendedorId.message}</Text> : null}
              </View>

              <View className="gap-3">
                <Text className="text-sm font-medium text-foreground">Productos</Text>
                {fields.map((field, index) => (
                  <View key={field.id} className="rounded-2xl border border-slate-200 p-3">
                    <View className="gap-2">
                      <Controller
                        control={control}
                        name={`items.${index}.productoId`}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            value={
                              value
                                ? {
                                    value,
                                    label: activeProducts.find((item) => item.id === value)?.nombre ?? 'Producto',
                                  }
                                : undefined
                            }
                            onValueChange={(option) => onChange(option?.value ?? '')}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona producto" />
                            </SelectTrigger>
                            <SelectContent insets={contentInsets}>
                              <SelectGroup>
                                <SelectLabel>Productos</SelectLabel>
                                {activeProducts.map((item) => (
                                  <SelectItem key={item.id} label={item.nombre} value={item.id}>
                                    {item.nombre}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`items.${index}.cantidad`}
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input
                            keyboardType="decimal-pad"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            placeholder="Cantidad"
                          />
                        )}
                      />

                      {fields.length > 1 ? (
                        <Button variant="outline" onPress={() => remove(index)}>
                          <Text>Quitar</Text>
                        </Button>
                      ) : null}

                      {submitCount > 0 && errors.items?.[index]?.productoId ? (
                        <Text className="text-destructive">{submitCount > 0 && errors.items[index]?.productoId?.message}</Text>
                      ) : null}
                      {submitCount > 0 && errors.items?.[index]?.cantidad ? (
                        <Text className="text-destructive">{submitCount > 0 && errors.items[index]?.cantidad?.message}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}

                <Button
                  variant="outline"
                  onPress={() => append({ productoId: '', cantidad: '1' })}
                  disabled={!activeProducts.length}>
                  <Text>Agregar producto</Text>
                </Button>
              </View>

              {createOrderMutation.error ? <Text className="text-destructive">{createOrderMutation.error.message}</Text> : null}
            </ScrollView>
          </TouchableWithoutFeedback>

          <DialogFooter>
            <Button variant="outline" onPress={() => setIsFormOpen(false)}>
              <Text>Cancelar</Text>
            </Button>
            <Button onPress={handleSubmit(onSubmit)} disabled={createOrderMutation.isPending || !empresaId}>
              <Text>{createOrderMutation.isPending ? 'Guardando...' : 'Crear borrador'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedOrderId)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
            <DialogDescription>Productos registrados en este pedido.</DialogDescription>
          </DialogHeader>

          <ScrollView
            className="max-h-[400px]"
            contentContainerClassName="gap-3 pt-4"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled">
            {(selectedOrderItems ?? []).map((item) => (
              <View key={item.id} className="rounded-2xl border border-slate-200 p-3">
                <Text className="font-medium text-foreground">{item.productoNombre}</Text>
                <Text className="text-muted-foreground">Cantidad: {item.cantidad.toFixed(2)}</Text>
                <Text className="text-muted-foreground">Precio: ${item.precioUnitario.toFixed(2)}</Text>
                <Text className="font-semibold text-foreground">Subtotal: ${item.subtotal.toFixed(2)}</Text>
              </View>
            ))}

            {selectedOrderId && !(selectedOrderItems ?? []).length ? (
              <Text className="text-muted-foreground">Sin items disponibles.</Text>
            ) : null}
          </ScrollView>

          <DialogFooter>
            <Button variant="outline" onPress={() => setSelectedOrderId(null)}>
              <Text>Cerrar</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
