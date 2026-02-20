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
import { useOrdersQuery } from '@/features/orders/hooks/use-orders';
import { usePointsOfSaleByEmpresaQuery } from '@/features/points-of-sale/hooks/use-points-of-sale';
import { useCreateRouteMutation, useRouteStopsQuery, useRoutesQuery } from '@/features/routes/hooks/use-routes';
import { routeSchema, type RouteFormInput } from '@/features/routes/schemas/route-schema';
import { useVendorsQuery } from '@/features/vendors/hooks/use-vendors';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const routeStatusStyle: Record<string, string> = {
  PLANIFICADA: 'bg-slate-100 text-slate-700',
  EN_PROGRESO: 'bg-amber-100 text-amber-800',
  FINALIZADA: 'bg-emerald-100 text-emerald-800',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function RoutesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }) ?? insets.bottom,
    left: 12,
    right: 12,
  };

  const empresaId = useSessionStore((state) => state.empresaId);

  const { data: routes, isLoading, isError, error } = useRoutesQuery(empresaId);
  const { data: clients } = useClientsQuery(empresaId);
  const { data: points } = usePointsOfSaleByEmpresaQuery(empresaId);
  const { data: vendors } = useVendorsQuery(empresaId);
  const { data: orders } = useOrdersQuery(empresaId);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRouteId, setSelectedRouteId] = React.useState<string | null>(null);

  const createRouteMutation = useCreateRouteMutation(empresaId);
  const { data: selectedRouteStops } = useRouteStopsQuery(empresaId, selectedRouteId);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteFormInput>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      vendedorId: '',
      fecha: new Date().toISOString().slice(0, 10),
      stops: [{ clienteId: '', puntoVentaId: '', pedidoId: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'stops' });

  const stops = watch('stops');

  const activeClients = (clients ?? []).filter((item) => item.activo);
  const activePoints = (points ?? []).filter((item) => item.activo);
  const activeVendors = (vendors ?? []).filter((item) => item.status === 'ACTIVO');
  const routeOrders = (orders ?? []).filter((item) => item.estatus === 'BORRADOR' || item.estatus === 'CONFIRMADO');

  function openCreateDialog() {
    reset({
      vendedorId: '',
      fecha: new Date().toISOString().slice(0, 10),
      stops: [{ clienteId: '', puntoVentaId: '', pedidoId: '' }],
    });
    setIsFormOpen(true);
  }

  async function onSubmit(input: RouteFormInput) {
    try {
      await createRouteMutation.mutateAsync(input);
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
          <Text className="text-3xl font-semibold leading-tight text-foreground">Rutas</Text>
          <Text className="text-muted-foreground">Planifica rutas diarias con paradas por cliente.</Text>
        </View>

        <Button className="h-11 rounded-xl" onPress={openCreateDialog} disabled={!empresaId}>
          <Text>Nueva ruta</Text>
        </Button>
        <Button variant="outline" className="h-11 rounded-xl" onPress={() => router.push('/vendors')}>
          <Text>Gestionar vendedores</Text>
        </Button>
        <Button variant="outline" className="h-11 rounded-xl" onPress={() => router.push('/incidences')}>
          <Text>Incidencias</Text>
        </Button>
        <Button variant="outline" className="h-11 rounded-xl" onPress={() => router.push('/visits')}>
          <Text>Visitas</Text>
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

        {(routes ?? []).map((route) => (
          <View
            key={route.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="mb-2 flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text variant="large">{route.vendedorNombre}</Text>
                <Text className="text-muted-foreground">Fecha: {formatDate(route.fecha)}</Text>
                <Text className="text-muted-foreground">Paradas: {route.totalParadas}</Text>
              </View>
              <Text
                className={`rounded-full px-2 py-1 text-xs font-medium ${routeStatusStyle[route.estatus] ?? 'bg-slate-100 text-slate-700'}`}>
                {route.estatus}
              </Text>
            </View>

            <Button variant="outline" onPress={() => setSelectedRouteId(route.id)}>
              <Text>Ver paradas</Text>
            </Button>
          </View>
        ))}

        {!isLoading && !isError && (routes ?? []).length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              Aun no tienes rutas
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Crea una ruta para organizar visitas y seguimiento operativo.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva ruta</DialogTitle>
            <DialogDescription>Define vendedor, fecha y paradas de la ruta.</DialogDescription>
          </DialogHeader>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView className="max-h-[560px]" contentContainerClassName="gap-4 pt-4">
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
                {errors.vendedorId ? <Text className="text-destructive">{errors.vendedorId.message}</Text> : null}
              </View>

              <View className="gap-1">
                <Text className="text-sm font-medium text-foreground">Fecha</Text>
                <Controller
                  control={control}
                  name="fecha"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="YYYY-MM-DD" />
                  )}
                />
                {errors.fecha ? <Text className="text-destructive">{errors.fecha.message}</Text> : null}
              </View>

              <View className="gap-3">
                <Text className="text-sm font-medium text-foreground">Paradas</Text>
                {fields.map((field, index) => {
                  const currentClientId = stops[index]?.clienteId;
                  const pointsByClient = activePoints.filter((point) => point.clienteId === currentClientId);
                  const ordersByStop = routeOrders.filter(
                    (order) =>
                      order.clienteId === currentClientId &&
                      order.puntoVentaId === (stops[index]?.puntoVentaId || '__none__')
                  );

                  return (
                    <View key={field.id} className="rounded-2xl border border-slate-200 p-3">
                      <View className="gap-2">
                        <Controller
                          control={control}
                          name={`stops.${index}.clienteId`}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              value={
                                value
                                  ? {
                                      value,
                                      label: activeClients.find((item) => item.id === value)?.nombreCompleto ?? 'Cliente',
                                    }
                                  : undefined
                              }
                              onValueChange={(option) => {
                                onChange(option?.value ?? '');
                                setValue(`stops.${index}.puntoVentaId`, '');
                                setValue(`stops.${index}.pedidoId`, '');
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

                        <Controller
                          control={control}
                          name={`stops.${index}.puntoVentaId`}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              value={
                                value
                                  ? {
                                      value,
                                      label: pointsByClient.find((item) => item.id === value)?.nombre ?? 'Punto',
                                    }
                                  : undefined
                              }
                              onValueChange={(option) => {
                                onChange(option?.value ?? '');
                                setValue(`stops.${index}.pedidoId`, '');
                              }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona punto de venta" />
                              </SelectTrigger>
                              <SelectContent insets={contentInsets}>
                                <SelectGroup>
                                  <SelectLabel>Puntos</SelectLabel>
                                  {pointsByClient.map((item) => (
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
                          name={`stops.${index}.pedidoId`}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              value={
                                value
                                  ? {
                                      value,
                                      label: `Pedido ${value.slice(0, 8)}`,
                                    }
                                  : undefined
                              }
                              onValueChange={(option) => onChange(option?.value ?? '')}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pedido opcional" />
                              </SelectTrigger>
                              <SelectContent insets={contentInsets}>
                                <SelectGroup>
                                  <SelectLabel>Pedidos</SelectLabel>
                                  {ordersByStop.map((item) => (
                                    <SelectItem
                                      key={item.id}
                                      label={`${item.estatus} - $${item.total.toFixed(2)}`}
                                      value={item.id}>
                                      {item.estatus} - ${item.total.toFixed(2)}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />

                        {fields.length > 1 ? (
                          <Button variant="outline" onPress={() => remove(index)}>
                            <Text>Quitar parada</Text>
                          </Button>
                        ) : null}

                        {errors.stops?.[index]?.clienteId ? (
                          <Text className="text-destructive">{errors.stops[index]?.clienteId?.message}</Text>
                        ) : null}
                        {errors.stops?.[index]?.puntoVentaId ? (
                          <Text className="text-destructive">{errors.stops[index]?.puntoVentaId?.message}</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}

                <Button variant="outline" onPress={() => append({ clienteId: '', puntoVentaId: '', pedidoId: '' })}>
                  <Text>Agregar parada</Text>
                </Button>
              </View>

              {createRouteMutation.error ? <Text className="text-destructive">{createRouteMutation.error.message}</Text> : null}
            </ScrollView>
          </TouchableWithoutFeedback>

          <DialogFooter>
            <Button variant="outline" onPress={() => setIsFormOpen(false)}>
              <Text>Cancelar</Text>
            </Button>
            <Button onPress={handleSubmit(onSubmit)} disabled={createRouteMutation.isPending || !empresaId}>
              <Text>{createRouteMutation.isPending ? 'Guardando...' : 'Guardar ruta'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedRouteId)} onOpenChange={(open) => !open && setSelectedRouteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paradas de ruta</DialogTitle>
            <DialogDescription>Detalle de visitas planificadas.</DialogDescription>
          </DialogHeader>

          <ScrollView className="max-h-[420px]" contentContainerClassName="gap-3 pt-4">
            {(selectedRouteStops ?? []).map((stop) => (
              <View key={stop.id} className="rounded-2xl border border-slate-200 p-3">
                <Text className="font-medium text-foreground">#{stop.orden} {stop.clienteNombre}</Text>
                <Text className="text-muted-foreground">Punto: {stop.puntoVentaNombre}</Text>
                <Text className="text-muted-foreground">Estatus: {stop.estatusVisita}</Text>
                <Text className="text-muted-foreground">Pedido: {stop.pedidoId ? stop.pedidoId.slice(0, 8) : 'Sin pedido'}</Text>
              </View>
            ))}

            {selectedRouteId && !(selectedRouteStops ?? []).length ? (
              <Text className="text-muted-foreground">Sin paradas disponibles.</Text>
            ) : null}
          </ScrollView>

          <DialogFooter>
            <Button variant="outline" onPress={() => setSelectedRouteId(null)}>
              <Text>Cerrar</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
