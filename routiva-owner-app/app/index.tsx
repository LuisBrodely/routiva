import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useSignIn } from '@/features/auth/hooks/use-sign-in';
import { signInSchema, type SignInInput } from '@/features/auth/schemas/sign-in-schema';
import { useSessionStore } from '@/store/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, Stack } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

const SCREEN_OPTIONS = { headerShown: false };

export default function IndexScreen() {
  const { mutateAsync, isPending, error } = useSignIn();
  const userId = useSessionStore((state) => state.userId);
  const {
    control,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: 'admin@gmail.com',
      password: 'adminadmin',
    },
  });

  if (userId) return <Redirect href="/dashboard" />;

  async function onSubmit(values: SignInInput) {
    try {
      await mutateAsync(values);
    } catch {
      return;
    }
  }

  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 justify-center gap-5 px-6">
          <Text variant="h3" className="text-left">
            Acceso administrador
          </Text>
          <Text className="text-muted-foreground">
            Inicia sesión para administrar rutas, pedidos e inventario.
          </Text>

          <View className="gap-4">
            <View className="gap-1">
              <Text variant="small">Correo</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="owner@empresa.com"
                    value={value}
                  />
                )}
              />
              {submitCount > 0 && errors.email ? <Text className="text-destructive">{errors.email.message}</Text> : null}
            </View>

            <View className="gap-1">
              <Text variant="small">Contraseña</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="••••••••"
                    secureTextEntry
                    value={value}
                  />
                )}
              />
              {submitCount > 0 && errors.password ? (
                <Text className="text-destructive">{errors.password.message}</Text>
              ) : null}
            </View>

            {error ? <Text className="text-destructive">{error.message}</Text> : null}
            <Button disabled={isPending} onPress={handleSubmit(onSubmit)}>
              <Text>{isPending ? 'Ingresando...' : 'Iniciar sesión'}</Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
