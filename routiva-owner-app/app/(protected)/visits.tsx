import { Button } from '@/components/ui/button';
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
import { useVisitsQuery } from '@/features/visits/hooks/use-visits';
import { visitResults } from '@/features/visits/schemas/visit-schema';
import { useSessionStore } from '@/store/session-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const resultLabel: Record<(typeof visitResults)[number], string> = {
  PEDIDO: 'Pedido',
  NO_ESTABA: 'No estaba',
  NO_QUISO: 'No quiso',
  CERRADO: 'Cerrado',
  OTRO: 'Otro',
};

const resultStyle: Record<(typeof visitResults)[number], string> = {
  PEDIDO: 'bg-emerald-100 text-emerald-800',
  NO_ESTABA: 'bg-amber-100 text-amber-800',
  NO_QUISO: 'bg-rose-100 text-rose-800',
  CERRADO: 'bg-slate-200 text-slate-800',
  OTRO: 'bg-blue-100 text-blue-800',
};

function formatDate(value: string | null): string {
  if (!value) return 'Sin registro';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VisitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }) ?? insets.bottom,
    left: 12,
    right: 12,
  };

  const empresaId = useSessionStore((state) => state.empresaId);
  const { data: visits, isLoading, isError, error } = useVisitsQuery(empresaId);

  const [resultFilter, setResultFilter] = React.useState<'ALL' | (typeof visitResults)[number]>('ALL');
  const [vendorFilter, setVendorFilter] = React.useState<string>('ALL');
  const [searchText, setSearchText] = React.useState('');

  const vendorOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    (visits ?? []).forEach((item) => map.set(item.vendedorId, item.vendedorNombre));
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [visits]);

  const filteredVisits = (visits ?? []).filter((item) => {
    if (resultFilter !== 'ALL' && item.resultado !== resultFilter) return false;
    if (vendorFilter !== 'ALL' && item.vendedorId !== vendorFilter) return false;

    const normalizedSearch = searchText.trim().toLowerCase();
    if (!normalizedSearch) return true;

    return (
      item.clienteNombre.toLowerCase().includes(normalizedSearch) ||
      item.puntoVentaNombre.toLowerCase().includes(normalizedSearch) ||
      item.vendedorNombre.toLowerCase().includes(normalizedSearch) ||
      resultLabel[item.resultado].toLowerCase().includes(normalizedSearch)
    );
  });

  const completedCount = (visits ?? []).filter((item) => Boolean(item.fechaSalida)).length;
  const activeCount = (visits ?? []).filter((item) => !item.fechaSalida).length;

  async function openInGoogleMaps(lat: number, lng: number) {
    const appUrl = `comgooglemaps://?q=${lat},${lng}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const canOpenGoogleApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenGoogleApp ? appUrl : webUrl);
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32 pt-3" keyboardDismissMode="on-drag">
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/routes'))}>
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </Pressable>

        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Visitas</Text>
          <Text className="text-muted-foreground">Check-in/check-out, resultado y coordenadas por parada.</Text>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted-foreground">Total</Text>
              <Text className="text-2xl font-semibold text-foreground">{visits?.length ?? 0}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-muted-foreground">Completadas</Text>
              <Text className="text-xl font-semibold text-foreground">{completedCount}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-muted-foreground">En campo</Text>
              <Text className="text-xl font-semibold text-foreground">{activeCount}</Text>
            </View>
          </View>

          <View className="gap-2">
            <Input
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Buscar por cliente, punto o vendedor"
              returnKeyType="search"
            />
            <Select
              value={
                resultFilter === 'ALL' ? { value: 'ALL', label: 'Todos los resultados' } : { value: resultFilter, label: resultLabel[resultFilter] }
              }
              onValueChange={(option) =>
                setResultFilter((option?.value as 'ALL' | (typeof visitResults)[number] | undefined) ?? 'ALL')
              }>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent insets={contentInsets}>
                <SelectGroup>
                  <SelectLabel>Resultado</SelectLabel>
                  <SelectItem value="ALL" label="Todos los resultados">
                    Todos los resultados
                  </SelectItem>
                  {visitResults.map((item) => (
                    <SelectItem key={item} value={item} label={resultLabel[item]}>
                      {resultLabel[item]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={
                vendorFilter === 'ALL'
                  ? { value: 'ALL', label: 'Todos los vendedores' }
                  : { value: vendorFilter, label: vendorOptions.find((item) => item.id === vendorFilter)?.label ?? 'Vendedor' }
              }
              onValueChange={(option) => setVendorFilter(option?.value ?? 'ALL')}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por vendedor" />
              </SelectTrigger>
              <SelectContent insets={contentInsets}>
                <SelectGroup>
                  <SelectLabel>Vendedor</SelectLabel>
                  <SelectItem value="ALL" label="Todos los vendedores">
                    Todos los vendedores
                  </SelectItem>
                  {vendorOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id} label={item.label}>
                      {item.label}
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

        {filteredVisits.map((visit) => {
          const hasArrival = visit.latitudLlegada !== null && visit.longitudLlegada !== null;
          const hasExit = visit.latitudSalida !== null && visit.longitudSalida !== null;
          const hasMap = hasArrival || hasExit;

          const mapCenter = hasArrival
            ? { latitude: visit.latitudLlegada!, longitude: visit.longitudLlegada! }
            : hasExit
              ? { latitude: visit.latitudSalida!, longitude: visit.longitudSalida! }
              : null;

          const pathCoordinates =
            hasArrival && hasExit
              ? [
                  { latitude: visit.latitudLlegada!, longitude: visit.longitudLlegada! },
                  { latitude: visit.latitudSalida!, longitude: visit.longitudSalida! },
                ]
              : [];

          return (
            <View
              key={visit.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
              <View className="mb-2 flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-1">
                  <Text variant="large">{visit.clienteNombre}</Text>
                  <Text className="text-muted-foreground">{visit.puntoVentaNombre}</Text>
                  <Text className="text-muted-foreground">Vendedor: {visit.vendedorNombre}</Text>
                  <Text className="text-muted-foreground">
                    Ruta: {visit.rutaFecha ? new Date(visit.rutaFecha).toLocaleDateString('es-MX') : 'Sin fecha'} • Parada #{visit.ordenParada}
                  </Text>
                </View>
                <Text className={`rounded-full px-2 py-1 text-xs font-medium ${resultStyle[visit.resultado]}`}>
                  {resultLabel[visit.resultado]}
                </Text>
              </View>

              <View className="gap-1">
                <Text className="text-muted-foreground">Check-in: {formatDate(visit.fechaLlegada)}</Text>
                <Text className="text-muted-foreground">Check-out: {formatDate(visit.fechaSalida)}</Text>
                <Text className="text-muted-foreground">Estado parada: {visit.estatusVisita}</Text>
                {visit.notas ? <Text className="text-muted-foreground">Notas: {visit.notas}</Text> : null}
                {hasArrival ? (
                  <Text className="text-xs text-muted-foreground">
                    Llegada: {visit.latitudLlegada?.toFixed(5)}, {visit.longitudLlegada?.toFixed(5)}
                  </Text>
                ) : null}
                {hasExit ? (
                  <Text className="text-xs text-muted-foreground">
                    Salida: {visit.latitudSalida?.toFixed(5)}, {visit.longitudSalida?.toFixed(5)}
                  </Text>
                ) : null}
              </View>

              {hasMap && mapCenter ? (
                <View className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <MapView
                    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                    style={{ width: '100%', height: 170 }}
                    initialRegion={{
                      latitude: mapCenter.latitude,
                      longitude: mapCenter.longitude,
                      latitudeDelta: 0.008,
                      longitudeDelta: 0.008,
                    }}>
                    {hasArrival ? (
                      <Marker
                        coordinate={{ latitude: visit.latitudLlegada!, longitude: visit.longitudLlegada! }}
                        title="Check-in"
                      />
                    ) : null}
                    {hasExit ? (
                      <Marker
                        coordinate={{ latitude: visit.latitudSalida!, longitude: visit.longitudSalida! }}
                        title="Check-out"
                        pinColor="#16a34a"
                      />
                    ) : null}
                    {pathCoordinates.length > 1 ? <Polyline coordinates={pathCoordinates} strokeColor="#2563eb" strokeWidth={3} /> : null}
                  </MapView>
                </View>
              ) : null}

              <View className="mt-3 flex-row flex-wrap gap-2">
                {hasArrival ? (
                  <Button variant="outline" onPress={() => openInGoogleMaps(visit.latitudLlegada!, visit.longitudLlegada!)}>
                    <Text>Ver check-in</Text>
                  </Button>
                ) : null}
                {hasExit ? (
                  <Button variant="secondary" onPress={() => openInGoogleMaps(visit.latitudSalida!, visit.longitudSalida!)}>
                    <Text>Ver check-out</Text>
                  </Button>
                ) : null}
              </View>
            </View>
          );
        })}

        {!isLoading && !isError && filteredVisits.length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              Sin visitas
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">Ajusta filtros o espera registros de vendedores.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
