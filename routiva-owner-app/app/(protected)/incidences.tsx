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
import { useClientsQuery } from '@/features/clients/hooks/use-clients';
import {
  useCreateIncidenceMutation,
  useIncidenceRouteStopsQuery,
  useIncidencesQuery,
} from '@/features/incidences/hooks/use-incidences';
import { incidenceSchema, type IncidenceFormInput, incidenceTypes } from '@/features/incidences/schemas/incidence-schema';
import { usePointsOfSaleByEmpresaQuery } from '@/features/points-of-sale/hooks/use-points-of-sale';
import { useRoutesQuery } from '@/features/routes/hooks/use-routes';
import { useVendorsQuery } from '@/features/vendors/hooks/use-vendors';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Keyboard, Platform, Pressable, ScrollView, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const incidenceTypeLabel: Record<(typeof incidenceTypes)[number], string> = {
  CLIENTE_CERRADO: 'Cliente cerrado',
  CLIENTE_NO_ESTABA: 'Cliente no estaba',
  PROBLEMA_PAGO: 'Problema de pago',
  OTRO: 'Otro',
};

const incidenceTypeIcon: Record<(typeof incidenceTypes)[number], keyof typeof Ionicons.glyphMap> = {
  CLIENTE_CERRADO: 'lock-closed-outline',
  CLIENTE_NO_ESTABA: 'person-remove-outline',
  PROBLEMA_PAGO: 'card-outline',
  OTRO: 'alert-circle-outline',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function IncidencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }) ?? insets.bottom,
    left: 12,
    right: 12,
  };

  const empresaId = useSessionStore((state) => state.empresaId);
  const { data: incidences, isLoading, isError, error } = useIncidencesQuery(empresaId);
  const { data: clients } = useClientsQuery(empresaId);
  const { data: vendors } = useVendorsQuery(empresaId);
  const { data: routes } = useRoutesQuery(empresaId);
  const { data: points } = usePointsOfSaleByEmpresaQuery(empresaId);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [filterType, setFilterType] = React.useState<'ALL' | (typeof incidenceTypes)[number]>('ALL');
  const [filterVendorId, setFilterVendorId] = React.useState<string>('ALL');
  const [searchText, setSearchText] = React.useState('');
  const createIncidenceMutation = useCreateIncidenceMutation(empresaId);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IncidenceFormInput>({
    resolver: zodResolver(incidenceSchema),
    defaultValues: {
      vendedorId: '',
      clienteId: '',
      tipo: 'CLIENTE_CERRADO',
      descripcion: '',
      rutaId: '',
      paradaId: '',
    },
  });

  const selectedRouteId = watch('rutaId') || null;
  const selectedClientId = watch('clienteId');

  const { data: routeStops } = useIncidenceRouteStopsQuery(empresaId, selectedRouteId);

  const clientNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    (clients ?? []).forEach((client) => map.set(client.id, client.nombreCompleto));
    return map;
  }, [clients]);

  const pointNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    (points ?? []).forEach((point) => map.set(point.id, point.nombre));
    return map;
  }, [points]);

  const availableStops = (routeStops ?? []).filter((stop) => {
    if (stop.incidencia_id) return false;
    if (!selectedClientId) return true;
    return stop.cliente_id === selectedClientId;
  });

  const filteredIncidences = (incidences ?? []).filter((item) => {
    if (filterType !== 'ALL' && item.tipo !== filterType) return false;
    if (filterVendorId !== 'ALL' && item.vendedorId !== filterVendorId) return false;

    const normalizedSearch = searchText.trim().toLowerCase();
    if (!normalizedSearch) return true;

    return (
      item.clienteNombre.toLowerCase().includes(normalizedSearch) ||
      item.vendedorNombre.toLowerCase().includes(normalizedSearch) ||
      incidenceTypeLabel[item.tipo].toLowerCase().includes(normalizedSearch) ||
      (item.descripcion ?? '').toLowerCase().includes(normalizedSearch)
    );
  });

  const todayCount = (incidences ?? []).filter((item) => {
    const now = new Date();
    const date = new Date(item.fecha);
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  function stopLabel(stop: (typeof availableStops)[number]): string {
    const clientLabel = clientNameById.get(stop.cliente_id) ?? 'Cliente';
    const pointLabel = pointNameById.get(stop.punto_venta_id) ?? `Punto ${stop.punto_venta_id.slice(0, 4)}`;
    return `Parada #${stop.orden} • ${clientLabel} • ${pointLabel}`;
  }

  function routeLabel(routeId: string): string {
    const route = (routes ?? []).find((item) => item.id === routeId);
    if (!route) return 'Ruta';
    return `${route.vendedorNombre} • ${new Date(route.fecha).toLocaleDateString('es-MX')}`;
  }

  function selectedStopLabel(stopId: string): string | null {
    const stop = availableStops.find((item) => item.id === stopId);
    return stop ? stopLabel(stop) : null;
  }

  function openCreateDialog() {
    reset({
      vendedorId: '',
      clienteId: '',
      tipo: 'CLIENTE_CERRADO',
      descripcion: '',
      rutaId: '',
      paradaId: '',
    });
    setIsFormOpen(true);
  }

  async function onSubmit(input: IncidenceFormInput) {
    try {
      await createIncidenceMutation.mutateAsync(input);
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
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/routes'))}>
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </Pressable>

        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Incidencias</Text>
          <Text className="text-muted-foreground">Registro operativo de eventos en ruta.</Text>
        </View>

        <Button className="h-11 rounded-xl" onPress={openCreateDialog} disabled={!empresaId}>
          <Text>Nueva incidencia</Text>
        </Button>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted-foreground">Incidencias visibles</Text>
              <Text className="text-2xl font-semibold text-foreground">{filteredIncidences.length}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-muted-foreground">Hoy</Text>
              <Text className="text-xl font-semibold text-foreground">{todayCount}</Text>
            </View>
          </View>

          <View className="gap-2">
            <Input
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por cliente, vendedor o tipo"
              returnKeyType="search"
            />

            <Select
              value={
                filterType === 'ALL'
                  ? { value: 'ALL', label: 'Todos los tipos' }
                  : { value: filterType, label: incidenceTypeLabel[filterType] }
              }
              onValueChange={(option) =>
                setFilterType((option?.value as 'ALL' | (typeof incidenceTypes)[number] | undefined) ?? 'ALL')
              }>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent insets={contentInsets}>
                <SelectGroup>
                  <SelectLabel>Tipo</SelectLabel>
                  <SelectItem label="Todos los tipos" value="ALL">
                    Todos los tipos
                  </SelectItem>
                  {incidenceTypes.map((item) => (
                    <SelectItem key={item} label={incidenceTypeLabel[item]} value={item}>
                      {incidenceTypeLabel[item]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={
                filterVendorId === 'ALL'
                  ? { value: 'ALL', label: 'Todos los vendedores' }
                  : {
                      value: filterVendorId,
                      label: (vendors ?? []).find((item) => item.id === filterVendorId)?.nombreCompleto ?? 'Vendedor',
                    }
              }
              onValueChange={(option) => setFilterVendorId(option?.value ?? 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por vendedor" />
              </SelectTrigger>
              <SelectContent insets={contentInsets}>
                <SelectGroup>
                  <SelectLabel>Vendedor</SelectLabel>
                  <SelectItem label="Todos los vendedores" value="ALL">
                    Todos los vendedores
                  </SelectItem>
                  {(vendors ?? []).map((item) => (
                    <SelectItem key={item.id} label={item.nombreCompleto} value={item.id}>
                      {item.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>
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

        {filteredIncidences.map((incidence) => (
          <View
            key={incidence.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="mb-2 flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <Text variant="large">{incidenceTypeLabel[incidence.tipo]}</Text>
                <Text className="text-muted-foreground">{incidence.clienteNombre}</Text>
                <Text className="text-muted-foreground">Vendedor: {incidence.vendedorNombre}</Text>
                <Text className="text-muted-foreground">{formatDate(incidence.fecha)}</Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Ionicons name={incidenceTypeIcon[incidence.tipo]} size={18} color="#b45309" />
              </View>
            </View>

            {incidence.paradaResumen ? <Text className="text-muted-foreground">{incidence.paradaResumen}</Text> : null}
            {incidence.descripcion ? <Text className="mt-1 text-muted-foreground">{incidence.descripcion}</Text> : null}
          </View>
        ))}

        {!isLoading && !isError && filteredIncidences.length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              Sin resultados
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Ajusta filtros o crea una nueva incidencia.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva incidencia</DialogTitle>
            <DialogDescription>Vincula vendedor, cliente y opcionalmente una parada de ruta.</DialogDescription>
          </DialogHeader>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView className="max-h-[560px]" contentContainerClassName="gap-4 pt-4">
              <View className="gap-1">
                <Label>Vendedor</Label>
                <Controller
                  control={control}
                  name="vendedorId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? { value, label: (vendors ?? []).find((item) => item.id === value)?.nombreCompleto ?? 'Vendedor' }
                          : undefined
                      }
                      onValueChange={(option) => onChange(option?.value ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona vendedor" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Vendedores</SelectLabel>
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
                {errors.vendedorId ? <Text className="text-destructive">{errors.vendedorId.message}</Text> : null}
              </View>

              <View className="gap-1">
                <Label>Cliente</Label>
                <Controller
                  control={control}
                  name="clienteId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? { value, label: (clients ?? []).find((item) => item.id === value)?.nombreCompleto ?? 'Cliente' }
                          : undefined
                      }
                      onValueChange={(option) => onChange(option?.value ?? '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona cliente" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Clientes</SelectLabel>
                          {(clients ?? [])
                            .filter((item) => item.activo)
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
                {errors.clienteId ? <Text className="text-destructive">{errors.clienteId.message}</Text> : null}
              </View>

              <View className="gap-1">
                <Label>Tipo</Label>
                <Controller
                  control={control}
                  name="tipo"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={value ? { value, label: incidenceTypeLabel[value] } : undefined}
                      onValueChange={(option) => onChange((option?.value ?? 'CLIENTE_CERRADO') as (typeof incidenceTypes)[number])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Tipo de incidencia</SelectLabel>
                          {incidenceTypes.map((item) => (
                            <SelectItem key={item} label={incidenceTypeLabel[item]} value={item}>
                              {incidenceTypeLabel[item]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </View>

              <View className="gap-1">
                <Label>Ruta (opcional)</Label>
                <Controller
                  control={control}
                  name="rutaId"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      value={
                        value
                          ? {
                              value,
                              label: routeLabel(value),
                            }
                          : undefined
                      }
                      onValueChange={(option) => {
                        onChange(option?.value ?? '');
                        setValue('paradaId', '');
                      }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona ruta (opcional)" />
                      </SelectTrigger>
                      <SelectContent insets={contentInsets}>
                        <SelectGroup>
                          <SelectLabel>Rutas recientes</SelectLabel>
                          {(routes ?? []).map((item) => (
                            <SelectItem key={item.id} label={routeLabel(item.id)} value={item.id}>
                              {routeLabel(item.id)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </View>

              {selectedRouteId ? (
                <View className="gap-1">
                  <Label>Parada (opcional)</Label>
                  <Controller
                    control={control}
                    name="paradaId"
                    render={({ field: { onChange, value } }) => (
                      <Select
                        value={value && selectedStopLabel(value) ? { value, label: selectedStopLabel(value)! } : undefined}
                        onValueChange={(option) => onChange(option?.value ?? '')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona parada" />
                        </SelectTrigger>
                        <SelectContent insets={contentInsets}>
                          <SelectGroup>
                            <SelectLabel>Paradas sin incidencia</SelectLabel>
                            {availableStops.map((stop) => (
                              <SelectItem key={stop.id} label={stopLabel(stop)} value={stop.id}>
                                {stopLabel(stop)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </View>
              ) : null}

              <View className="gap-1">
                <Label>Descripcion (opcional)</Label>
                <Controller
                  control={control}
                  name="descripcion"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value ?? ''}
                      placeholder="Describe brevemente la incidencia"
                      multiline
                      numberOfLines={3}
                    />
                  )}
                />
                {errors.descripcion ? <Text className="text-destructive">{errors.descripcion.message}</Text> : null}
              </View>

              {createIncidenceMutation.error ? (
                <Text className="text-destructive">{createIncidenceMutation.error.message}</Text>
              ) : null}

              <DialogFooter>
                <Button variant="outline" onPress={() => setIsFormOpen(false)}>
                  <Text>Cancelar</Text>
                </Button>
                <Button onPress={handleSubmit(onSubmit)} disabled={createIncidenceMutation.isPending}>
                  <Text>{createIncidenceMutation.isPending ? 'Guardando...' : 'Guardar incidencia'}</Text>
                </Button>
              </DialogFooter>
            </ScrollView>
          </TouchableWithoutFeedback>
        </DialogContent>
      </Dialog>
    </View>
  );
}
