import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/session-store';
import { View } from 'react-native';

export default function ProfileScreen() {
  const username = useSessionStore((state) => state.username);
  const role = useSessionStore((state) => state.role);
  const empresaNombre = useSessionStore((state) => state.empresaNombre);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <View className="flex-1 bg-slate-50 px-4 pt-2 dark:bg-zinc-950">
      <View className="gap-1">
        <Text variant="h4" className="text-left">
          Perfil
        </Text>
        <Text className="text-muted-foreground">Usuario: {username ?? 'Sin usuario'}</Text>
        <Text className="text-muted-foreground">Rol: {role ?? 'Sin rol'}</Text>
        <Text className="text-muted-foreground">Empresa: {empresaNombre ?? 'Sin empresa'}</Text>
      </View>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="mt-6" variant="outline">
            <Text>Cerrar sesion</Text>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar sesion</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrara tu sesion en este dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">
                <Text>Cancelar</Text>
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onPress={handleSignOut}>
                <Text>Cerrar sesion</Text>
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
