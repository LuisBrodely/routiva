import { Text } from '@/components/ui/text';
import { useClientsQuery } from '@/features/clients/hooks/use-clients';
import { useProductsQuery } from '@/features/products/hooks/use-products';
import { useSessionStore } from '@/store/session-store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const empresaId = useSessionStore((state) => state.empresaId);
  const empresaNombre = useSessionStore((state) => state.empresaNombre);
  const { data: clients } = useClientsQuery(empresaId);
  const { data: products } = useProductsQuery(empresaId);

  const totalClients = clients?.length ?? 0;
  const activeClients = clients?.filter((client) => client.activo).length ?? 0;
  const inactiveClients = clients?.filter((client) => !client.activo).length ?? 0;
  const totalProducts = products?.length ?? 0;
  const activeProducts = products?.filter((product) => product.activo).length ?? 0;
  const inactiveProducts = products?.filter((product) => !product.activo).length ?? 0;

  return (
    <View className="flex-1 bg-slate-50 px-5 pt-2 dark:bg-zinc-950">
      <View className="mb-5">
        <Text className="text-sm text-slate-500">Empresa</Text>
        <Text variant="large">{empresaNombre ?? 'Sin empresa asignada'}</Text>
      </View>

      <Pressable
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 active:opacity-90"
        onPress={() => router.push('/clients')}>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-muted-foreground">Clientes registrados</Text>
          <View className="rounded-full bg-sky-100 p-2">
            <Ionicons name="people" size={16} color="#0f172a" />
          </View>
        </View>

        <Text className="text-4xl font-extrabold text-foreground">{String(totalClients)}</Text>
        <Text className="mt-2 text-muted-foreground">
          {activeClients} activos, {inactiveClients} inactivos
        </Text>
      </Pressable>

      <Pressable
        className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 active:opacity-90"
        onPress={() => router.push('/products')}>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-muted-foreground">Productos activos</Text>
          <View className="rounded-full bg-indigo-100 p-2">
            <Ionicons name="cube" size={16} color="#0f172a" />
          </View>
        </View>
        <Text className="text-4xl font-extrabold text-foreground">{String(totalProducts)}</Text>
        <Text className="mt-2 text-muted-foreground">
          {activeProducts} activos, {inactiveProducts} inactivos
        </Text>
      </Pressable>
    </View>
  );
}
