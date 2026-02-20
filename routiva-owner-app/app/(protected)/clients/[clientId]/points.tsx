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
  useCreatePointMutation,
  useDeactivatePointMutation,
  usePointsOfSaleQuery,
  useUpdatePointMutation,
} from '@/features/points-of-sale/hooks/use-points-of-sale';
import {
  pointOfSaleSchema,
  type PointOfSaleFormInput,
  type PointOfSaleItem,
} from '@/features/points-of-sale/schemas/point-of-sale-schema';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function ClientPointsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const empresaId = useSessionStore((state) => state.empresaId);

  const clientIdValue = typeof params.clientId === 'string' ? params.clientId : null;
  const clientNameValue = typeof params.clientName === 'string' ? params.clientName : 'Cliente';

  const { data: points, isLoading, isError, error } = usePointsOfSaleQuery(empresaId, clientIdValue);

  const createPointMutation = useCreatePointMutation(empresaId, clientIdValue);
  const updatePointMutation = useUpdatePointMutation(empresaId, clientIdValue);
  const deactivatePointMutation = useDeactivatePointMutation(empresaId, clientIdValue);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingPoint, setEditingPoint] = React.useState<PointOfSaleItem | null>(null);
  const [deactivatingPoint, setDeactivatingPoint] = React.useState<PointOfSaleItem | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PointOfSaleFormInput>({
    resolver: zodResolver(pointOfSaleSchema),
    defaultValues: {
      nombre: '',
      direccion: '',
      latitud: '',
      longitud: '',
      horario: '',
      notas: '',
    },
  });

  function openCreateModal() {
    setEditingPoint(null);
    reset({ nombre: '', direccion: '', latitud: '', longitud: '', horario: '', notas: '' });
    setIsFormOpen(true);
  }

  function openEditModal(point: PointOfSaleItem) {
    setEditingPoint(point);
    reset({
      nombre: point.nombre,
      direccion: point.direccion,
      latitud: point.latitud !== null ? String(point.latitud) : '',
      longitud: point.longitud !== null ? String(point.longitud) : '',
      horario: point.horario ?? '',
      notas: point.notas ?? '',
    });
    setIsFormOpen(true);
  }

  async function onSubmit(input: PointOfSaleFormInput) {
    if (!clientIdValue) return;

    try {
      if (editingPoint) {
        await updatePointMutation.mutateAsync({ pointId: editingPoint.id, input });
      } else {
        await createPointMutation.mutateAsync(input);
      }
      setIsFormOpen(false);
    } catch {
      return;
    }
  }

  async function confirmDeactivatePoint() {
    if (!deactivatingPoint) return;
    try {
      await deactivatePointMutation.mutateAsync(deactivatingPoint.id);
    } finally {
      setDeactivatingPoint(null);
    }
  }

  async function openInGoogleMaps(lat: number, lng: number) {
    const appUrl = `comgooglemaps://?q=${lat},${lng}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    const canOpenGoogleApp = await Linking.canOpenURL(appUrl);
    const url = canOpenGoogleApp ? appUrl : webUrl;
    await Linking.openURL(url);
  }

  const isSaving = createPointMutation.isPending || updatePointMutation.isPending;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-32 pt-3"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white"
          onPress={() => router.replace('/clients')}>
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </Pressable>
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Puntos de venta</Text>
          <Text className="text-muted-foreground">Cliente: {clientNameValue}</Text>
        </View>
        <View>
          <Button className="h-11 rounded-xl" onPress={openCreateModal} disabled={!empresaId || !clientIdValue}>
            <Text>Nuevo punto</Text>
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

        {(points ?? []).map((point) => (
          <View
            key={point.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text variant="large">{point.nombre}</Text>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pressable
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: point.activo ? '#10b981' : '#ef4444' }}
                      accessibilityRole="button"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>{point.activo ? 'Punto de venta activo' : 'Punto de venta inactivo'}</Text>
                  </TooltipContent>
                </Tooltip>
              </View>
              <Text className="text-muted-foreground">Direccion: {point.direccion}</Text>
              <Text className="text-muted-foreground">
                Coordenadas: {point.latitud ?? '-'}, {point.longitud ?? '-'}
              </Text>
              <Text className="text-muted-foreground">Horario: {point.horario ?? 'Sin horario'}</Text>
              <Text className="text-muted-foreground">Notas: {point.notas ?? 'Sin notas'}</Text>
              {point.latitud !== null && point.longitud !== null ? (
                <View className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
                  <MapView
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    style={{ height: 150, width: '100%' }}
                    initialRegion={{
                      latitude: point.latitud,
                      longitude: point.longitud,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}>
                    <Marker coordinate={{ latitude: point.latitud, longitude: point.longitud }} />
                  </MapView>
                </View>
              ) : null}
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <Button variant="outline" onPress={() => openEditModal(point)}>
                <Text>Editar</Text>
              </Button>
              {point.latitud !== null && point.longitud !== null ? (
                <Button variant="secondary" onPress={() => openInGoogleMaps(point.latitud!, point.longitud!)}>
                  <Text>Ver en Google Maps</Text>
                </Button>
              ) : null}
              <Button
                variant="destructive"
                onPress={() => setDeactivatingPoint(point)}
                disabled={!point.activo || deactivatePointMutation.isPending}>
                <Text>Desactivar</Text>
              </Button>
            </View>
          </View>
        ))}

        {!isLoading && !isError && (points ?? []).length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              Sin puntos de venta
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Registra el primer punto de venta de este cliente.
            </Text>
            <View className="mt-4 w-full">
              <Button onPress={openCreateModal} disabled={!empresaId || !clientIdValue}>
                <Text>Crear punto</Text>
              </Button>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPoint ? 'Editar punto de venta' : 'Nuevo punto de venta'}</DialogTitle>
            <DialogDescription>Completa la informacion del punto de venta.</DialogDescription>
          </DialogHeader>

          <View className="mt-4 gap-4">
            <View className="gap-1">
              <Label>Nombre</Label>
              <Controller
                control={control}
                name="nombre"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Sucursal Centro" />
                )}
              />
              {errors.nombre ? <Text className="text-destructive">{errors.nombre.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Label>Direccion</Label>
              <Controller
                control={control}
                name="direccion"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Av. Siempre Viva 123" />
                )}
              />
              {errors.direccion ? <Text className="text-destructive">{errors.direccion.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Label>Latitud</Label>
              <Controller
                control={control}
                name="latitud"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value ?? ''} placeholder="19.4326" />
                )}
              />
              {errors.latitud ? <Text className="text-destructive">{errors.latitud.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Label>Longitud</Label>
              <Controller
                control={control}
                name="longitud"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value ?? ''} placeholder="-99.1332" />
                )}
              />
              {errors.longitud ? <Text className="text-destructive">{errors.longitud.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Label>Horario</Label>
              <Controller
                control={control}
                name="horario"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="L-V 9:00 a 18:00" />
                )}
              />
              {errors.horario ? <Text className="text-destructive">{errors.horario.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Label>Notas</Label>
              <Controller
                control={control}
                name="notas"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Referencias de acceso" />
                )}
              />
              {errors.notas ? <Text className="text-destructive">{errors.notas.message}</Text> : null}
            </View>

            {createPointMutation.error ? (
              <Text className="text-destructive">{createPointMutation.error.message}</Text>
            ) : null}
            {updatePointMutation.error ? (
              <Text className="text-destructive">{updatePointMutation.error.message}</Text>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onPress={() => setIsFormOpen(false)}>
                <Text>Cancelar</Text>
              </Button>
              <Button onPress={handleSubmit(onSubmit)} disabled={isSaving || !empresaId || !clientIdValue}>
                <Text>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
              </Button>
            </DialogFooter>
          </View>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deactivatingPoint)} onOpenChange={(open) => !open && setDeactivatingPoint(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar punto de venta</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingPoint
                ? `Se desactivara ${deactivatingPoint.nombre}.`
                : 'Esta accion desactivara el punto de venta.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">
                <Text>Cancelar</Text>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onPress={confirmDeactivatePoint} disabled={deactivatePointMutation.isPending}>
                <Text>{deactivatePointMutation.isPending ? 'Desactivando...' : 'Desactivar'}</Text>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
