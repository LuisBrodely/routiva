import { z } from 'zod';

export const vendorSchema = z.object({
  usuarioId: z.string().uuid('Selecciona un usuario vendedor'),
  nombreCompleto: z.string().trim().min(3, 'Nombre requerido'),
  telefono: z.string().trim(),
  rfc: z.string().trim(),
});

export type VendorFormInput = z.infer<typeof vendorSchema>;
