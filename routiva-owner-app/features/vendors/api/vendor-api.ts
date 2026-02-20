import { supabase } from '@/lib/supabase/client';

export interface VendorItem {
  id: string;
  nombreCompleto: string;
  status: 'ACTIVO' | 'INACTIVO';
}

interface RawVendor {
  id: string;
  nombre_completo: string;
  status: 'ACTIVO' | 'INACTIVO';
}

export async function getVendors(empresaId: string): Promise<VendorItem[]> {
  const { data, error } = await supabase
    .from('vendedores')
    .select('id, nombre_completo, status')
    .eq('empresa_id', empresaId)
    .order('nombre_completo', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as RawVendor[]).map((vendor) => ({
    id: vendor.id,
    nombreCompleto: vendor.nombre_completo,
    status: vendor.status,
  }));
}
