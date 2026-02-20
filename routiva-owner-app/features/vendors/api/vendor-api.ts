import { supabase } from '@/lib/supabase/client';
import type { VendorFormInput } from '../schemas/vendor-schema';

export interface VendorItem {
  id: string;
  usuarioId: string;
  nombreCompleto: string;
  telefono: string | null;
  rfc: string | null;
  status: 'ACTIVO' | 'INACTIVO';
  ultimaUbicacionLat: number | null;
  ultimaUbicacionLng: number | null;
  ultimaConexion: string | null;
}

export interface SellerUserItem {
  id: string;
  username: string;
  activo: boolean;
}

interface RawVendor {
  id: string;
  usuario_id: string;
  nombre_completo: string;
  telefono: string | null;
  rfc: string | null;
  status: 'ACTIVO' | 'INACTIVO';
  ultima_ubicacion_lat: number | null;
  ultima_ubicacion_lng: number | null;
  ultima_conexion: string | null;
}

export async function getVendors(empresaId: string): Promise<VendorItem[]> {
  const { data, error } = await supabase
    .from('vendedores')
    .select(
      'id, usuario_id, nombre_completo, telefono, rfc, status, ultima_ubicacion_lat, ultima_ubicacion_lng, ultima_conexion'
    )
    .eq('empresa_id', empresaId)
    .order('nombre_completo', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as RawVendor[]).map((vendor) => ({
    id: vendor.id,
    usuarioId: vendor.usuario_id,
    nombreCompleto: vendor.nombre_completo,
    telefono: vendor.telefono,
    rfc: vendor.rfc,
    status: vendor.status,
    ultimaUbicacionLat: vendor.ultima_ubicacion_lat,
    ultimaUbicacionLng: vendor.ultima_ubicacion_lng,
    ultimaConexion: vendor.ultima_conexion,
  }));
}

export async function getSellerUsers(empresaId: string): Promise<SellerUserItem[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, username, activo')
    .eq('empresa_id', empresaId)
    .eq('rol', 'SELLER')
    .order('username', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Array<{ id: string; username: string; activo: boolean }>).map((item) => ({
    id: item.id,
    username: item.username,
    activo: item.activo,
  }));
}

export async function createVendor(empresaId: string, input: VendorFormInput): Promise<void> {
  const table = supabase.from('vendedores') as any;
  const { error } = await table.insert({
    empresa_id: empresaId,
    usuario_id: input.usuarioId,
    nombre_completo: input.nombreCompleto,
    telefono: input.telefono.trim() || null,
    rfc: input.rfc.trim() || null,
    status: 'ACTIVO',
  });
  if (error) throw error;
}

export async function updateVendor(vendorId: string, input: VendorFormInput): Promise<void> {
  const table = supabase.from('vendedores') as any;
  const { error } = await table
    .update({
      nombre_completo: input.nombreCompleto,
      telefono: input.telefono.trim() || null,
      rfc: input.rfc.trim() || null,
    })
    .eq('id', vendorId);
  if (error) throw error;
}

export async function activateVendor(vendorId: string): Promise<void> {
  const table = supabase.from('vendedores') as any;
  const { error } = await table.update({ status: 'ACTIVO' }).eq('id', vendorId);
  if (error) throw error;
}

export async function deactivateVendor(vendorId: string): Promise<void> {
  const table = supabase.from('vendedores') as any;
  const { error } = await table.update({ status: 'INACTIVO' }).eq('id', vendorId);
  if (error) throw error;
}
