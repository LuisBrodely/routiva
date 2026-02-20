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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { useSellerIncidencesQuery } from '@/features/seller-incidences/hooks/use-seller-incidences';
import { useSellerOrdersQuery } from '@/features/seller-orders/hooks/use-seller-orders';
import { useTodaySellerRouteQuery } from '@/features/seller-route/hooks/use-seller-route';
import { supabase } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/session-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();

  const username = useSessionStore((state) => state.username);
  const empresaNombre = useSessionStore((state) => state.empresaNombre);
  const vendedorNombre = useSessionStore((state) => state.vendedorNombre);
  const empresaId = useSessionStore((state) => state.empresaId);
  const vendedorId = useSessionStore((state) => state.vendedorId);

  const { data: route } = useTodaySellerRouteQuery(empresaId, vendedorId);
  const { data: orders } = useSellerOrdersQuery(empresaId, vendedorId);
  const { data: incidences } = useSellerIncidencesQuery(empresaId, vendedorId);

  const [isAccountDialogOpen, setIsAccountDialogOpen] = React.useState(false);
  const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = React.useState(false);

  const avatarLetter = (username?.charAt(0) ?? 'S').toUpperCase();
  const isDarkMode = colorScheme === 'dark';

  const todayOrders = (orders ?? []).filter((item) => item.fecha.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const todayIncidences = (incidences ?? []).filter((item) => item.fecha.slice(0, 10) === new Date().toISOString().slice(0, 10));

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32 pt-3">
        <View className="gap-1">
          <Text className="text-sm text-slate-500 dark:text-zinc-400">Vendedor</Text>
          <Text variant="large">{vendedorNombre ?? username ?? 'Sin nombre'}</Text>
          <Text className="text-muted-foreground">{empresaNombre ?? 'Sin empresa'}</Text>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            onPress={() => router.push('/route')}>
            <Text className="text-muted-foreground">Paradas hoy</Text>
            <Text className="mt-1 text-3xl font-bold text-foreground">{route?.totalParadas ?? 0}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">{route?.completadas ?? 0} completadas</Text>
          </Pressable>
          <Pressable
            className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            onPress={() => router.push('/orders')}>
            <Text className="text-muted-foreground">Pedidos hoy</Text>
            <Text className="mt-1 text-3xl font-bold text-foreground">{todayOrders.length}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">{orders?.length ?? 0} totales</Text>
          </Pressable>
        </View>

        <Pressable
          className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          onPress={() => router.push('/incidences')}>
          <Text className="text-muted-foreground">Incidencias hoy</Text>
          <Text className="mt-1 text-3xl font-bold text-foreground">{todayIncidences.length}</Text>
          <Text className="mt-1 text-xs text-muted-foreground">{incidences?.length ?? 0} registradas</Text>
        </Pressable>

        <Pressable
          className="rounded-2xl bg-slate-900 px-4 py-3 dark:bg-zinc-100"
          onPress={() => router.push('/route')}>
          <Text className="text-center font-medium text-white dark:text-zinc-900">Abrir mi ruta</Text>
        </Pressable>
      </ScrollView>

      <View className="absolute right-4 top-3 z-50">
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          onPress={() => setIsAccountDialogOpen(true)}>
          <Text className="font-semibold text-foreground">{avatarLetter}</Text>
        </Pressable>
      </View>

      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cuenta</DialogTitle>
            <DialogDescription>Configuracion de sesion.</DialogDescription>
          </DialogHeader>
          <View className="mt-2 rounded-xl border border-slate-200 p-3 dark:border-zinc-800">
            <Text className="text-sm font-medium text-foreground">{username ?? 'Sin usuario'}</Text>
            <Text className="text-xs text-muted-foreground">{vendedorNombre ?? 'Sin vendedor'} • {empresaNombre ?? 'Sin empresa'}</Text>
          </View>
          <View className="mt-3 gap-2">
            <Pressable
              className="rounded-xl border border-slate-300 px-4 py-3 dark:border-zinc-700"
              onPress={() => setColorScheme(isDarkMode ? 'light' : 'dark')}>
              <Text className="text-center text-foreground">{isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}</Text>
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
              <Pressable className="h-10 items-center justify-center rounded-lg bg-slate-900 px-4 dark:bg-zinc-100" onPress={handleSignOut}>
                <Text className="text-white dark:text-zinc-900">Cerrar sesion</Text>
              </Pressable>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
