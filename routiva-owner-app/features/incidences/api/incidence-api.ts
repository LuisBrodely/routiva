import { supabase } from '@/lib/supabase/client';

import type { IncidenceFormInput, IncidenceSummary } from '../schemas/incidence-schema';

interface RawIncidence {
  id: string;
  vendedor_id: string;
  cliente_id: string;
  tipo: 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO';
  descripcion: string | null;
  fecha: string;
}

interface RawRouteStop {
  id: string;
  ruta_id: string;
  cliente_id: string;
  punto_venta_id: string;
  orden: number;
  incidencia_id: string | null;
}

export async function getIncidences(empresaId: string): Promise<IncidenceSummary[]> {
  const { data: incidencesData, error: incidencesError } = await (supabase
    .from('incidencias')
    .select('id, vendedor_id, cliente_id, tipo, descripcion, fecha')
    .eq('empresa_id', empresaId)
    .order('fecha', { ascending: false })
    .limit(40) as any);

  if (incidencesError) throw incidencesError;

  const incidences = (incidencesData ?? []) as RawIncidence[];
  if (!incidences.length) return [];

  const vendorIds = Array.from(new Set(incidences.map((item) => item.vendedor_id)));
  const clientIds = Array.from(new Set(incidences.map((item) => item.cliente_id)));
  const incidenceIds = incidences.map((item) => item.id);

  const [vendorsRes, clientsRes, stopsRes, pointsRes] = await Promise.all([
    supabase.from('vendedores').select('id, nombre_completo').in('id', vendorIds),
    supabase.from('clientes').select('id, nombre_completo').in('id', clientIds),
    supabase.from('ruta_paradas').select('id, ruta_id, cliente_id, punto_venta_id, orden, incidencia_id').in('incidencia_id', incidenceIds),
    supabase.from('puntos_venta').select('id, nombre').eq('empresa_id', empresaId),
  ]);

  if (vendorsRes.error) throw vendorsRes.error;
  if (clientsRes.error) throw clientsRes.error;
  if (stopsRes.error) throw stopsRes.error;
  if (pointsRes.error) throw pointsRes.error;

  const vendorNameById = new Map<string, string>();
  ((vendorsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((row) => {
    vendorNameById.set(row.id, row.nombre_completo);
  });

  const clientNameById = new Map<string, string>();
  ((clientsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((row) => {
    clientNameById.set(row.id, row.nombre_completo);
  });

  const pointNameById = new Map<string, string>();
  ((pointsRes.data ?? []) as Array<{ id: string; nombre: string }>).forEach((row) => {
    pointNameById.set(row.id, row.nombre);
  });

  const stopByIncidenceId = new Map<string, RawRouteStop>();
  ((stopsRes.data ?? []) as RawRouteStop[]).forEach((stop) => {
    if (stop.incidencia_id) stopByIncidenceId.set(stop.incidencia_id, stop);
  });

  return incidences.map((incidence) => {
    const stop = stopByIncidenceId.get(incidence.id);
    const pointName = stop ? pointNameById.get(stop.punto_venta_id) ?? 'Punto de venta' : null;

    return {
      id: incidence.id,
      vendedorId: incidence.vendedor_id,
      vendedorNombre: vendorNameById.get(incidence.vendedor_id) ?? 'Vendedor',
      clienteId: incidence.cliente_id,
      clienteNombre: clientNameById.get(incidence.cliente_id) ?? 'Cliente',
      tipo: incidence.tipo,
      descripcion: incidence.descripcion,
      fecha: incidence.fecha,
      rutaParadaId: stop?.id ?? null,
      paradaResumen: stop ? `Ruta ${stop.ruta_id.slice(0, 6)} • Parada #${stop.orden} • ${pointName}` : null,
    };
  });
}

export async function createIncidence(empresaId: string, input: IncidenceFormInput): Promise<void> {
  const incidencesTable = supabase.from('incidencias') as any;
  const routeStopsTable = supabase.from('ruta_paradas') as any;

  const { data: incidence, error: incidenceError } = await incidencesTable
    .insert({
      empresa_id: empresaId,
      cliente_id: input.clienteId,
      vendedor_id: input.vendedorId,
      tipo: input.tipo,
      descripcion: input.descripcion?.trim() || null,
    })
    .select('id')
    .single();

  if (incidenceError) throw incidenceError;

  if (input.paradaId) {
    const { error: stopUpdateError } = await routeStopsTable
      .update({ incidencia_id: incidence.id })
      .eq('id', input.paradaId)
      .eq('empresa_id', empresaId);

    if (stopUpdateError) throw stopUpdateError;
  }
}

export async function getRouteStopsByEmpresa(empresaId: string, routeId: string): Promise<RawRouteStop[]> {
  const { data, error } = await (supabase
    .from('ruta_paradas')
    .select('id, ruta_id, cliente_id, punto_venta_id, orden, incidencia_id')
    .eq('empresa_id', empresaId)
    .eq('ruta_id', routeId)
    .order('orden', { ascending: true }) as any);

  if (error) throw error;
  return (data ?? []) as RawRouteStop[];
}
