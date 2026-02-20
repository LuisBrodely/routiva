import { supabase } from '@/lib/supabase/client';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

const INCIDENCE_EVIDENCE_BUCKET = 'incidencias-evidencias';

interface IncidenceAttachmentInput {
  uri: string;
  name: string;
  mimeType?: string | null;
}

export interface SellerIncidenceEvidence {
  id: string;
  url: string;
  tipo: string | null;
  fecha: string;
}

export interface SellerIncidenceSummary {
  id: string;
  tipo: 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO';
  descripcion: string | null;
  fecha: string;
  clienteNombre: string;
  rutaParadaId: string | null;
  evidencias: SellerIncidenceEvidence[];
  evidenciasCount: number;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getFileExtension(name: string) {
  const parts = name.split('.');
  if (parts.length < 2) return 'bin';
  return parts.at(-1)?.toLowerCase() ?? 'bin';
}

export async function getSellerIncidences(empresaId: string, vendedorId: string): Promise<SellerIncidenceSummary[]> {
  const { data: incidencesData, error: incidencesError } = await (supabase
    .from('incidencias')
    .select('id, tipo, descripcion, fecha, cliente_id')
    .eq('empresa_id', empresaId)
    .eq('vendedor_id', vendedorId)
    .order('fecha', { ascending: false })
    .limit(80) as any);

  if (incidencesError) throw incidencesError;

  const incidences = (incidencesData ?? []) as Array<{
    id: string;
    tipo: 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO';
    descripcion: string | null;
    fecha: string;
    cliente_id: string;
  }>;

  if (!incidences.length) return [];

  const clientIds = Array.from(new Set(incidences.map((item) => item.cliente_id)));
  const incidenceIds = incidences.map((item) => item.id);

  const [clientsRes, stopsRes, incidenceFilesRes] = await Promise.all([
    supabase.from('clientes').select('id, nombre_completo').in('id', clientIds),
    supabase.from('ruta_paradas').select('id, incidencia_id').in('incidencia_id', incidenceIds),
    supabase
      .from('incidencias_archivos')
      .select('incidencia_id, archivo_id')
      .eq('empresa_id', empresaId)
      .in('incidencia_id', incidenceIds),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (stopsRes.error) throw stopsRes.error;
  if (incidenceFilesRes.error) throw incidenceFilesRes.error;

  const incidenceFileLinks = (incidenceFilesRes.data ?? []) as Array<{ incidencia_id: string; archivo_id: string }>;
  const fileIds = Array.from(new Set(incidenceFileLinks.map((item) => item.archivo_id)));

  const evidenceByFileId = new Map<string, SellerIncidenceEvidence>();
  if (fileIds.length) {
    const { data: filesData, error: filesError } = await (supabase
      .from('archivos')
      .select('id, url, tipo, fecha')
      .eq('empresa_id', empresaId)
      .in('id', fileIds) as any);

    if (filesError) throw filesError;

    ((filesData ?? []) as Array<{ id: string; url: string; tipo: string | null; fecha: string }>).forEach((file) => {
      evidenceByFileId.set(file.id, {
        id: file.id,
        url: file.url,
        tipo: file.tipo,
        fecha: file.fecha,
      });
    });
  }

  const clientById = new Map<string, string>();
  ((clientsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((item) => {
    clientById.set(item.id, item.nombre_completo);
  });

  const stopByIncidenceId = new Map<string, string>();
  ((stopsRes.data ?? []) as Array<{ id: string; incidencia_id: string | null }>).forEach((item) => {
    if (item.incidencia_id) stopByIncidenceId.set(item.incidencia_id, item.id);
  });

  const evidenceByIncidenceId = new Map<string, SellerIncidenceEvidence[]>();
  incidenceFileLinks.forEach((item) => {
    const evidence = evidenceByFileId.get(item.archivo_id);
    if (!evidence) return;
    const current = evidenceByIncidenceId.get(item.incidencia_id) ?? [];
    current.push(evidence);
    evidenceByIncidenceId.set(item.incidencia_id, current);
  });

  return incidences.map((item) => ({
    evidencias: evidenceByIncidenceId.get(item.id) ?? [],
    evidenciasCount: evidenceByIncidenceId.get(item.id)?.length ?? 0,
    id: item.id,
    tipo: item.tipo,
    descripcion: item.descripcion,
    fecha: item.fecha,
    clienteNombre: clientById.get(item.cliente_id) ?? 'Cliente',
    rutaParadaId: stopByIncidenceId.get(item.id) ?? null,
  }));
}

export async function createSellerIncidence(
  empresaId: string,
  vendedorId: string,
  input: {
    clienteId: string;
    tipo: 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO';
    descripcion?: string;
    rutaParadaId?: string;
    evidencias?: IncidenceAttachmentInput[];
  }
): Promise<void> {
  const incidencesTable = supabase.from('incidencias') as any;
  const routeStopsTable = supabase.from('ruta_paradas') as any;
  const filesTable = supabase.from('archivos') as any;
  const incidenceFilesTable = supabase.from('incidencias_archivos') as any;

  const { data: incidence, error: incidenceError } = await incidencesTable
    .insert({
      empresa_id: empresaId,
      vendedor_id: vendedorId,
      cliente_id: input.clienteId,
      tipo: input.tipo,
      descripcion: input.descripcion?.trim() || null,
    })
    .select('id')
    .single();

  if (incidenceError) throw incidenceError;

  const evidenceItems = input.evidencias ?? [];
  for (const evidence of evidenceItems) {
    const fileName = sanitizeFileName(evidence.name || 'evidencia');
    const extension = getFileExtension(fileName);
    const filePath = `${empresaId}/${incidence.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const base64Data = await FileSystem.readAsStringAsync(evidence.uri, { encoding: FileSystem.EncodingType.Base64 });

    const { error: uploadError } = await supabase.storage
      .from(INCIDENCE_EVIDENCE_BUCKET)
      .upload(filePath, decode(base64Data), {
        contentType: evidence.mimeType ?? 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: archivo, error: archivoError } = await filesTable
      .insert({
        empresa_id: empresaId,
        url: filePath,
        tipo: evidence.mimeType ?? null,
      })
      .select('id')
      .single();
    if (archivoError) throw archivoError;

    const { error: relationError } = await incidenceFilesTable.insert({
      empresa_id: empresaId,
      incidencia_id: incidence.id,
      archivo_id: archivo.id,
    });
    if (relationError) throw relationError;
  }

  if (input.rutaParadaId) {
    const { error: stopError } = await routeStopsTable
      .update({ incidencia_id: incidence.id, estatus_visita: 'NO_VISITADO' })
      .eq('empresa_id', empresaId)
      .eq('id', input.rutaParadaId);

    if (stopError) throw stopError;
  }
}
