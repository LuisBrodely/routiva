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
import { Text } from '@/components/ui/text';
import { useClientsQuery } from '@/features/clients/hooks/use-clients';
import { useIncidencesQuery } from '@/features/incidences/hooks/use-incidences';
import { useProductsQuery } from '@/features/products/hooks/use-products';
import { useRoutesQuery } from '@/features/routes/hooks/use-routes';
import { useLiveVendorPositionsQuery } from '@/features/tracking/hooks/use-tracking';
import { useVisitsQuery } from '@/features/visits/hooks/use-visits';
import { supabase } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/session-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function DashboardScreen() {
  const router = useRouter();
  const empresaId = useSessionStore((state) => state.empresaId);
  const empresaNombre = useSessionStore((state) => state.empresaNombre);
  const username = useSessionStore((state) => state.username);
  const role = useSessionStore((state) => state.role);
  const { colorScheme, setColorScheme } = useColorScheme();
  const { data: clients } = useClientsQuery(empresaId);
  const { data: products } = useProductsQuery(empresaId);
  const { data: incidences } = useIncidencesQuery(empresaId);
  const { data: visits } = useVisitsQuery(empresaId);
  const { data: routes } = useRoutesQuery(empresaId);
  const { data: liveVendors } = useLiveVendorPositionsQuery(empresaId);

  const totalClients = clients?.length ?? 0;
  const activeClients = clients?.filter((client) => client.activo).length ?? 0;
  const inactiveClients = clients?.filter((client) => !client.activo).length ?? 0;
  const totalProducts = products?.length ?? 0; // kept for future detailed card text.
  const activeProducts = products?.filter((product) => product.activo).length ?? 0;
  const inactiveProducts = products?.filter((product) => !product.activo).length ?? 0;

  const today = new Date();
  const visitsToday = (visits ?? []).filter((visit) => {
    if (!visit.fechaLlegada) return false;
    const value = new Date(visit.fechaLlegada);
    return value.getDate() === today.getDate() && value.getMonth() === today.getMonth() && value.getFullYear() === today.getFullYear();
  }).length;
  const incidencesToday = (incidences ?? []).filter((incidence) => {
    const value = new Date(incidence.fecha);
    return value.getDate() === today.getDate() && value.getMonth() === today.getMonth() && value.getFullYear() === today.getFullYear();
  }).length;

  const completedVisits = (visits ?? []).filter((visit) => Boolean(visit.fechaSalida)).length;
  const routesInProgress = (routes ?? []).filter((route) => route.estatus === 'EN_PROGRESO').length;
  const [isAccountDialogOpen, setIsAccountDialogOpen] = React.useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = React.useState(false);
  const avatarLetter = (username?.trim()?.charAt(0) ?? 'O').toUpperCase();
  const isDarkMode = colorScheme === 'dark';

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-32 pt-2">
        <View className="mb-1">
          <Text className="text-sm text-slate-500 dark:text-zinc-400">Empresa</Text>
          <Text variant="large">{empresaNombre ?? 'Sin empresa asignada'}</Text>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:opacity-90 dark:border-zinc-800 dark:bg-zinc-900"
            onPress={() => router.push('/clients')}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-muted-foreground">Clientes</Text>
              <Ionicons name="people-outline" size={16} color="#2563eb" />
            </View>
            <Text className="text-3xl font-extrabold text-foreground">{String(totalClients)}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {activeClients} activos, {inactiveClients} inactivos
            </Text>
          </Pressable>

          <Pressable
            className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:opacity-90 dark:border-zinc-800 dark:bg-zinc-900"
            onPress={() => router.push('/products')}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-muted-foreground">Productos</Text>
              <Ionicons name="cube-outline" size={16} color="#4f46e5" />
            </View>
            <Text className="text-3xl font-extrabold text-foreground">{String(activeProducts)}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {inactiveProducts} inactivos de {totalProducts}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:opacity-90 dark:border-zinc-800 dark:bg-zinc-900"
            onPress={() => router.push('/visits')}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-muted-foreground">Visitas hoy</Text>
              <Ionicons name="walk-outline" size={16} color="#0ea5e9" />
            </View>
            <Text className="text-3xl font-extrabold text-foreground">{String(visitsToday)}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">{completedVisits} completas acumuladas</Text>
          </Pressable>

          <Pressable
            className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:opacity-90 dark:border-zinc-800 dark:bg-zinc-900"
            onPress={() => router.push('/incidences')}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-muted-foreground">Incidencias hoy</Text>
              <Ionicons name="warning-outline" size={16} color="#f59e0b" />
            </View>
            <Text className="text-3xl font-extrabold text-foreground">{String(incidencesToday)}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">{incidences?.length ?? 0} registradas en total</Text>
          </Pressable>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="mb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-muted-foreground">Operacion en campo</Text>
              <Text className="text-2xl font-extrabold text-foreground">{liveVendors?.length ?? 0}</Text>
              <Text className="text-xs text-muted-foreground">vendedores con ubicacion activa</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-muted-foreground">Rutas en progreso</Text>
              <Text className="text-xl font-bold text-foreground">{routesInProgress}</Text>
            </View>
          </View>

          {(liveVendors ?? []).length ? (
            <View className="overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800">
              <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={{ width: '100%', height: 190 }}
                initialRegion={{
                  latitude: liveVendors![0].latitud,
                  longitude: liveVendors![0].longitud,
                  latitudeDelta: 0.09,
                  longitudeDelta: 0.09,
                }}>
                {(liveVendors ?? []).map((vendor) => (
                  <Marker
                    key={vendor.vendedorId}
                    coordinate={{ latitude: vendor.latitud, longitude: vendor.longitud }}
                    title={vendor.vendedorNombre}
                  />
                ))}
              </MapView>
            </View>
          ) : (
            <View className="items-center rounded-2xl border border-dashed border-slate-300 p-6 dark:border-zinc-700">
              <Text className="text-center text-muted-foreground">Sin ubicaciones activas para mostrar en el mapa.</Text>
            </View>
          )}

          <View className="mt-3 flex-row gap-2">
            <Pressable
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 dark:bg-zinc-100"
              onPress={() => router.push('/tracking')}>
              <Text className="text-center font-medium text-white dark:text-zinc-900">Ver rastreo</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 dark:border-zinc-700"
              onPress={() => router.push('/routes')}>
              <Text className="text-center font-medium text-foreground">Gestionar rutas</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View className="absolute right-5 top-4 z-50">
        <Pressable
          className="h-11 w-11 flex-row items-center justify-center rounded-full border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          onPress={() => setIsAccountDialogOpen(true)}>
          <Text className="font-semibold text-foreground">{avatarLetter}</Text>
        </Pressable>
      </View>

      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cuenta</DialogTitle>
            <DialogDescription>Ajustes de sesion y tema.</DialogDescription>
          </DialogHeader>

          <View className="mt-2 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
            <Text className="text-sm font-medium text-foreground">{username ?? 'Sin usuario'}</Text>
            <Text className="text-xs text-muted-foreground">
              {role ?? 'Sin rol'} • {empresaNombre ?? 'Sin empresa'}
            </Text>
          </View>

          <View className="mt-3 gap-2">
            <Pressable
              className="rounded-xl border border-slate-300 px-4 py-3 dark:border-zinc-700"
              onPress={() => setColorScheme(isDarkMode ? 'light' : 'dark')}>
              <Text className="text-center text-foreground">
                {isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              </Text>
            </Pressable>
            <Pressable
              className="rounded-xl border border-red-200 px-4 py-3 dark:border-red-900/40"
              onPress={() => {
                setIsAccountDialogOpen(false);
                setIsSignOutConfirmOpen(true);
              }}>
              <Text className="text-center text-destructive">Cerrar sesion</Text>
            </Pressable>
          </View>

          <DialogFooter>
            <Pressable
              className="mt-2 h-10 items-center justify-center rounded-lg border border-slate-300 px-4 dark:border-zinc-700"
              onPress={() => setIsAccountDialogOpen(false)}>
              <Text>Cerrar</Text>
            </Pressable>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isSignOutConfirmOpen} onOpenChange={setIsSignOutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar sesion</AlertDialogTitle>
            <AlertDialogDescription>Se cerrara tu sesion en este dispositivo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Pressable className="h-10 items-center justify-center rounded-lg border border-slate-300 px-4 dark:border-zinc-700">
                <Text>Cancelar</Text>
              </Pressable>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Pressable
                className="h-10 items-center justify-center rounded-lg bg-slate-900 px-4 dark:bg-zinc-100"
                onPress={handleSignOut}>
                <Text className="text-white dark:text-zinc-900">Cerrar sesion</Text>
              </Pressable>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
