export const visitResults = ['PEDIDO', 'NO_ESTABA', 'NO_QUISO', 'CERRADO', 'OTRO'] as const;

export interface VisitSummary {
  id: string;
  rutaParadaId: string;
  rutaId: string;
  rutaFecha: string;
  ordenParada: number;
  estatusVisita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
  vendedorId: string;
  vendedorNombre: string;
  clienteId: string;
  clienteNombre: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  resultado: (typeof visitResults)[number];
  notas: string | null;
  fechaLlegada: string | null;
  fechaSalida: string | null;
  latitudLlegada: number | null;
  longitudLlegada: number | null;
  latitudSalida: number | null;
  longitudSalida: number | null;
}
