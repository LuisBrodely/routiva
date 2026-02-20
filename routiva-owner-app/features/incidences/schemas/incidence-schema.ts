import { z } from 'zod';

export const incidenceTypes = ['CLIENTE_CERRADO', 'CLIENTE_NO_ESTABA', 'PROBLEMA_PAGO', 'OTRO'] as const;

export const incidenceSchema = z.object({
  vendedorId: z.string().uuid('Selecciona vendedor'),
  clienteId: z.string().uuid('Selecciona cliente'),
  tipo: z.enum(incidenceTypes),
  descripcion: z.string().trim().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  rutaId: z.string().uuid().optional().or(z.literal('')),
  paradaId: z.string().uuid().optional().or(z.literal('')),
});

export interface IncidenceFormInput {
  vendedorId: string;
  clienteId: string;
  tipo: (typeof incidenceTypes)[number];
  descripcion?: string;
  rutaId?: string;
  paradaId?: string;
}

export interface IncidenceSummary {
  id: string;
  vendedorId: string;
  vendedorNombre: string;
  clienteId: string;
  clienteNombre: string;
  tipo: (typeof incidenceTypes)[number];
  descripcion: string | null;
  fecha: string;
  rutaParadaId: string | null;
  paradaResumen: string | null;
  evidencias: Array<{
    id: string;
    url: string;
    tipo: string | null;
    fecha: string;
  }>;
  evidenciasCount: number;
}
