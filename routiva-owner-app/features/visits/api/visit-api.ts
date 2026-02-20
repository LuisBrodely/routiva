import { supabase } from '@/lib/supabase/client';

import type { VisitSummary } from '../schemas/visit-schema';

interface RawVisit {
  id: string;
  ruta_parada_id: string;
  vendedor_id: string;
  latitud_llegada: number | null;
  longitud_llegada: number | null;
  fecha_llegada: string | null;
  latitud_salida: number | null;
  longitud_salida: number | null;
  fecha_salida: string | null;
  resultado: 'PEDIDO' | 'NO_ESTABA' | 'NO_QUISO' | 'CERRADO' | 'OTRO';
  notas: string | null;
}

interface RawRouteStop {
  id: string;
  ruta_id: string;
  cliente_id: string;
  punto_venta_id: string;
  orden: number;
  estatus_visita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
}

interface RawRoute {
  id: string;
  fecha: string;
}

export async function getVisits(empresaId: string): Promise<VisitSummary[]> {
  const { data: visitsData, error: visitsError } = await (supabase
    .from('visitas')
    .select(
      'id, ruta_parada_id, vendedor_id, latitud_llegada, longitud_llegada, fecha_llegada, latitud_salida, longitud_salida, fecha_salida, resultado, notas'
    )
    .eq('empresa_id', empresaId)
    .order('fecha_llegada', { ascending: false, nullsFirst: false })
    .limit(100) as any);

  if (visitsError) throw visitsError;

  const visits = (visitsData ?? []) as RawVisit[];
  if (!visits.length) return [];

  const stopIds = Array.from(new Set(visits.map((item) => item.ruta_parada_id)));
  const vendorIds = Array.from(new Set(visits.map((item) => item.vendedor_id)));

  const [stopsRes, vendorsRes] = await Promise.all([
    supabase
      .from('ruta_paradas')
      .select('id, ruta_id, cliente_id, punto_venta_id, orden, estatus_visita')
      .in('id', stopIds),
    supabase.from('vendedores').select('id, nombre_completo').in('id', vendorIds),
  ]);

  if (stopsRes.error) throw stopsRes.error;
  if (vendorsRes.error) throw vendorsRes.error;

  const stops = (stopsRes.data ?? []) as RawRouteStop[];
  const routeIds = Array.from(new Set(stops.map((item) => item.ruta_id)));
  const clientIds = Array.from(new Set(stops.map((item) => item.cliente_id)));
  const pointIds = Array.from(new Set(stops.map((item) => item.punto_venta_id)));

  const [routesRes, clientsRes, pointsRes] = await Promise.all([
    supabase.from('rutas').select('id, fecha').in('id', routeIds),
    supabase.from('clientes').select('id, nombre_completo').in('id', clientIds),
    supabase.from('puntos_venta').select('id, nombre').in('id', pointIds),
  ]);

  if (routesRes.error) throw routesRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (pointsRes.error) throw pointsRes.error;

  const stopById = new Map<string, RawRouteStop>();
  stops.forEach((item) => stopById.set(item.id, item));

  const routeById = new Map<string, RawRoute>();
  ((routesRes.data ?? []) as RawRoute[]).forEach((item) => routeById.set(item.id, item));

  const vendorNameById = new Map<string, string>();
  ((vendorsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((item) => {
    vendorNameById.set(item.id, item.nombre_completo);
  });

  const clientNameById = new Map<string, string>();
  ((clientsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((item) => {
    clientNameById.set(item.id, item.nombre_completo);
  });

  const pointNameById = new Map<string, string>();
  ((pointsRes.data ?? []) as Array<{ id: string; nombre: string }>).forEach((item) => {
    pointNameById.set(item.id, item.nombre);
  });

  return visits.map((visit) => {
    const stop = stopById.get(visit.ruta_parada_id);
    const route = stop ? routeById.get(stop.ruta_id) : null;

    return {
      id: visit.id,
      rutaParadaId: visit.ruta_parada_id,
      rutaId: stop?.ruta_id ?? '',
      rutaFecha: route?.fecha ?? '',
      ordenParada: stop?.orden ?? 0,
      estatusVisita: stop?.estatus_visita ?? 'PENDIENTE',
      vendedorId: visit.vendedor_id,
      vendedorNombre: vendorNameById.get(visit.vendedor_id) ?? 'Vendedor',
      clienteId: stop?.cliente_id ?? '',
      clienteNombre: stop ? clientNameById.get(stop.cliente_id) ?? 'Cliente' : 'Cliente',
      puntoVentaId: stop?.punto_venta_id ?? '',
      puntoVentaNombre: stop ? pointNameById.get(stop.punto_venta_id) ?? 'Punto de venta' : 'Punto de venta',
      resultado: visit.resultado,
      notas: visit.notas,
      fechaLlegada: visit.fecha_llegada,
      fechaSalida: visit.fecha_salida,
      latitudLlegada: visit.latitud_llegada,
      longitudLlegada: visit.longitud_llegada,
      latitudSalida: visit.latitud_salida,
      longitudSalida: visit.longitud_salida,
    };
  });
}
