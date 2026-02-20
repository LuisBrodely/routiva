import { supabase } from '@/lib/supabase/client';

export interface TrackingInput {
  latitud: number;
  longitud: number;
  precisionMetros?: number | null;
  velocidadKmh?: number | null;
  bateriaPorcentaje?: number | null;
}

export interface SellerLocationPoint {
  id: string;
  latitud: number;
  longitud: number;
  precisionMetros: number | null;
  velocidadKmh: number | null;
  bateriaPorcentaje: number | null;
  fechaHora: string;
}

export async function pushSellerLocation(
  empresaId: string,
  vendedorId: string,
  input: TrackingInput
): Promise<void> {
  const vendorLocationsTable = supabase.from('ubicaciones_vendedores') as any;
  const vendorsTable = supabase.from('vendedores') as any;
  const nowIso = new Date().toISOString();

  const { error: insertError } = await vendorLocationsTable
    .insert({
      empresa_id: empresaId,
      vendedor_id: vendedorId,
      latitud: input.latitud,
      longitud: input.longitud,
      precision_metros: input.precisionMetros ?? null,
      velocidad_kmh: input.velocidadKmh ?? null,
      bateria_porcentaje: input.bateriaPorcentaje ?? null,
      fecha_hora: nowIso,
    });

  if (insertError) throw insertError;

  const { error: vendorUpdateError } = await vendorsTable
    .update({
      ultima_ubicacion_lat: input.latitud,
      ultima_ubicacion_lng: input.longitud,
      ultima_conexion: nowIso,
    })
    .eq('empresa_id', empresaId)
    .eq('id', vendedorId);

  if (vendorUpdateError) throw vendorUpdateError;
}

export async function getSellerLocationHistory(
  empresaId: string,
  vendedorId: string,
  limit = 120
): Promise<SellerLocationPoint[]> {
  const fromIso = new Date();
  fromIso.setHours(0, 0, 0, 0);

  const { data, error } = await (supabase
    .from('ubicaciones_vendedores')
    .select('id, latitud, longitud, precision_metros, velocidad_kmh, bateria_porcentaje, fecha_hora')
    .eq('empresa_id', empresaId)
    .eq('vendedor_id', vendedorId)
    .gte('fecha_hora', fromIso.toISOString())
    .order('fecha_hora', { ascending: false })
    .limit(limit) as any);

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    id: string;
    latitud: number;
    longitud: number;
    precision_metros: number | null;
    velocidad_kmh: number | null;
    bateria_porcentaje: number | null;
    fecha_hora: string;
  }>;

  return rows
    .map((row) => ({
      id: row.id,
      latitud: row.latitud,
      longitud: row.longitud,
      precisionMetros: row.precision_metros,
      velocidadKmh: row.velocidad_kmh,
      bateriaPorcentaje: row.bateria_porcentaje,
      fechaHora: row.fecha_hora,
    }))
    .reverse();
}
