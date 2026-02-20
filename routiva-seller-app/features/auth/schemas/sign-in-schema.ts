import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export interface SignInInput extends z.infer<typeof signInSchema> {}
