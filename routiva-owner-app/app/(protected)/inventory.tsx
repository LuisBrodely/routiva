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
import { Label } from '@/components/ui/label';
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
import {
  useCreateInventoryMovementMutation,
  useInventoryMovementsQuery,
  useInventorySummaryQuery,
  useTransferInventoryToVendorMutation,
  useVendorInventorySummaryQuery,
} from '@/features/inventory/hooks/use-inventory';
import {
  inventoryTransferSchema,
  inventoryMovementSchema,
  inventoryMovementTypes,
  type InventoryMovementFormInput,
  type InventoryTransferFormInput,
} from '@/features/inventory/schemas/inventory-schema';
import { useVendorsQuery } from '@/features/vendors/hooks/use-vendors';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
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

const movementLabels: Record<(typeof inventoryMovementTypes)[number], string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  MERMA: 'Merma',
  AJUSTE: 'Ajuste',
};

const movementStyles: Record<string, string> = {
  ENTRADA: 'text-emerald-700',
  SALIDA: 'text-amber-700',
  MERMA: 'text-rose-700',
  AJUSTE: 'text-sky-700',
  VENTA: 'text-indigo-700',
};
const LOW_STOCK_THRESHOLD = 5;

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }) ?? insets.bottom,
    left: 12,
    right: 12,
  };

  const empresaId = useSessionStore((state) => state.empresaId);
  const { data: inventory, isLoading: isLoadingInventory, isError: isInventoryError, error: inventoryError } =
    useInventorySummaryQuery(empresaId);
  const {
    data: movements,
    isLoading: isLoadingMovements,
    isError: isMovementsError,
    error: movementsError,
  } = useInventoryMovementsQuery(empresaId);
  const { data: vendorInventory } = useVendorInventorySummaryQuery(empresaId);
  const { data: vendors } = useVendorsQuery(empresaId);

  const createMovementMutation = useCreateInventoryMovementMutation(empresaId);
  const transferInventoryMutation = useTransferInventoryToVendorMutation(empresaId);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);

  const {
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<InventoryMovementFormInput>({
    resolver: zodResolver(inventoryMovementSchema),
    defaultValues: {
      productoId: '',
      tipo: 'ENTRADA',
      cantidad: '',
    },
  });

  const selectedType = watch('tipo');
  const {
    control: transferControl,
    handleSubmit: handleTransferSubmit,
    reset: resetTransfer,
    formState: { errors: transferErrors, submitCount: transferSubmitCount },
  } = useForm<InventoryTransferFormInput>({
    resolver: zodResolver(inventoryTransferSchema),
    defaultValues: {
      productoId: '',
      vendedorId: '',
      direccion: 'ASIGNAR',
      cantidad: '',
    },
  });

  function openMovementDialog(productoId?: string) {
    reset({ productoId: productoId ?? '', tipo: 'ENTRADA', cantidad: '' });
    setIsFormOpen(true);
  }

  function openTransferDialog(productoId?: string) {
    resetTransfer({ productoId: productoId ?? '', vendedorId: '', direccion: 'ASIGNAR', cantidad: '' });
    setIsTransferOpen(true);
  }

  async function onSubmit(input: InventoryMovementFormInput) {
    try {
      await createMovementMutation.mutateAsync(input);
      setIsFormOpen(false);
    } catch {
      return;
    }
  }

  async function onTransferSubmit(input: InventoryTransferFormInput) {
    try {
      await transferInventoryMutation.mutateAsync(input);
      setIsTransferOpen(false);
    } catch {
      return;
    }
  }

  const totalWarehouse = (inventory ?? []).reduce((sum, item) => sum + item.cantidadAlmacen, 0);
  const totalAssigned = (inventory ?? []).reduce((sum, item) => sum + item.cantidadAsignada, 0);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-32 pt-3"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Inventario</Text>
          <Text className="text-muted-foreground">Control de almacén y asignaciones por vendedor.</Text>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted-foreground">Almacén</Text>
              <Text className="text-xl font-semibold text-foreground">{Math.trunc(totalWarehouse)}</Text>
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">Asignado a vendedores</Text>
              <Text className="text-xl font-semibold text-foreground">{Math.trunc(totalAssigned)}</Text>
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">Total operativo</Text>
              <Text className="text-xl font-semibold text-foreground">{Math.trunc(totalWarehouse + totalAssigned)}</Text>
            </View>
          </View>
        </View>

        {isLoadingInventory ? (
          <View className="items-center py-8">
            <ActivityIndicator />
          </View>
        ) : null}

        {isInventoryError ? (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">{(inventoryError as Error).message}</Text>
          </View>
        ) : null}

        {(inventory ?? []).map((item) => (
          <Pressable
            key={item.productoId}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 active:opacity-90 dark:border-zinc-800 dark:bg-zinc-900"
            onPress={() => openMovementDialog(item.productoId)}>
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1 gap-1">
                <Text variant="large">{item.productoNombre}</Text>
                <Text className="text-muted-foreground">Unidad: {item.unidad}</Text>
                <Text className="text-xs text-muted-foreground">Almacén: {Math.trunc(item.cantidadAlmacen)}</Text>
                <Text className="text-xs text-muted-foreground">Asignado: {Math.trunc(item.cantidadAsignada)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted-foreground">Total</Text>
                <Text className="text-2xl font-bold text-foreground">{Math.trunc(item.cantidadTotal)}</Text>
              </View>
            </View>
            <View className="mt-3 flex-row gap-2">
              <Button variant="outline" onPress={() => openMovementDialog(item.productoId)}>
                <Text>Movimiento almacén</Text>
              </Button>
              <Button variant="secondary" onPress={() => openTransferDialog(item.productoId)}>
                <Text>Transferir vendedor</Text>
              </Button>
            </View>
          </Pressable>
        ))}

        {!isLoadingInventory && !isInventoryError && (inventory ?? []).length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              No hay productos para inventario
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Primero registra productos para comenzar a controlar existencias.
            </Text>
          </View>
        ) : null}

        <View className="mt-2">
          <Text className="text-xl font-semibold text-foreground">Movimientos recientes</Text>
        </View>

        {isLoadingMovements ? (
          <View className="items-center py-4">
            <ActivityIndicator />
          </View>
        ) : null}

        {isMovementsError ? (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">{(movementsError as Error).message}</Text>
          </View>
        ) : null}

        {(movements ?? []).map((movement) => (
          <View
            key={movement.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-medium text-foreground">{movement.productoNombre}</Text>
                <Text className="text-xs text-muted-foreground">{formatDate(movement.fecha)}</Text>
              </View>
              <View className="items-end">
                <Text className={movementStyles[movement.tipo] ?? 'text-foreground'}>
                  {movementLabels[movement.tipo as keyof typeof movementLabels] ?? movement.tipo}
                </Text>
                <Text className="font-semibold text-foreground">{Math.trunc(movement.cantidad)}</Text>
              </View>
            </View>
            {movement.referenciaTipo === 'AJUSTE' && movement.referenciaDetalle ? (
              <Text className="mt-1 text-xs text-muted-foreground">Transferencia a vendedor: {movement.referenciaDetalle}</Text>
            ) : null}
            {movement.referenciaTipo === 'DEVOLUCION' && movement.referenciaDetalle ? (
              <Text className="mt-1 text-xs text-muted-foreground">Devolucion de vendedor: {movement.referenciaDetalle}</Text>
            ) : null}
          </View>
        ))}

        {!isLoadingMovements && !isMovementsError && (movements ?? []).length === 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-muted-foreground">Aun no hay movimientos registrados.</Text>
          </View>
        ) : null}

        <View className="mt-2">
          <Text className="text-xl font-semibold text-foreground">Inventario por vendedor</Text>
        </View>

        {(vendorInventory ?? []).map((item) => (
          <View
            key={`${item.vendedorId}-${item.productoId}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium text-foreground">{item.vendedorNombre}</Text>
                <Text className="text-xs text-muted-foreground">{item.productoNombre} • {item.unidad}</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-semibold text-foreground">{Math.trunc(item.cantidad)}</Text>
                {item.cantidad <= LOW_STOCK_THRESHOLD ? (
                  <Text className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    STOCK BAJO
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ))}

        {!(vendorInventory ?? []).length ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-muted-foreground">No hay inventario asignado a vendedores.</Text>
          </View>
        ) : null}
      </ScrollView>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>Actualiza existencias en almacen para un producto.</DialogDescription>
          </DialogHeader>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="mt-4 gap-4">
              <View className="gap-1">
                <Label>Producto</Label>
                <Controller
                  control={control}
                  name="productoId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? {
                              value,
                              label:
                                (inventory ?? []).find((item) => item.productoId === value)?.productoNombre ?? 'Producto',
                            }
                          : undefined
                      }
                      onValueChange={(option) => onChange(option?.value ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Productos</SelectLabel>
                          {(inventory ?? []).map((item) => (
                            <SelectItem key={item.productoId} label={item.productoNombre} value={item.productoId}>
                              {item.productoNombre}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {submitCount > 0 && errors.productoId ? <Text className="text-destructive">{errors.productoId.message}</Text> : null}
              </View>

              <View className="gap-1">
                <Label>Tipo de movimiento</Label>
                <Controller
                  control={control}
                  name="tipo"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value ? { value, label: movementLabels[value] } : undefined}
                      onValueChange={(option) => onChange((option?.value as InventoryMovementFormInput['tipo']) ?? 'ENTRADA')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Tipos</SelectLabel>
                          {inventoryMovementTypes.map((type) => (
                            <SelectItem key={type} label={movementLabels[type]} value={type}>
                              {movementLabels[type]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {submitCount > 0 && errors.tipo ? <Text className="text-destructive">{errors.tipo.message}</Text> : null}
              </View>

              <View className="gap-1">
                <Label>{selectedType === 'AJUSTE' ? 'Existencia objetivo' : 'Cantidad'}</Label>
                <Controller
                  control={control}
                  name="cantidad"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      keyboardType="number-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder={selectedType === 'AJUSTE' ? 'Ej. 120' : 'Ej. 10'}
                    />
                  )}
                />
                {submitCount > 0 && errors.cantidad ? <Text className="text-destructive">{errors.cantidad.message}</Text> : null}
              </View>

              {createMovementMutation.error ? (
                <Text className="text-destructive">{createMovementMutation.error.message}</Text>
              ) : null}

              <DialogFooter>
                <Button variant="outline" onPress={() => setIsFormOpen(false)}>
                  <Text>Cancelar</Text>
                </Button>
                <Button onPress={handleSubmit(onSubmit)} disabled={createMovementMutation.isPending || !empresaId}>
                  <Text>{createMovementMutation.isPending ? 'Guardando...' : 'Guardar'}</Text>
                </Button>
              </DialogFooter>
            </View>
          </TouchableWithoutFeedback>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir inventario</DialogTitle>
            <DialogDescription>Asigna inventario a vendedor o devuélvelo al almacén.</DialogDescription>
          </DialogHeader>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="mt-4 gap-4">
              <View className="gap-1">
                <Label>Producto</Label>
                <Controller
                  control={transferControl}
                  name="productoId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? {
                              value,
                              label: (inventory ?? []).find((item) => item.productoId === value)?.productoNombre ?? 'Producto',
                            }
                          : undefined
                      }
                      onValueChange={(option) => onChange(option?.value ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Productos</SelectLabel>
                          {(inventory ?? []).map((item) => (
                            <SelectItem key={item.productoId} label={item.productoNombre} value={item.productoId}>
                              {item.productoNombre}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {transferSubmitCount > 0 && transferErrors.productoId ? (
                  <Text className="text-destructive">{transferErrors.productoId.message}</Text>
                ) : null}
              </View>

              <View className="gap-1">
                <Label>Vendedor</Label>
                <Controller
                  control={transferControl}
                  name="vendedorId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? {
                              value,
                              label: (vendors ?? []).find((item) => item.id === value)?.nombreCompleto ?? 'Vendedor',
                            }
                          : undefined
                      }
                      onValueChange={(option) => onChange(option?.value ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona vendedor" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Vendedores activos</SelectLabel>
                          {(vendors ?? [])
                            .filter((item) => item.status === 'ACTIVO')
                            .map((item) => (
                              <SelectItem key={item.id} label={item.nombreCompleto} value={item.id}>
                                {item.nombreCompleto}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {transferSubmitCount > 0 && transferErrors.vendedorId ? (
                  <Text className="text-destructive">{transferErrors.vendedorId.message}</Text>
                ) : null}
              </View>

              <View className="gap-1">
                <Label>Dirección</Label>
                <Controller
                  control={transferControl}
                  name="direccion"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value ? { value, label: value === 'ASIGNAR' ? 'Almacen a vendedor' : 'Vendedor a almacen' } : undefined}
                      onValueChange={(option) => onChange((option?.value as InventoryTransferFormInput['direccion']) ?? 'ASIGNAR')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona dirección" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Dirección</SelectLabel>
                          <SelectItem value="ASIGNAR" label="Almacen a vendedor">Almacen a vendedor</SelectItem>
                          <SelectItem value="DEVOLVER" label="Vendedor a almacen">Vendedor a almacen</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </View>

              <View className="gap-1">
                <Label>Cantidad</Label>
                <Controller
                  control={transferControl}
                  name="cantidad"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input keyboardType="number-pad" onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Ej. 10" />
                  )}
                />
                {transferSubmitCount > 0 && transferErrors.cantidad ? (
                  <Text className="text-destructive">{transferErrors.cantidad.message}</Text>
                ) : null}
              </View>

              {transferInventoryMutation.error ? <Text className="text-destructive">{transferInventoryMutation.error.message}</Text> : null}

              <DialogFooter>
                <Button variant="outline" onPress={() => setIsTransferOpen(false)}>
                  <Text>Cancelar</Text>
                </Button>
                <Button onPress={handleTransferSubmit(onTransferSubmit)} disabled={transferInventoryMutation.isPending || !empresaId}>
                  <Text>{transferInventoryMutation.isPending ? 'Guardando...' : 'Transferir'}</Text>
                </Button>
              </DialogFooter>
            </View>
          </TouchableWithoutFeedback>
        </DialogContent>
      </Dialog>
    </View>
  );
}
