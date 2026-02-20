import { Button } from '@/components/ui/button';
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
import { useLiveVendorPositionsQuery, useVendorLocationHistoryQuery } from '@/features/tracking/hooks/use-tracking';
import { useSessionStore } from '@/store/session-store';
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDate(value: string | null): string {
  if (!value) return 'Sin conexión';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }) ?? insets.bottom,
    left: 12,
    right: 12,
  };

  const empresaId = useSessionStore((state) => state.empresaId);
  const { data: liveVendors, isLoading, isError, error } = useLiveVendorPositionsQuery(empresaId);

  const [selectedVendorId, setSelectedVendorId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedVendorId && (liveVendors ?? []).length) {
      setSelectedVendorId(liveVendors![0].vendedorId);
    }
  }, [liveVendors, selectedVendorId]);

  const { data: selectedHistory, isLoading: isHistoryLoading } = useVendorLocationHistoryQuery(empresaId, selectedVendorId);

  const selectedVendor = (liveVendors ?? []).find((item) => item.vendedorId === selectedVendorId) ?? null;

  const mapCenter = selectedVendor
    ? { latitude: selectedVendor.latitud, longitude: selectedVendor.longitud }
    : (liveVendors ?? []).length
      ? { latitude: liveVendors![0].latitud, longitude: liveVendors![0].longitud }
      : null;

  async function openInGoogleMaps(lat: number, lng: number) {
    const appUrl = `comgooglemaps://?q=${lat},${lng}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    const canOpenGoogleApp = await Linking.canOpenURL(appUrl);
    const url = canOpenGoogleApp ? appUrl : webUrl;
    await Linking.openURL(url);
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32 pt-3">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Rastreo</Text>
          <Text className="text-muted-foreground">Mapa en tiempo real e historial reciente por vendedor.</Text>
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

        {(liveVendors ?? []).length > 0 ? (
          <View className="gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="font-medium text-foreground">Selecciona vendedor</Text>
            <Select
              value={
                selectedVendorId
                  ? {
                      value: selectedVendorId,
                      label: (liveVendors ?? []).find((item) => item.vendedorId === selectedVendorId)?.vendedorNombre ??
                        'Vendedor',
                    }
                  : undefined
              }
              onValueChange={(option) => setSelectedVendorId(option?.value ?? null)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona vendedor" />
              </SelectTrigger>
              <SelectContent insets={contentInsets}>
                <SelectGroup>
                  <SelectLabel>Vendedores activos</SelectLabel>
                  {(liveVendors ?? []).map((item) => (
                    <SelectItem key={item.vendedorId} label={item.vendedorNombre} value={item.vendedorId}>
                      {item.vendedorNombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </View>
        ) : null}

        {mapCenter ? (
          <View className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <MapView
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              style={{ width: '100%', height: 300 }}
              initialRegion={{
                latitude: mapCenter.latitude,
                longitude: mapCenter.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}>
              {(liveVendors ?? []).map((vendor) => (
                <Marker
                  key={vendor.vendedorId}
                  coordinate={{ latitude: vendor.latitud, longitude: vendor.longitud }}
                  title={vendor.vendedorNombre}
                  description={`Última conexión: ${formatDate(vendor.ultimaConexion)}`}
                />
              ))}

              {selectedVendor && (selectedHistory ?? []).length > 1 ? (
                <Polyline
                  coordinates={selectedHistory!.map((point) => ({ latitude: point.latitud, longitude: point.longitud }))}
                  strokeColor="#2563eb"
                  strokeWidth={3}
                />
              ) : null}
            </MapView>
          </View>
        ) : (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              Sin ubicaciones disponibles
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Aun no se han recibido coordenadas de vendedores.
            </Text>
          </View>
        )}

        {selectedVendor ? (
          <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-medium text-foreground">{selectedVendor.vendedorNombre}</Text>
              <Button variant="outline" onPress={() => openInGoogleMaps(selectedVendor.latitud, selectedVendor.longitud)}>
                <Text>Ver en Google Maps</Text>
              </Button>
            </View>

            <View className="gap-1">
              <Text className="text-muted-foreground">Última conexión: {formatDate(selectedVendor.ultimaConexion)}</Text>
              <Text className="text-muted-foreground">Velocidad: {selectedVendor.velocidadKmh?.toFixed(1) ?? '0.0'} km/h</Text>
              <Text className="text-muted-foreground">Batería: {selectedVendor.bateriaPorcentaje ?? '-'}%</Text>
            </View>
          </View>
        ) : null}

        <View className="mt-1 flex-row items-center gap-2">
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text className="text-sm text-muted-foreground">Historial de ubicaciones recientes</Text>
          {isHistoryLoading ? <ActivityIndicator size="small" /> : null}
        </View>

        {(selectedHistory ?? []).map((point) => (
          <View key={point.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-foreground">
              {point.latitud.toFixed(5)}, {point.longitud.toFixed(5)}
            </Text>
            <Text className="text-xs text-muted-foreground">{formatDate(point.fechaHora)}</Text>
            <Text className="text-xs text-muted-foreground">
              Precisión: {point.precisionMetros?.toFixed(1) ?? '-'} m • Velocidad: {point.velocidadKmh?.toFixed(1) ?? '0.0'} km/h • Batería: {point.bateriaPorcentaje ?? '-'}%
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
