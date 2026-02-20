import { supabase } from '@/lib/supabase/client';

import type { RouteFormInput, RouteStopSummary, RouteSummary } from '../schemas/route-schema';

interface RawRoute {
  id: string;
  vendedor_id: string;
  fecha: string;
  estatus: 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA';
}

interface RawRouteStop {
  id: string;
  ruta_id: string;
  cliente_id: string;
  punto_venta_id: string;
  orden: number;
  estatus_visita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
  pedido_id: string | null;
}

export async function getRoutes(empresaId: string): Promise<RouteSummary[]> {
  const { data: routesData, error: routesError } = await (supabase
    .from('rutas')
    .select('id, vendedor_id, fecha, estatus')
    .eq('empresa_id', empresaId)
    .order('fecha', { ascending: false })
    .limit(30) as any);

  if (routesError) throw routesError;

  const routes = (routesData ?? []) as RawRoute[];
  if (!routes.length) return [];

  const routeIds = routes.map((item) => item.id);
  const vendorIds = Array.from(new Set(routes.map((item) => item.vendedor_id)));

  const [stopsRes, vendorsRes] = await Promise.all([
    supabase.from('ruta_paradas').select('id, ruta_id').in('ruta_id', routeIds),
    supabase.from('vendedores').select('id, nombre_completo').in('id', vendorIds),
  ]);

  if (stopsRes.error) throw stopsRes.error;
  if (vendorsRes.error) throw vendorsRes.error;

  const stopsCountByRoute = new Map<string, number>();
  ((stopsRes.data ?? []) as Array<{ id: string; ruta_id: string }>).forEach((row) => {
    const current = stopsCountByRoute.get(row.ruta_id) ?? 0;
    stopsCountByRoute.set(row.ruta_id, current + 1);
  });

  const vendorNameById = new Map<string, string>();
  ((vendorsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((row) => {
    vendorNameById.set(row.id, row.nombre_completo);
  });

  return routes.map((route) => ({
    id: route.id,
    vendedorId: route.vendedor_id,
    vendedorNombre: vendorNameById.get(route.vendedor_id) ?? 'Vendedor',
    fecha: route.fecha,
    estatus: route.estatus,
    totalParadas: stopsCountByRoute.get(route.id) ?? 0,
  }));
}

export async function getRouteStops(empresaId: string, routeId: string): Promise<RouteStopSummary[]> {
  const { data: stopsData, error: stopsError } = await (supabase
    .from('ruta_paradas')
    .select('id, ruta_id, cliente_id, punto_venta_id, orden, estatus_visita, pedido_id')
    .eq('empresa_id', empresaId)
    .eq('ruta_id', routeId)
    .order('orden', { ascending: true }) as any);

  if (stopsError) throw stopsError;

  const stops = (stopsData ?? []) as RawRouteStop[];
  if (!stops.length) return [];

  const clientIds = Array.from(new Set(stops.map((item) => item.cliente_id)));
  const pointIds = Array.from(new Set(stops.map((item) => item.punto_venta_id)));

  const [clientsRes, pointsRes] = await Promise.all([
    supabase.from('clientes').select('id, nombre_completo').in('id', clientIds),
    supabase.from('puntos_venta').select('id, nombre').in('id', pointIds),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (pointsRes.error) throw pointsRes.error;

  const clientNameById = new Map<string, string>();
  ((clientsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((row) => {
    clientNameById.set(row.id, row.nombre_completo);
  });

  const pointNameById = new Map<string, string>();
  ((pointsRes.data ?? []) as Array<{ id: string; nombre: string }>).forEach((row) => {
    pointNameById.set(row.id, row.nombre);
  });

  return stops.map((stop) => ({
    id: stop.id,
    rutaId: stop.ruta_id,
    clienteId: stop.cliente_id,
    clienteNombre: clientNameById.get(stop.cliente_id) ?? 'Cliente',
    puntoVentaId: stop.punto_venta_id,
    puntoVentaNombre: pointNameById.get(stop.punto_venta_id) ?? 'Punto de venta',
    orden: stop.orden,
    estatusVisita: stop.estatus_visita,
    pedidoId: stop.pedido_id,
  }));
}

export async function createRoute(empresaId: string, input: RouteFormInput): Promise<void> {
  const routesTable = supabase.from('rutas') as any;
  const routeStopsTable = supabase.from('ruta_paradas') as any;

  const { data: route, error: routeError } = await routesTable
    .insert({
      empresa_id: empresaId,
      vendedor_id: input.vendedorId,
      fecha: input.fecha,
      estatus: 'PLANIFICADA',
    })
    .select('id')
    .single();

  if (routeError) throw routeError;

  const stopsToInsert = input.stops.map((stop, index) => ({
    empresa_id: empresaId,
    ruta_id: route.id,
    cliente_id: stop.clienteId,
    punto_venta_id: stop.puntoVentaId,
    orden: index + 1,
    estatus_visita: 'PENDIENTE',
    pedido_id: stop.pedidoId || null,
  }));

  const { error: stopsError } = await routeStopsTable.insert(stopsToInsert);
  if (stopsError) throw stopsError;
}
