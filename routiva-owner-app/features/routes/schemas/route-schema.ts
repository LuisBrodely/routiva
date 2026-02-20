import { z } from 'zod';

const routeStopSchema = z.object({
  clienteId: z.string().uuid('Selecciona un cliente'),
  puntoVentaId: z.string().uuid('Selecciona un punto de venta'),
  pedidoId: z.string().uuid().optional().or(z.literal('')),
});

export const routeSchema = z.object({
  vendedorId: z.string().uuid('Selecciona un vendedor'),
  fecha: z.string().min(1, 'Selecciona una fecha'),
  stops: z.array(routeStopSchema).min(1, 'Agrega al menos una parada'),
});

export interface RouteFormInput {
  vendedorId: string;
  fecha: string;
  stops: Array<{
    clienteId: string;
    puntoVentaId: string;
    pedidoId?: string;
  }>;
}

export interface RouteSummary {
  id: string;
  vendedorId: string;
  vendedorNombre: string;
  fecha: string;
  estatus: 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA';
  totalParadas: number;
}

export interface RouteStopSummary {
  id: string;
  rutaId: string;
  clienteId: string;
  clienteNombre: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  orden: number;
  estatusVisita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
  pedidoId: string | null;
}
