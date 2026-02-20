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
} from '@/features/inventory/hooks/use-inventory';
import {
  inventoryMovementSchema,
  inventoryMovementTypes,
  type InventoryMovementFormInput,
} from '@/features/inventory/schemas/inventory-schema';
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

  const createMovementMutation = useCreateInventoryMovementMutation(empresaId);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

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

  function openMovementDialog(productoId?: string) {
    reset({ productoId: productoId ?? '', tipo: 'ENTRADA', cantidad: '' });
    setIsFormOpen(true);
  }

  async function onSubmit(input: InventoryMovementFormInput) {
    try {
      await createMovementMutation.mutateAsync(input);
      setIsFormOpen(false);
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
          <Text className="text-3xl font-semibold leading-tight text-foreground">Inventario</Text>
          <Text className="text-muted-foreground">Pulsa un producto para registrar movimiento.</Text>
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
              </View>
              <View className="items-end">
                <Text className="text-sm text-muted-foreground">Existencia</Text>
                <Text className="text-2xl font-bold text-foreground">{Math.trunc(item.cantidad)}</Text>
              </View>
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
          </View>
        ))}

        {!isLoadingMovements && !isMovementsError && (movements ?? []).length === 0 ? (
          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-muted-foreground">Aun no hay movimientos registrados.</Text>
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
    </View>
  );
}
