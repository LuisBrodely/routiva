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
import {
  useActivateVendorMutation,
  useCreateVendorMutation,
  useDeactivateVendorMutation,
  useSellerUsersQuery,
  useUpdateVendorMutation,
  useVendorsQuery,
} from '@/features/vendors/hooks/use-vendors';
import { vendorSchema, type VendorFormInput } from '@/features/vendors/schemas/vendor-schema';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Keyboard, Linking, Platform, ScrollView, TouchableWithoutFeedback, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDate(value: string | null): string {
  if (!value) return 'Sin conexion';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VendorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: Platform.select({ ios: insets.bottom, android: insets.bottom + 24 }) ?? insets.bottom,
    left: 12,
    right: 12,
  };

  const empresaId = useSessionStore((state) => state.empresaId);
  const { data: vendors, isLoading, isError, error } = useVendorsQuery(empresaId);
  const { data: sellerUsers } = useSellerUsersQuery(empresaId);

  const createVendorMutation = useCreateVendorMutation(empresaId);
  const updateVendorMutation = useUpdateVendorMutation(empresaId);
  const activateVendorMutation = useActivateVendorMutation(empresaId);
  const deactivateVendorMutation = useDeactivateVendorMutation(empresaId);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingVendorId, setEditingVendorId] = React.useState<string | null>(null);
  const [deactivatingVendorId, setDeactivatingVendorId] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm<VendorFormInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      usuarioId: '',
      nombreCompleto: '',
      telefono: '',
      rfc: '',
    },
  });

  const editingVendor = (vendors ?? []).find((item) => item.id === editingVendorId) ?? null;
  const deactivatingVendor = (vendors ?? []).find((item) => item.id === deactivatingVendorId) ?? null;

  function openCreateDialog() {
    setEditingVendorId(null);
    reset({ usuarioId: '', nombreCompleto: '', telefono: '', rfc: '' });
    setIsFormOpen(true);
  }

  function openEditDialog(vendorId: string) {
    const vendor = (vendors ?? []).find((item) => item.id === vendorId);
    if (!vendor) return;

    setEditingVendorId(vendorId);
    reset({
      usuarioId: vendor.usuarioId,
      nombreCompleto: vendor.nombreCompleto,
      telefono: vendor.telefono ?? '',
      rfc: vendor.rfc ?? '',
    });
    setIsFormOpen(true);
  }

  async function onSubmit(input: VendorFormInput) {
    try {
      if (editingVendorId) {
        await updateVendorMutation.mutateAsync({ vendorId: editingVendorId, input });
      } else {
        await createVendorMutation.mutateAsync(input);
      }
      setIsFormOpen(false);
    } catch {
      return;
    }
  }

  async function handleDeactivateVendor() {
    if (!deactivatingVendorId) return;
    try {
      await deactivateVendorMutation.mutateAsync(deactivatingVendorId);
    } finally {
      setDeactivatingVendorId(null);
    }
  }

  async function openInGoogleMaps(lat: number, lng: number) {
    const appUrl = `comgooglemaps://?q=${lat},${lng}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    const canOpenGoogleApp = await Linking.canOpenURL(appUrl);
    const url = canOpenGoogleApp ? appUrl : webUrl;
    await Linking.openURL(url);
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-32 pt-3" keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text className="text-3xl font-semibold leading-tight text-foreground">Vendedores</Text>
          <Text className="text-muted-foreground">Gestion de personal de ruta y ultima ubicacion conocida.</Text>
        </View>

        <Button className="h-11 rounded-xl" onPress={openCreateDialog} disabled={!empresaId}>
          <Text>Nuevo vendedor</Text>
        </Button>
        <Button variant="outline" className="h-11 rounded-xl" onPress={() => router.push('/tracking')}>
          <Text>Ver rastreo</Text>
        </Button>

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

        {(vendors ?? []).map((vendor) => (
          <View key={vendor.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 dark:border-zinc-800 dark:bg-zinc-900">
            <View className="mb-2 gap-1">
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="large" className="flex-1">{vendor.nombreCompleto}</Text>
              <Text
                className={
                  vendor.status === 'ACTIVO'
                    ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800'
                    : 'rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700'
                }>
                {vendor.status}
              </Text>
              </View>
              <Text className="text-muted-foreground">Telefono: {vendor.telefono ?? 'Sin telefono'}</Text>
              <Text className="text-muted-foreground">RFC: {vendor.rfc ?? 'Sin RFC'}</Text>
              <Text className="text-muted-foreground">Ultima conexion: {formatDate(vendor.ultimaConexion)}</Text>
            </View>

            {vendor.ultimaUbicacionLat !== null && vendor.ultimaUbicacionLng !== null ? (
              <View className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                <MapView
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  style={{ width: '100%', height: 140 }}
                  initialRegion={{
                    latitude: vendor.ultimaUbicacionLat,
                    longitude: vendor.ultimaUbicacionLng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}>
                  <Marker coordinate={{ latitude: vendor.ultimaUbicacionLat, longitude: vendor.ultimaUbicacionLng }} />
                </MapView>
              </View>
            ) : null}

            <View className="mt-4 flex-row flex-wrap gap-2">
              <Button variant="outline" onPress={() => openEditDialog(vendor.id)}>
                <Text>Editar</Text>
              </Button>
              {vendor.ultimaUbicacionLat !== null && vendor.ultimaUbicacionLng !== null ? (
                <Button variant="secondary" onPress={() => openInGoogleMaps(vendor.ultimaUbicacionLat!, vendor.ultimaUbicacionLng!)}>
                  <Text>Ver en mapa</Text>
                </Button>
              ) : null}
              {vendor.status === 'ACTIVO' ? (
                <Button variant="destructive" onPress={() => setDeactivatingVendorId(vendor.id)}>
                  <Text>Desactivar</Text>
                </Button>
              ) : (
                <Button variant="secondary" onPress={() => activateVendorMutation.mutate(vendor.id)} disabled={activateVendorMutation.isPending}>
                  <Text>{activateVendorMutation.isPending ? 'Activando...' : 'Activar'}</Text>
                </Button>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Editar vendedor' : 'Nuevo vendedor'}</DialogTitle>
            <DialogDescription>Asocia un usuario SELLER y completa los datos del vendedor.</DialogDescription>
          </DialogHeader>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="mt-4 gap-4">
              <View className="gap-1">
                <Label>Usuario seller</Label>
                <Controller
                  control={control}
                  name="usuarioId"
                  render={({ field: { onChange, value } }) =>
                    editingVendor ? (
                      <Input
                        value={
                          (sellerUsers ?? []).find((item) => item.id === value)?.username ??
                          editingVendor.usuarioId.slice(0, 8)
                        }
                        editable={false}
                        aria-disabled
                      />
                    ) : (
                      <Select
                        value={
                          value
                            ? {
                                value,
                                label: (sellerUsers ?? []).find((item) => item.id === value)?.username ?? 'Usuario',
                              }
                            : undefined
                        }
                        onValueChange={(option) => onChange(option?.value ?? '')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona usuario" />
                        </SelectTrigger>
                        <SelectContent insets={contentInsets}>
                          <SelectGroup>
                            <SelectLabel>Usuarios SELLER</SelectLabel>
                            {!(sellerUsers ?? []).length ? (
                              <SelectItem label="Sin usuarios SELLER" value="__empty__" disabled>
                                Sin usuarios SELLER
                              </SelectItem>
                            ) : null}
                            {(sellerUsers ?? []).map((item) => (
                              <SelectItem
                                key={item.id}
                                label={item.activo ? item.username : `${item.username} (inactivo)`}
                                value={item.id}>
                                {item.activo ? item.username : `${item.username} (inactivo)`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )
                  }
                />
                {submitCount > 0 && errors.usuarioId ? <Text className="text-destructive">{errors.usuarioId.message}</Text> : null}
                {!editingVendor && !(sellerUsers ?? []).length ? (
                  <Text className="text-xs text-muted-foreground">
                    No hay usuarios con rol SELLER en la tabla usuarios para esta empresa.
                  </Text>
                ) : null}
              </View>

              <View className="gap-1">
                <Label>Nombre completo</Label>
                <Controller
                  control={control}
                  name="nombreCompleto"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input onBlur={onBlur} onChangeText={onChange} value={value} placeholder="Juan Perez" />
                  )}
                />
                {submitCount > 0 && errors.nombreCompleto ? <Text className="text-destructive">{errors.nombreCompleto.message}</Text> : null}
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
              </View>

              {createVendorMutation.error ? <Text className="text-destructive">{createVendorMutation.error.message}</Text> : null}
              {updateVendorMutation.error ? <Text className="text-destructive">{updateVendorMutation.error.message}</Text> : null}

              <DialogFooter>
                <Button variant="outline" onPress={() => setIsFormOpen(false)}>
                  <Text>Cancelar</Text>
                </Button>
                <Button onPress={handleSubmit(onSubmit)} disabled={createVendorMutation.isPending || updateVendorMutation.isPending || !empresaId}>
                  <Text>{createVendorMutation.isPending || updateVendorMutation.isPending ? 'Guardando...' : 'Guardar'}</Text>
                </Button>
              </DialogFooter>
            </View>
          </TouchableWithoutFeedback>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deactivatingVendorId)} onOpenChange={(open) => !open && setDeactivatingVendorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar vendedor</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingVendor ? `Se desactivara ${deactivatingVendor.nombreCompleto}.` : 'Esta accion desactivara el vendedor.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">
                <Text>Cancelar</Text>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onPress={handleDeactivateVendor} disabled={deactivateVendorMutation.isPending}>
                <Text>{deactivateVendorMutation.isPending ? 'Desactivando...' : 'Desactivar'}</Text>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
