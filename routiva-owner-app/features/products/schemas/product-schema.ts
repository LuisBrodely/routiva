import { z } from 'zod';

export const productSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido'),
  unidad: z.string().trim().min(2, 'Unidad requerida'),
  precio: z
    .string()
    .trim()
    .min(1, 'Precio requerido')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, 'Precio invalido'),
});

export interface ProductFormInput extends z.infer<typeof productSchema> {}

export interface ProductItem {
  id: string;
  nombre: string;
  unidad: string;
  activo: boolean;
  precioActual: number | null;
}
