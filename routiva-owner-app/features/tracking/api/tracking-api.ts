import { supabase } from '@/lib/supabase/client';

export interface VendorLivePosition {
  vendedorId: string;
  vendedorNombre: string;
  latitud: number;
  longitud: number;
  ultimaConexion: string | null;
  bateriaPorcentaje: number | null;
  velocidadKmh: number | null;
}

export interface VendorLocationPoint {
  id: string;
  latitud: number;
  longitud: number;
  precisionMetros: number | null;
  velocidadKmh: number | null;
  bateriaPorcentaje: number | null;
  fechaHora: string;
}

interface RawVendor {
  id: string;
  nombre_completo: string;
  status: 'ACTIVO' | 'INACTIVO';
  ultima_ubicacion_lat: number | null;
  ultima_ubicacion_lng: number | null;
  ultima_conexion: string | null;
}

interface RawLocation {
  id: string;
  latitud: number;
  longitud: number;
  precision_metros: number | null;
  velocidad_kmh: number | null;
  bateria_porcentaje: number | null;
  fecha_hora: string;
}

export async function getLiveVendorPositions(empresaId: string): Promise<VendorLivePosition[]> {
  const { data: vendorsData, error: vendorsError } = await supabase
    .from('vendedores')
    .select('id, nombre_completo, status, ultima_ubicacion_lat, ultima_ubicacion_lng, ultima_conexion')
    .eq('empresa_id', empresaId)
    .eq('status', 'ACTIVO')
    .order('nombre_completo', { ascending: true });

  if (vendorsError) throw vendorsError;

  const vendors = (vendorsData ?? []) as RawVendor[];
  const positionedVendors = vendors.filter(
    (vendor) => vendor.ultima_ubicacion_lat !== null && vendor.ultima_ubicacion_lng !== null
  );

  if (!positionedVendors.length) return [];

  const vendorIds = positionedVendors.map((vendor) => vendor.id);

  const { data: recentLocationsData, error: recentLocationsError } = await (supabase
    .from('ubicaciones_vendedores')
    .select('vendedor_id, velocidad_kmh, bateria_porcentaje, fecha_hora')
    .eq('empresa_id', empresaId)
    .in('vendedor_id', vendorIds)
    .order('fecha_hora', { ascending: false }) as any);

  if (recentLocationsError) throw recentLocationsError;

  const latestDataByVendor = new Map<
    string,
    { velocidad_kmh: number | null; bateria_porcentaje: number | null; fecha_hora: string }
  >();

  ((recentLocationsData ?? []) as Array<{ vendedor_id: string; velocidad_kmh: number | null; bateria_porcentaje: number | null; fecha_hora: string }>).forEach((row) => {
    if (!latestDataByVendor.has(row.vendedor_id)) {
      latestDataByVendor.set(row.vendedor_id, {
        velocidad_kmh: row.velocidad_kmh,
        bateria_porcentaje: row.bateria_porcentaje,
        fecha_hora: row.fecha_hora,
      });
    }
  });

  return positionedVendors.map((vendor) => {
    const latest = latestDataByVendor.get(vendor.id);

    return {
      vendedorId: vendor.id,
      vendedorNombre: vendor.nombre_completo,
      latitud: vendor.ultima_ubicacion_lat!,
      longitud: vendor.ultima_ubicacion_lng!,
      ultimaConexion: vendor.ultima_conexion,
      bateriaPorcentaje: latest?.bateria_porcentaje ?? null,
      velocidadKmh: latest?.velocidad_kmh ?? null,
    };
  });
}

export async function getVendorLocationHistory(
  empresaId: string,
  vendedorId: string,
  limit = 80
): Promise<VendorLocationPoint[]> {
  const { data, error } = await (supabase
    .from('ubicaciones_vendedores')
    .select('id, latitud, longitud, precision_metros, velocidad_kmh, bateria_porcentaje, fecha_hora')
    .eq('empresa_id', empresaId)
    .eq('vendedor_id', vendedorId)
    .order('fecha_hora', { ascending: false })
    .limit(limit) as any);

  if (error) throw error;

  return ((data ?? []) as RawLocation[]).map((row) => ({
    id: row.id,
    latitud: row.latitud,
    longitud: row.longitud,
    precisionMetros: row.precision_metros,
    velocidadKmh: row.velocidad_kmh,
    bateriaPorcentaje: row.bateria_porcentaje,
    fechaHora: row.fecha_hora,
  }));
}
