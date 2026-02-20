import { supabase } from '@/lib/supabase/client';

interface UserContext {
  username: string | null;
  empresaId: string | null;
  empresaNombre: string | null;
  vendedorId: string | null;
  vendedorNombre: string | null;
  role: 'OWNER' | 'ADMIN' | 'SELLER' | null;
}

export async function getUserContext(authUserId: string): Promise<UserContext> {
  const { data: usuarioRaw, error: usuarioError } = await supabase
    .from('usuarios')
    .select('id, empresa_id, username, rol')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (usuarioError) throw new Error(`[usuarios] ${usuarioError.message}`);
  const usuario = usuarioRaw as {
    id: string;
    empresa_id: string;
    username: string;
    rol: 'OWNER' | 'ADMIN' | 'SELLER';
  } | null;
  if (!usuario) {
    return { username: null, empresaId: null, empresaNombre: null, vendedorId: null, vendedorNombre: null, role: null };
  }

  const [empresaRes, vendedorRes] = await Promise.all([
    supabase.from('empresas').select('nombre').eq('id', usuario.empresa_id).maybeSingle(),
    supabase
      .from('vendedores')
      .select('id, nombre_completo')
      .eq('empresa_id', usuario.empresa_id)
      .eq('usuario_id', usuario.id)
      .maybeSingle(),
  ]);

  if (empresaRes.error) throw new Error(`[empresas] ${empresaRes.error.message}`);
  if (vendedorRes.error) throw new Error(`[vendedores] ${vendedorRes.error.message}`);

  const empresa = empresaRes.data as { nombre: string } | null;
  const vendedor = vendedorRes.data as { id: string; nombre_completo: string } | null;

  return {
    username: usuario.username,
    empresaId: usuario.empresa_id,
    empresaNombre: empresa?.nombre ?? null,
    vendedorId: vendedor?.id ?? null,
    vendedorNombre: vendedor?.nombre_completo ?? null,
    role: usuario.rol,
  };
}
