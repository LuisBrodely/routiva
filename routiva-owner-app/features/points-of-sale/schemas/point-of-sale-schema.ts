import { z } from 'zod';

function optionalCoordinateField(message: string) {
  return z.string().trim().optional().refine((value) => !value || !Number.isNaN(Number(value)), message);
}

export const pointOfSaleSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido'),
  direccion: z.string().trim().min(4, 'Direccion requerida'),
  latitud: optionalCoordinateField('Latitud invalida'),
  longitud: optionalCoordinateField('Longitud invalida'),
  horario: z.string().trim().max(120, 'Horario demasiado largo').optional(),
  notas: z.string().trim().max(300, 'Notas demasiado largas').optional(),
});

export interface PointOfSaleFormInput extends z.infer<typeof pointOfSaleSchema> {}

export interface PointOfSaleItem {
  id: string;
  clienteId: string;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  horario: string | null;
  notas: string | null;
  activo: boolean;
}
