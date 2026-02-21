import { Text } from '@/components/ui/text';
import { useSellerInventoryQuery } from '@/features/seller-inventory/hooks/use-seller-inventory';
import { useSessionStore } from '@/store/session-store';
import { ActivityIndicator, ScrollView, View } from 'react-native';

const LOW_STOCK_THRESHOLD = 5;

export default function SellerInventoryScreen() {
  const empresaId = useSessionStore((state) => state.empresaId);
  const vendedorId = useSessionStore((state) => state.vendedorId);

  const { data: inventory, isLoading, isError, error } = useSellerInventoryQuery(empresaId, vendedorId);

  const total = (inventory ?? []).reduce((sum, item) => sum + item.cantidad, 0);
  const lowStockItems = (inventory ?? []).filter((item) => item.cantidad <= LOW_STOCK_THRESHOLD).length;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32 pt-3">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Mi inventario</Text>
          <Text className="text-muted-foreground">Stock disponible en tu unidad de reparto.</Text>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted-foreground">Total piezas</Text>
              <Text className="text-2xl font-bold text-foreground">{Math.trunc(total)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-muted-foreground">Stock bajo</Text>
              <Text className="text-2xl font-bold text-foreground">{lowStockItems}</Text>
            </View>
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

        {(inventory ?? []).map((item) => (
          <View key={item.productoId} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text variant="large">{item.productoNombre}</Text>
                <Text className="text-xs text-muted-foreground">{item.unidad}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xl font-semibold text-foreground">{Math.trunc(item.cantidad)}</Text>
                {item.cantidad <= LOW_STOCK_THRESHOLD ? (
                  <Text className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    STOCK BAJO
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ))}

        {!isLoading && !isError && !(inventory ?? []).length ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">Sin inventario asignado</Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Solicita asignación de inventario al administrador.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
