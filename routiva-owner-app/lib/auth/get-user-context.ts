import { supabase } from '@/lib/supabase/client';

interface UserContext {
  username: string | null;
  empresaId: string | null;
  empresaNombre: string | null;
  role: 'OWNER' | 'ADMIN' | 'SELLER' | null;
}

export async function getUserContext(authUserId: string): Promise<UserContext> {
  const { data: usuarioRaw, error: usuarioError } = await supabase
    .from('usuarios')
    .select('empresa_id, username, rol')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (usuarioError) throw new Error(`[usuarios] ${usuarioError.message}`);
  const usuario = usuarioRaw as {
    empresa_id: string;
    username: string;
    rol: 'OWNER' | 'ADMIN' | 'SELLER';
  } | null;
  if (!usuario) return { username: null, empresaId: null, empresaNombre: null, role: null };

  const { data: empresaRaw, error: empresaError } = await supabase
    .from('empresas')
    .select('nombre')
    .eq('id', usuario.empresa_id)
    .maybeSingle();

  if (empresaError) throw new Error(`[empresas] ${empresaError.message}`);
  const empresa = empresaRaw as { nombre: string } | null;

  return {
    username: usuario.username,
    empresaId: usuario.empresa_id,
    empresaNombre: empresa?.nombre ?? null,
    role: usuario.rol,
  };
}
