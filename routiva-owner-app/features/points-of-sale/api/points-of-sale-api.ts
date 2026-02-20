import { supabase } from '@/lib/supabase/client';

import type { PointOfSaleFormInput, PointOfSaleItem } from '../schemas/point-of-sale-schema';

interface RawPointOfSale {
  id: string;
  cliente_id: string;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  horario: string | null;
  notas: string | null;
  activo: boolean;
}

function parseCoordinate(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function mapPoint(raw: RawPointOfSale): PointOfSaleItem {
  return {
    id: raw.id,
    clienteId: raw.cliente_id,
    nombre: raw.nombre,
    direccion: raw.direccion,
    latitud: raw.latitud,
    longitud: raw.longitud,
    horario: raw.horario,
    notas: raw.notas,
    activo: raw.activo,
  };
}

export async function getPointsOfSale(empresaId: string, clienteId: string): Promise<PointOfSaleItem[]> {
  const { data, error } = await supabase
    .from('puntos_venta')
    .select('id, cliente_id, nombre, direccion, latitud, longitud, horario, notas, activo')
    .eq('empresa_id', empresaId)
    .eq('cliente_id', clienteId)
    .order('nombre', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as RawPointOfSale[]).map(mapPoint);
}

export async function getPointsOfSaleByEmpresa(empresaId: string): Promise<PointOfSaleItem[]> {
  const { data, error } = await supabase
    .from('puntos_venta')
    .select('id, cliente_id, nombre, direccion, latitud, longitud, horario, notas, activo')
    .eq('empresa_id', empresaId)
    .order('nombre', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as RawPointOfSale[]).map(mapPoint);
}

export async function createPointOfSale(
  empresaId: string,
  clienteId: string,
  input: PointOfSaleFormInput
): Promise<void> {
  const table = supabase.from('puntos_venta') as any;

  const { error } = await table.insert({
    empresa_id: empresaId,
    cliente_id: clienteId,
    nombre: input.nombre,
    direccion: input.direccion,
    latitud: parseCoordinate(input.latitud),
    longitud: parseCoordinate(input.longitud),
    horario: input.horario?.trim() || null,
    notas: input.notas?.trim() || null,
    activo: true,
  });

  if (error) throw error;
}

export async function updatePointOfSale(pointId: string, input: PointOfSaleFormInput): Promise<void> {
  const table = supabase.from('puntos_venta') as any;

  const { error } = await table
    .update({
      nombre: input.nombre,
      direccion: input.direccion,
      latitud: parseCoordinate(input.latitud),
      longitud: parseCoordinate(input.longitud),
      horario: input.horario?.trim() || null,
      notas: input.notas?.trim() || null,
    })
    .eq('id', pointId);

  if (error) throw error;
}

export async function deactivatePointOfSale(pointId: string): Promise<void> {
  const table = supabase.from('puntos_venta') as any;
  const { error } = await table.update({ activo: false }).eq('id', pointId);
  if (error) throw error;
}
