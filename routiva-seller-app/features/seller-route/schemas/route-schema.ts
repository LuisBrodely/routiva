export const visitResults = ['PEDIDO', 'NO_ESTABA', 'NO_QUISO', 'CERRADO', 'OTRO'] as const;

export interface RouteStopVisit {
  id: string;
  resultado: (typeof visitResults)[number];
  notas: string | null;
  fechaLlegada: string | null;
  fechaSalida: string | null;
  latitudLlegada: number | null;
  longitudLlegada: number | null;
  latitudSalida: number | null;
  longitudSalida: number | null;
}

export interface SellerRouteStop {
  id: string;
  rutaId: string;
  clienteId: string;
  clienteNombre: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  puntoVentaDireccion: string | null;
  latitud: number | null;
  longitud: number | null;
  orden: number;
  estatusVisita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
  pedidoId: string | null;
  incidenciaId: string | null;
  lastVisit: RouteStopVisit | null;
}

export interface SellerRouteSummary {
  id: string;
  fecha: string;
  estatus: 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA';
  totalParadas: number;
  completadas: number;
  stops: SellerRouteStop[];
}

export interface StopCoordinateInput {
  latitud: number;
  longitud: number;
}

export interface CheckOutInput {
  resultado: (typeof visitResults)[number];
  notas?: string;
  salida?: StopCoordinateInput | null;
  createIncidence?: boolean;
}

export interface OrderDraftItem {
  productoId: string;
  cantidad: number;
}
