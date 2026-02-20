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
  useActivateClientMutation,
  useClientsQuery,
  useCreateClientMutation,
  useDeactivateClientMutation,
  useUpdateClientMutation,
} from '@/features/clients/hooks/use-clients';
import { clientSchema, type ClientFormInput, type ClientItem } from '@/features/clients/schemas/client-schema';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

export default function ClientsScreen() {
  const router = useRouter();
  const empresaId = useSessionStore((state) => state.empresaId);
  const empresaNombre = useSessionStore((state) => state.empresaNombre);
  const { data: clients, isLoading, isError, error } = useClientsQuery(empresaId);

  const createClientMutation = useCreateClientMutation(empresaId);
  const updateClientMutation = useUpdateClientMutation(empresaId);
  const deactivateClientMutation = useDeactivateClientMutation(empresaId);
  const activateClientMutation = useActivateClientMutation(empresaId);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<ClientItem | null>(null);
  const [deactivatingClient, setDeactivatingClient] = React.useState<ClientItem | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombreCompleto: '',
      telefono: '',
      rfc: '',
    },
  });

  function openCreateDialog() {
    setEditingClient(null);
    reset({ nombreCompleto: '', telefono: '', rfc: '' });
    setIsFormOpen(true);
  }

  function openEditDialog(client: ClientItem) {
    setEditingClient(client);
    reset({
      nombreCompleto: client.nombreCompleto,
      telefono: client.telefono ?? '',
      rfc: client.rfc ?? '',
    });
    setIsFormOpen(true);
  }

  async function onSubmit(input: ClientFormInput) {
    try {
      if (editingClient) {
        await updateClientMutation.mutateAsync({ clientId: editingClient.id, input });
      } else {
        await createClientMutation.mutateAsync(input);
      }
      setIsFormOpen(false);
    } catch {
      return;
    }
  }

  async function confirmDeactivateClient() {
    if (!deactivatingClient) return;
    try {
      await deactivateClientMutation.mutateAsync(deactivatingClient.id);
    } finally {
      setDeactivatingClient(null);
    }
  }

  const isSaving = createClientMutation.isPending || updateClientMutation.isPending;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-32 pt-3"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Clientes</Text>
          <Text className="text-muted-foreground">Empresa: {empresaNombre ?? 'Sin empresa asignada'}</Text>
        </View>

        <View>
          <Button className="h-11 rounded-xl" onPress={openCreateDialog} disabled={!empresaId}>
            <Text>Nuevo cliente</Text>
          </Button>
        </View>

        {!empresaId ? (
          <View className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <Text className="text-destructive">
              No se detecto empresa en tu sesion. Verifica tu registro en la tabla usuarios.
            </Text>
          </View>
        ) : null}

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

        {(clients ?? []).map((client) => (
          <View
            key={client.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text variant="large">{client.nombreCompleto}</Text>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pressable
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: client.activo ? '#10b981' : '#ef4444' }}
                      accessibilityRole="button"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <Text>{client.activo ? 'Cliente activo' : 'Cliente inactivo'}</Text>
                  </TooltipContent>
                </Tooltip>
              </View>
              <Text className="text-muted-foreground">Telefono: {client.telefono ?? 'Sin telefono'}</Text>
              <Text className="text-muted-foreground">RFC: {client.rfc ?? 'Sin RFC'}</Text>
            </View>

            <View className="mt-4 border-t border-slate-200 pt-4 dark:border-zinc-800" />

            <View className="flex-row flex-wrap gap-2">
              <Button variant="outline" onPress={() => openEditDialog(client)}>
                <Text>Editar</Text>
              </Button>
              <Button
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/clients/[clientId]/points',
                    params: { clientId: client.id, clientName: client.nombreCompleto },
                  })
                }>
                <Text>Puntos</Text>
              </Button>
              <Button
                variant="destructive"
                onPress={() => setDeactivatingClient(client)}
                disabled={!client.activo || deactivateClientMutation.isPending}>
                <Text>Desactivar</Text>
              </Button>
              {!client.activo ? (
                <Button
                  variant="secondary"
                  onPress={() => activateClientMutation.mutate(client.id)}
                  disabled={activateClientMutation.isPending}>
                  <Text>{activateClientMutation.isPending ? 'Activando...' : 'Activar'}</Text>
                </Button>
              ) : null}
            </View>
          </View>
        ))}

        {!isLoading && !isError && (clients ?? []).length === 0 ? (
          <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-7 dark:border-zinc-700 dark:bg-zinc-900">
            <Text variant="large" className="text-center">
              Aun no tienes clientes
            </Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Registra tu primer cliente para comenzar a gestionar puntos de venta.
            </Text>
            <View className="mt-4 w-full">
              <Button onPress={openCreateDialog} disabled={!empresaId}>
                <Text>Crear cliente</Text>
              </Button>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
            <DialogDescription>Completa la informacion del cliente.</DialogDescription>
          </DialogHeader>

          <View className="mt-4 gap-4">
            <View className="gap-1">
              <Label>Nombre completo</Label>
              <Controller
                control={control}
                name="nombreCompleto"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Cliente SA de CV" />
                )}
              />
              {errors.nombreCompleto ? (
                <Text className="text-destructive">{errors.nombreCompleto.message}</Text>
              ) : null}
            </View>

            <View className="gap-1">
              <Label>Telefono</Label>
              <Controller
                control={control}
                name="telefono"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="5551234567" />
                )}
              />
              {errors.telefono ? <Text className="text-destructive">{errors.telefono.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Label>RFC</Label>
              <Controller
                control={control}
                name="rfc"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="XAXX010101000" />
                )}
              />
              {errors.rfc ? <Text className="text-destructive">{errors.rfc.message}</Text> : null}
            </View>

            {createClientMutation.error ? (
              <Text className="text-destructive">{createClientMutation.error.message}</Text>
            ) : null}
            {updateClientMutation.error ? (
              <Text className="text-destructive">{updateClientMutation.error.message}</Text>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onPress={() => setIsFormOpen(false)}>
                <Text>Cancelar</Text>
              </Button>
              <Button onPress={handleSubmit(onSubmit)} disabled={isSaving || !empresaId}>
                <Text>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
              </Button>
            </DialogFooter>
          </View>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deactivatingClient)} onOpenChange={(open) => !open && setDeactivatingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingClient
                ? `Se desactivara ${deactivatingClient.nombreCompleto}.`
                : 'Esta accion desactivara el cliente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">
                <Text>Cancelar</Text>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onPress={confirmDeactivateClient} disabled={deactivateClientMutation.isPending}>
                <Text>{deactivateClientMutation.isPending ? 'Desactivando...' : 'Desactivar'}</Text>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
