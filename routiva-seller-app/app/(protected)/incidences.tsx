import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSellerIncidencesQuery } from '@/features/seller-incidences/hooks/use-seller-incidences';
import { getErrorMessage } from '@/lib/errors/app-error';
import { supabase } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/session-store';
import { Linking } from 'react-native';
import { ActivityIndicator, ScrollView, View } from 'react-native';

const incidenceLabel: Record<'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO', string> = {
  CLIENTE_CERRADO: 'Cliente cerrado',
  CLIENTE_NO_ESTABA: 'Cliente no estaba',
  PROBLEMA_PAGO: 'Problema de pago',
  OTRO: 'Otro',
};

export default function SellerIncidencesScreen() {
  const empresaId = useSessionStore((state) => state.empresaId);
  const vendedorId = useSessionStore((state) => state.vendedorId);

  const { data: incidences, isLoading, isError, error, refetch } = useSellerIncidencesQuery(empresaId, vendedorId);

  async function openEvidence(urlOrPath: string) {
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      await Linking.openURL(urlOrPath);
      return;
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from('incidencias-evidencias')
      .createSignedUrl(urlOrPath, 60 * 10);

    if (signedUrlError) throw signedUrlError;
    if (!data?.signedUrl) throw new Error('No se pudo generar URL de evidencia');
    await Linking.openURL(data.signedUrl);
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32 pt-3">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Incidencias</Text>
          <Text className="text-muted-foreground">Incidencias registradas en tus visitas.</Text>
        </View>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator />
          </View>
        ) : null}

        {isError ? (
          <View className="gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">{getErrorMessage(error, 'No se pudieron cargar tus incidencias.')}</Text>
            <Button variant="outline" onPress={() => refetch()}>
              <Text>Reintentar</Text>
            </Button>
          </View>
        ) : null}

        {(incidences ?? []).map((incidence) => (
          <View key={incidence.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <Text variant="large">{incidenceLabel[incidence.tipo]}</Text>
            <Text className="text-muted-foreground">{incidence.clienteNombre}</Text>
            <Text className="text-muted-foreground">{new Date(incidence.fecha).toLocaleString('es-MX')}</Text>
            {incidence.descripcion ? <Text className="mt-2 text-sm text-muted-foreground">{incidence.descripcion}</Text> : null}
            <Text className="mt-2 text-xs text-muted-foreground">Evidencias: {incidence.evidenciasCount}</Text>
            {(incidence.evidencias ?? []).slice(0, 2).map((evidence) => (
              <Button key={evidence.id} variant="outline" className="mt-2" onPress={() => openEvidence(evidence.url)}>
                <Text>Abrir evidencia</Text>
              </Button>
            ))}
          </View>
        ))}

        {!isLoading && !isError && !(incidences ?? []).length ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">Sin incidencias</Text>
            <Text className="mt-1 text-center text-muted-foreground">Registra incidencias desde ruta cuando ocurra un evento.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
