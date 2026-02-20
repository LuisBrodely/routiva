import { supabase } from '@/lib/supabase/client';

import type { ClientFormInput, ClientItem } from '../schemas/client-schema';

interface RawClient {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  rfc: string | null;
  activo: boolean;
  created_at: string;
}

function mapClient(raw: RawClient): ClientItem {
  return {
    id: raw.id,
    nombreCompleto: raw.nombre_completo,
    telefono: raw.telefono,
    rfc: raw.rfc,
    activo: raw.activo,
    createdAt: raw.created_at,
  };
}

export async function getClients(empresaId: string): Promise<ClientItem[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre_completo, telefono, rfc, activo, created_at')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as RawClient[];
  return rows.map(mapClient);
}

export async function createClient(empresaId: string, input: ClientFormInput): Promise<void> {
  const { error } = await (supabase.from('clientes') as any).insert({
    empresa_id: empresaId,
    nombre_completo: input.nombreCompleto,
    telefono: input.telefono?.trim() || null,
    rfc: input.rfc?.trim() || null,
    activo: true,
  });

  if (error) throw error;
}

export async function updateClient(clientId: string, input: ClientFormInput): Promise<void> {
  const clientesTable = supabase.from('clientes') as any;

  const { error } = await clientesTable
    .update({
      nombre_completo: input.nombreCompleto,
      telefono: input.telefono?.trim() || null,
      rfc: input.rfc?.trim() || null,
    })
    .eq('id', clientId);

  if (error) throw error;
}

export async function deactivateClient(clientId: string): Promise<void> {
  const clientesTable = supabase.from('clientes') as any;
  const { error } = await clientesTable.update({ activo: false }).eq('id', clientId);
  if (error) throw error;
}

export async function activateClient(clientId: string): Promise<void> {
  const clientesTable = supabase.from('clientes') as any;
  const { error } = await clientesTable.update({ activo: true }).eq('id', clientId);
  if (error) throw error;
}
