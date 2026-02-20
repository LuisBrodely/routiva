import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSellerOrdersQuery } from '@/features/seller-orders/hooks/use-seller-orders';
import { getErrorMessage } from '@/lib/errors/app-error';
import { useSessionStore } from '@/store/session-store';
import { ActivityIndicator, ScrollView, View } from 'react-native';

const statusStyle: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-700',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  ENTREGADO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-rose-100 text-rose-800',
};

export default function SellerOrdersScreen() {
  const empresaId = useSessionStore((state) => state.empresaId);
  const vendedorId = useSessionStore((state) => state.vendedorId);

  const { data: orders, isLoading, isError, error, refetch } = useSellerOrdersQuery(empresaId, vendedorId);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32 pt-3">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Pedidos</Text>
          <Text className="text-muted-foreground">Historial de pedidos registrados por ti.</Text>
        </View>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator />
          </View>
        ) : null}

        {isError ? (
          <View className="gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">{getErrorMessage(error, 'No se pudieron cargar tus pedidos.')}</Text>
            <Button variant="outline" onPress={() => refetch()}>
              <Text>Reintentar</Text>
            </Button>
          </View>
        ) : null}

        {(orders ?? []).map((order) => (
          <View key={order.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text variant="large">{order.clienteNombre}</Text>
                <Text className="text-muted-foreground">{order.puntoVentaNombre}</Text>
                <Text className="text-muted-foreground">{new Date(order.fecha).toLocaleString('es-MX')}</Text>
              </View>
              <Text className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[order.estatus] ?? 'bg-slate-100 text-slate-700'}`}>
                {order.estatus}
              </Text>
            </View>
            <Text className="mt-2 text-sm text-muted-foreground">{order.totalItems} productos</Text>
            <Text className="text-2xl font-bold text-foreground">${order.total.toFixed(2)}</Text>
          </View>
        ))}

        {!isLoading && !isError && !(orders ?? []).length ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">Sin pedidos</Text>
            <Text className="mt-1 text-center text-muted-foreground">Registra pedidos desde la pantalla de ruta.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
