import { z } from 'zod';

export const clientSchema = z.object({
  nombreCompleto: z.string().min(2, 'Nombre requerido'),
  telefono: z.string().trim().max(25, 'Telefono demasiado largo').optional(),
  rfc: z.string().trim().max(20, 'RFC demasiado largo').optional(),
});

export interface ClientFormInput extends z.infer<typeof clientSchema> {}

export interface ClientItem {
  id: string;
  nombreCompleto: string;
  telefono: string | null;
  rfc: string | null;
  activo: boolean;
  createdAt: string;
}
