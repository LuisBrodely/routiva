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
import { useCreateSellerIncidenceMutation } from '@/features/seller-incidences/hooks/use-seller-incidences';
import {
  useActiveProductsQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useCreateOrderForStopMutation,
  useTodaySellerRouteQuery,
} from '@/features/seller-route/hooks/use-seller-route';
import { visitResults, type OrderDraftItem, type SellerRouteStop } from '@/features/seller-route/schemas/route-schema';
import {
  usePushSellerLocationMutation,
  useSellerLocationHistoryQuery,
} from '@/features/seller-tracking/hooks/use-seller-tracking';
import { getErrorMessage } from '@/lib/errors/app-error';
import {
  getBackgroundTrackingStatus,
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from '@/lib/tracking/background-location-task';
import { useSessionStore } from '@/store/session-store';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as React from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, Switch, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_NOTES_LENGTH = 240;
const MAX_ORDER_QTY = 9999;
const MAX_EVIDENCES = 3;

const resultLabel: Record<(typeof visitResults)[number], string> = {
  PEDIDO: 'Pedido',
  NO_ESTABA: 'No estaba',
  NO_QUISO: 'No quiso',
  CERRADO: 'Cerrado',
  OTRO: 'Otro',
};

const incidenceLabel: Record<'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO', string> = {
  CLIENTE_CERRADO: 'Cliente cerrado',
  CLIENTE_NO_ESTABA: 'Cliente no estaba',
  PROBLEMA_PAGO: 'Problema de pago',
  OTRO: 'Otro',
};

function formatDate(value: string | null): string {
  if (!value) return 'Sin registro';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseQty(value: string): number {
  const digitsOnly = value.replace(/[^0-9]/g, '');
  if (!digitsOnly) return 0;
  const parsed = Number.parseInt(digitsOnly, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, MAX_ORDER_QTY);
}

export default function SellerRouteScreen() {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }) ?? insets.bottom,
    left: 12,
    right: 12,
  };

  const empresaId = useSessionStore((state) => state.empresaId);
  const vendedorId = useSessionStore((state) => state.vendedorId);

  const {
    data: route,
    isLoading,
    isError,
    error,
    refetch: refetchRoute,
  } = useTodaySellerRouteQuery(empresaId, vendedorId);
  const { data: products } = useActiveProductsQuery(empresaId);
  const { data: locationHistory } = useSellerLocationHistoryQuery(empresaId, vendedorId);

  const pushLocationMutation = usePushSellerLocationMutation(empresaId, vendedorId);
  const checkInMutation = useCheckInMutation(empresaId, vendedorId);
  const checkOutMutation = useCheckOutMutation(empresaId, vendedorId);
  const createOrderMutation = useCreateOrderForStopMutation(empresaId, vendedorId);
  const createIncidenceMutation = useCreateSellerIncidenceMutation(empresaId, vendedorId);

  const [checkoutStop, setCheckoutStop] = React.useState<SellerRouteStop | null>(null);
  const [checkoutResult, setCheckoutResult] = React.useState<(typeof visitResults)[number]>('PEDIDO');
  const [checkoutNotes, setCheckoutNotes] = React.useState('');
  const [createIncidence, setCreateIncidence] = React.useState(true);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  const [orderStop, setOrderStop] = React.useState<SellerRouteStop | null>(null);
  const [orderItems, setOrderItems] = React.useState<OrderDraftItem[]>([]);
  const [orderError, setOrderError] = React.useState<string | null>(null);

  const [incidenceStop, setIncidenceStop] = React.useState<SellerRouteStop | null>(null);
  const [incidenceType, setIncidenceType] = React.useState<'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO'>('OTRO');
  const [incidenceNotes, setIncidenceNotes] = React.useState('');
  const [incidenceAttachments, setIncidenceAttachments] = React.useState<Array<{ uri: string; name: string; mimeType?: string | null }>>([]);
  const [incidenceError, setIncidenceError] = React.useState<string | null>(null);

  const [operationError, setOperationError] = React.useState<string | null>(null);
  const [isContinuousTrackingEnabled, setIsContinuousTrackingEnabled] = React.useState(false);
  const [isBackgroundTrackingEnabled, setIsBackgroundTrackingEnabled] = React.useState(false);
  const [isBackgroundTrackingBusy, setIsBackgroundTrackingBusy] = React.useState(false);
  const [lastTrackedAt, setLastTrackedAt] = React.useState<string | null>(null);
  const locationWatcherRef = React.useRef<Location.LocationSubscription | null>(null);
  const autoTrackingBusyRef = React.useRef(false);

  React.useEffect(() => {
    let active = true;

    async function syncBackgroundTrackingState() {
      try {
        const started = await getBackgroundTrackingStatus();
        if (!active) return;
        setIsBackgroundTrackingEnabled(started);
      } catch {
        if (!active) return;
        setIsBackgroundTrackingEnabled(false);
      }
    }

    void syncBackgroundTrackingState();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isContinuousTrackingEnabled) {
      locationWatcherRef.current?.remove();
      locationWatcherRef.current = null;
      return;
    }

    let cancelled = false;

    async function startTracking() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          throw new Error('No se otorgo permiso de ubicacion');
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 60_000,
            distanceInterval: 40,
          },
          async (position) => {
            if (cancelled || autoTrackingBusyRef.current) return;
            autoTrackingBusyRef.current = true;
            try {
              await pushLocationMutation.mutateAsync({
                latitud: position.coords.latitude,
                longitud: position.coords.longitude,
                precisionMetros: position.coords.accuracy,
                velocidadKmh: position.coords.speed !== null && position.coords.speed >= 0 ? position.coords.speed * 3.6 : null,
              });
              setLastTrackedAt(new Date().toISOString());
            } catch (trackingError) {
              setOperationError(getErrorMessage(trackingError, 'No se pudo enviar la ubicación automática.'));
            } finally {
              autoTrackingBusyRef.current = false;
            }
          }
        );

        if (cancelled) {
          subscription.remove();
          return;
        }

        locationWatcherRef.current = subscription;
      } catch (trackingError) {
        setOperationError(getErrorMessage(trackingError, 'No se pudo iniciar el tracking continuo.'));
        setIsContinuousTrackingEnabled(false);
      }
    }

    startTracking();

    return () => {
      cancelled = true;
      locationWatcherRef.current?.remove();
      locationWatcherRef.current = null;
    };
  }, [isContinuousTrackingEnabled, pushLocationMutation]);

  async function getCurrentCoords() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('No se otorgo permiso de ubicacion');

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitud: position.coords.latitude,
      longitud: position.coords.longitude,
      precisionMetros: position.coords.accuracy,
      velocidadKmh: position.coords.speed !== null && position.coords.speed >= 0 ? position.coords.speed * 3.6 : null,
    };
  }

  async function handlePushLocation() {
    setOperationError(null);
    try {
      const coords = await getCurrentCoords();
      await pushLocationMutation.mutateAsync(coords);
      setLastTrackedAt(new Date().toISOString());
    } catch (pushError) {
      setOperationError(getErrorMessage(pushError, 'No se pudo actualizar la ubicación.'));
    }
  }

  async function toggleBackgroundTracking(nextValue: boolean) {
    setOperationError(null);
    setIsBackgroundTrackingBusy(true);

    try {
      if (nextValue) {
        await startBackgroundLocationTracking();
      } else {
        await stopBackgroundLocationTracking();
      }
      setIsBackgroundTrackingEnabled(nextValue);
    } catch (backgroundTrackingError) {
      setOperationError(
        getErrorMessage(backgroundTrackingError, 'No se pudo cambiar el tracking en segundo plano.')
      );
      const started = await getBackgroundTrackingStatus();
      setIsBackgroundTrackingEnabled(started);
    } finally {
      setIsBackgroundTrackingBusy(false);
    }
  }

  async function handleCheckIn(stop: SellerRouteStop) {
    setOperationError(null);
    try {
      const coords = await getCurrentCoords();
      await checkInMutation.mutateAsync({ routeStopId: stop.id, location: coords });
      await pushLocationMutation.mutateAsync(coords);
      setLastTrackedAt(new Date().toISOString());
    } catch (checkInError) {
      setOperationError(getErrorMessage(checkInError, 'No se pudo registrar el check-in.'));
    }
  }

  function resetCheckoutDialog() {
    setCheckoutStop(null);
    setCheckoutNotes('');
    setCreateIncidence(true);
    setCheckoutResult('PEDIDO');
    setCheckoutError(null);
  }

  async function confirmCheckOut() {
    if (!checkoutStop) return;

    const notes = checkoutNotes.trim();
    if (notes.length > MAX_NOTES_LENGTH) {
      setCheckoutError(`Máximo ${MAX_NOTES_LENGTH} caracteres en notas.`);
      return;
    }

    if (checkoutResult !== 'PEDIDO' && notes.length < 3) {
      setCheckoutError('Agrega una nota breve para resultados sin pedido.');
      return;
    }

    setCheckoutError(null);
    setOperationError(null);

    try {
      const coords = await getCurrentCoords();
      await checkOutMutation.mutateAsync({
        routeStopId: checkoutStop.id,
        input: {
          resultado: checkoutResult,
          notas: notes,
          salida: coords,
          createIncidence,
        },
      });
      await pushLocationMutation.mutateAsync(coords);
      setLastTrackedAt(new Date().toISOString());
      resetCheckoutDialog();
    } catch (checkOutError) {
      setCheckoutError(getErrorMessage(checkOutError, 'No se pudo registrar el check-out.'));
    }
  }

  function openOrderDialog(stop: SellerRouteStop) {
    setOrderStop(stop);
    setOrderItems((products ?? []).map((item) => ({ productoId: item.id, cantidad: 0 })));
    setOrderError(null);
  }

  function updateOrderQty(productId: string, qtyText: string) {
    const qty = parseQty(qtyText);
    setOrderItems((prev) => prev.map((item) => (item.productoId === productId ? { ...item, cantidad: qty } : item)));
  }

  function resetOrderDialog() {
    setOrderStop(null);
    setOrderItems([]);
    setOrderError(null);
  }

  async function confirmOrder() {
    if (!orderStop) return;

    if (orderItems.some((item) => !Number.isInteger(item.cantidad) || item.cantidad < 0 || item.cantidad > MAX_ORDER_QTY)) {
      setOrderError(`Las cantidades deben ser enteros entre 0 y ${MAX_ORDER_QTY}.`);
      return;
    }

    const itemsToSubmit = orderItems.filter((item) => item.cantidad > 0);
    if (!itemsToSubmit.length) {
      setOrderError('Agrega al menos un producto con cantidad mayor a cero.');
      return;
    }

    setOrderError(null);
    setOperationError(null);

    try {
      await createOrderMutation.mutateAsync({ routeStopId: orderStop.id, items: itemsToSubmit });
      resetOrderDialog();
    } catch (createOrderError) {
      setOrderError(getErrorMessage(createOrderError, 'No se pudo guardar el pedido.'));
    }
  }

  async function openInGoogleMaps(lat: number, lng: number) {
    const appUrl = `comgooglemaps://?q=${lat},${lng}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const canOpenGoogleApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenGoogleApp ? appUrl : webUrl);
  }

  function resetIncidenceDialog() {
    setIncidenceStop(null);
    setIncidenceType('OTRO');
    setIncidenceNotes('');
    setIncidenceAttachments([]);
    setIncidenceError(null);
  }

  async function pickIncidenceFiles() {
    if (incidenceAttachments.length >= MAX_EVIDENCES) {
      setIncidenceError(`Máximo ${MAX_EVIDENCES} evidencias por incidencia.`);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    const remaining = MAX_EVIDENCES - incidenceAttachments.length;
    const nextAssets = result.assets.slice(0, remaining).map((item) => ({
      uri: item.uri,
      name: item.name ?? 'evidencia',
      mimeType: item.mimeType ?? null,
    }));
    setIncidenceAttachments((prev) => [...prev, ...nextAssets]);
  }

  function removeIncidenceAttachment(index: number) {
    setIncidenceAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  }

  async function confirmManualIncidence() {
    if (!incidenceStop) return;

    const description = incidenceNotes.trim();
    if (description.length > MAX_NOTES_LENGTH) {
      setIncidenceError(`Máximo ${MAX_NOTES_LENGTH} caracteres en descripción.`);
      return;
    }

    if (incidenceType === 'OTRO' && description.length < 5) {
      setIncidenceError('Para tipo "Otro", agrega una descripción de al menos 5 caracteres.');
      return;
    }

    setIncidenceError(null);
    setOperationError(null);

    try {
      await createIncidenceMutation.mutateAsync({
        clienteId: incidenceStop.clienteId,
        tipo: incidenceType,
        descripcion: description,
        rutaParadaId: incidenceStop.id,
        evidencias: incidenceAttachments,
      });
      resetIncidenceDialog();
    } catch (manualIncidenceError) {
      setIncidenceError(getErrorMessage(manualIncidenceError, 'No se pudo registrar la incidencia.'));
    }
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32 pt-3" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Mi ruta</Text>
          <Text className="text-muted-foreground">
            {route
              ? `Ruta ${new Date(route.fecha).toLocaleDateString('es-MX')} • ${route.completadas}/${route.totalParadas}`
              : 'Sin ruta asignada hoy'}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Última ubicación enviada: {lastTrackedAt ? formatDate(lastTrackedAt) : 'Sin registro'}
          </Text>
        </View>

        <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Tracking continuo (app abierta)</Text>
            <Switch value={isContinuousTrackingEnabled} onValueChange={setIsContinuousTrackingEnabled} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Tracking en segundo plano</Text>
            <Switch
              value={isBackgroundTrackingEnabled}
              onValueChange={toggleBackgroundTracking}
              disabled={isBackgroundTrackingBusy}
            />
          </View>
          <Text className="text-xs text-muted-foreground">
            {isBackgroundTrackingEnabled
              ? 'Activo: sigue enviando ubicación con la app minimizada.'
              : 'Inactivo: actívalo para seguimiento cuando la app no esté en pantalla.'}
          </Text>
          <Button variant="outline" className="h-11 rounded-xl" onPress={handlePushLocation} disabled={pushLocationMutation.isPending}>
            <Text>{pushLocationMutation.isPending ? 'Actualizando...' : 'Actualizar ubicación ahora'}</Text>
          </Button>
        </View>

        <View className="gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <Text className="text-sm font-medium text-foreground">Historial de ubicaciones (hoy)</Text>
          {(locationHistory ?? []).length >= 2 ? (
            <View className="overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800">
              <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={{ width: '100%', height: 190 }}
                initialRegion={{
                  latitude: locationHistory![locationHistory!.length - 1].latitud,
                  longitude: locationHistory![locationHistory!.length - 1].longitud,
                  latitudeDelta: 0.03,
                  longitudeDelta: 0.03,
                }}>
                <Polyline
                  coordinates={locationHistory!.map((point) => ({ latitude: point.latitud, longitude: point.longitud }))}
                  strokeColor="#0f172a"
                  strokeWidth={3}
                />
                <Marker
                  coordinate={{
                    latitude: locationHistory![locationHistory!.length - 1].latitud,
                    longitude: locationHistory![locationHistory!.length - 1].longitud,
                  }}
                  title="Última posición"
                />
              </MapView>
            </View>
          ) : (
            <Text className="text-xs text-muted-foreground">Aún no hay suficientes puntos para trazar la ruta.</Text>
          )}
          {(locationHistory ?? []).slice(-5).reverse().map((point) => (
            <Text key={point.id} className="text-xs text-muted-foreground">
              {formatDate(point.fechaHora)} • {point.latitud.toFixed(5)}, {point.longitud.toFixed(5)}
            </Text>
          ))}
        </View>

        {operationError ? (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">{operationError}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator />
          </View>
        ) : null}

        {isError ? (
          <View className="gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">{getErrorMessage(error, 'No se pudo cargar la ruta.')}</Text>
            <Button variant="outline" onPress={() => refetchRoute()}>
              <Text>Reintentar</Text>
            </Button>
          </View>
        ) : null}

        {(route?.stops ?? []).map((stop) => (
          <View key={stop.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="mb-2 flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text variant="large">#{stop.orden} {stop.clienteNombre}</Text>
                <Text className="text-muted-foreground">{stop.puntoVentaNombre}</Text>
                <Text className="text-muted-foreground">{stop.puntoVentaDireccion ?? 'Sin dirección'}</Text>
              </View>
              <Text
                className={
                  stop.estatusVisita === 'VISITADO'
                    ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800'
                    : stop.estatusVisita === 'NO_VISITADO'
                      ? 'rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800'
                      : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700'
                }>
                {stop.estatusVisita}
              </Text>
            </View>

            {stop.latitud !== null && stop.longitud !== null ? (
              <View className="mb-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800">
                <MapView
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  style={{ width: '100%', height: 140 }}
                  initialRegion={{
                    latitude: stop.latitud,
                    longitude: stop.longitud,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}>
                  <Marker coordinate={{ latitude: stop.latitud, longitude: stop.longitud }} title={stop.puntoVentaNombre} />
                </MapView>
              </View>
            ) : null}

            <View className="gap-1">
              <Text className="text-xs text-muted-foreground">Check-in: {formatDate(stop.lastVisit?.fechaLlegada ?? null)}</Text>
              <Text className="text-xs text-muted-foreground">Check-out: {formatDate(stop.lastVisit?.fechaSalida ?? null)}</Text>
              <Text className="text-xs text-muted-foreground">
                Resultado: {stop.lastVisit ? resultLabel[stop.lastVisit.resultado] : 'Sin resultado'}
              </Text>
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              <Button variant="outline" onPress={() => handleCheckIn(stop)} disabled={checkInMutation.isPending}>
                <Text>Check-in</Text>
              </Button>
              <Button variant="secondary" onPress={() => setCheckoutStop(stop)}>
                <Text>Check-out</Text>
              </Button>
              <Button variant="secondary" onPress={() => openOrderDialog(stop)}>
                <Text>Pedido</Text>
              </Button>
              <Button variant="outline" onPress={() => setIncidenceStop(stop)}>
                <Text>Incidencia</Text>
              </Button>
              {stop.latitud !== null && stop.longitud !== null ? (
                <Button variant="outline" onPress={() => openInGoogleMaps(stop.latitud!, stop.longitud!)}>
                  <Text>Mapa</Text>
                </Button>
              ) : null}
            </View>
          </View>
        ))}

        {!isLoading && !isError && !(route?.stops ?? []).length ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">No hay paradas hoy</Text>
            <Text className="mt-1 text-center text-muted-foreground">Contacta al administrador para asignar ruta.</Text>
          </View>
        ) : null}
      </ScrollView>

      <Dialog
        open={Boolean(checkoutStop)}
        onOpenChange={(open) => {
          if (!open) resetCheckoutDialog();
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-out</DialogTitle>
            <DialogDescription>Define resultado final de la visita.</DialogDescription>
          </DialogHeader>
          <View className="mt-4 gap-3">
            <View className="gap-1">
              <Label>Resultado</Label>
              <Select
                value={{ value: checkoutResult, label: resultLabel[checkoutResult] }}
                onValueChange={(option) => setCheckoutResult((option?.value as (typeof visitResults)[number] | undefined) ?? 'PEDIDO')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona resultado" />
                </SelectTrigger>
                <SelectContent insets={contentInsets}>
                  <SelectGroup>
                    <SelectLabel>Resultado</SelectLabel>
                    {visitResults.map((item) => (
                      <SelectItem key={item} value={item} label={resultLabel[item]}>
                        {resultLabel[item]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </View>
            <View className="gap-1">
              <Label>Notas</Label>
              <Input
                value={checkoutNotes}
                onChangeText={(value) => {
                  setCheckoutNotes(value);
                  if (checkoutError) setCheckoutError(null);
                }}
                placeholder="Notas opcionales"
              />
              <Text className="text-xs text-muted-foreground">{checkoutNotes.trim().length}/{MAX_NOTES_LENGTH}</Text>
            </View>
            <View className="flex-row items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
              <Text className="text-sm text-foreground">Crear incidencia automática</Text>
              <Switch value={createIncidence} onValueChange={setCreateIncidence} />
            </View>
            {checkoutError ? <Text className="text-destructive">{checkoutError}</Text> : null}
          </View>
          <DialogFooter>
            <Button variant="outline" onPress={resetCheckoutDialog}>
              <Text>Cancelar</Text>
            </Button>
            <Button onPress={confirmCheckOut} disabled={checkOutMutation.isPending}>
              <Text>{checkOutMutation.isPending ? 'Guardando...' : 'Confirmar'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(orderStop)}
        onOpenChange={(open) => {
          if (!open) resetOrderDialog();
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pedido</DialogTitle>
            <DialogDescription>Captura cantidades por producto.</DialogDescription>
          </DialogHeader>
          <ScrollView className="max-h-[360px]" contentContainerClassName="gap-2 pt-3">
            {(products ?? []).map((product) => {
              const qty = orderItems.find((item) => item.productoId === product.id)?.cantidad ?? 0;
              return (
                <View key={product.id} className="rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
                  <Text className="font-medium text-foreground">{product.nombre}</Text>
                  <Text className="text-xs text-muted-foreground">${product.precio.toFixed(2)} / {product.unidad}</Text>
                  <Input
                    keyboardType="number-pad"
                    value={qty ? String(qty) : ''}
                    onChangeText={(value) => updateOrderQty(product.id, value)}
                    placeholder="0"
                  />
                </View>
              );
            })}
          </ScrollView>
          {orderError ? <Text className="text-destructive">{orderError}</Text> : null}
          <DialogFooter>
            <Button variant="outline" onPress={resetOrderDialog}>
              <Text>Cancelar</Text>
            </Button>
            <Button onPress={confirmOrder} disabled={createOrderMutation.isPending}>
              <Text>{createOrderMutation.isPending ? 'Guardando...' : 'Guardar pedido'}</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(incidenceStop)}
        onOpenChange={(open) => {
          if (!open) resetIncidenceDialog();
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar incidencia</AlertDialogTitle>
            <AlertDialogDescription>Registra incidencia para esta parada.</AlertDialogDescription>
          </AlertDialogHeader>
          <View className="my-3 gap-3">
            <Select
              value={{ value: incidenceType, label: incidenceLabel[incidenceType] }}
              onValueChange={(option) =>
                setIncidenceType(
                  (option?.value as 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO' | undefined) ?? 'OTRO'
                )
              }>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent insets={contentInsets}>
                <SelectGroup>
                  <SelectLabel>Tipo</SelectLabel>
                  <SelectItem value="CLIENTE_CERRADO" label={incidenceLabel.CLIENTE_CERRADO}>{incidenceLabel.CLIENTE_CERRADO}</SelectItem>
                  <SelectItem value="CLIENTE_NO_ESTABA" label={incidenceLabel.CLIENTE_NO_ESTABA}>{incidenceLabel.CLIENTE_NO_ESTABA}</SelectItem>
                  <SelectItem value="PROBLEMA_PAGO" label={incidenceLabel.PROBLEMA_PAGO}>{incidenceLabel.PROBLEMA_PAGO}</SelectItem>
                  <SelectItem value="OTRO" label={incidenceLabel.OTRO}>{incidenceLabel.OTRO}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              value={incidenceNotes}
              onChangeText={(value) => {
                setIncidenceNotes(value);
                if (incidenceError) setIncidenceError(null);
              }}
              placeholder="Descripción"
            />
            <View className="gap-2">
              <Button variant="outline" onPress={pickIncidenceFiles}>
                <Text>Adjuntar evidencia</Text>
              </Button>
              {incidenceAttachments.map((file, index) => (
                <View key={`${file.uri}-${index}`} className="flex-row items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-zinc-800">
                  <Text className="flex-1 text-xs text-muted-foreground">{file.name}</Text>
                  <Button variant="ghost" onPress={() => removeIncidenceAttachment(index)}>
                    <Text>Quitar</Text>
                  </Button>
                </View>
              ))}
            </View>
            <Text className="text-xs text-muted-foreground">{incidenceNotes.trim().length}/{MAX_NOTES_LENGTH}</Text>
            {incidenceError ? <Text className="text-destructive">{incidenceError}</Text> : null}
          </View>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline"><Text>Cancelar</Text></Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onPress={confirmManualIncidence} disabled={createIncidenceMutation.isPending}>
                <Text>{createIncidenceMutation.isPending ? 'Guardando...' : 'Guardar'}</Text>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
