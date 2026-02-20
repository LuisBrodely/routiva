import { z } from 'zod';

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo es obligatorio')
    .email('Correo inválido')
    .max(120, 'Correo demasiado largo'),
  password: z
    .string()
    .trim()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Máximo 72 caracteres'),
});

export interface SignInInput extends z.infer<typeof signInSchema> {}
