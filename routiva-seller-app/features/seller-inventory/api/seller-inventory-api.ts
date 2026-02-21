import { supabase } from '@/lib/supabase/client';

export interface SellerInventoryItem {
  productoId: string;
  productoNombre: string;
  unidad: string;
  cantidad: number;
}

export async function getSellerInventory(empresaId: string, vendedorId: string): Promise<SellerInventoryItem[]> {
  const [inventoryRes, productsRes] = await Promise.all([
    supabase
      .from('inventarios')
      .select('producto_id, cantidad')
      .eq('empresa_id', empresaId)
      .eq('ubicacion_tipo', 'VENDEDOR')
      .eq('ubicacion_id', vendedorId),
    supabase.from('productos').select('id, nombre, unidad').eq('empresa_id', empresaId),
  ]);

  if (inventoryRes.error) throw inventoryRes.error;
  if (productsRes.error) throw productsRes.error;

  const productById = new Map<string, { nombre: string; unidad: string }>();
  ((productsRes.data ?? []) as Array<{ id: string; nombre: string; unidad: string }>).forEach((row) => {
    productById.set(row.id, { nombre: row.nombre, unidad: row.unidad });
  });

  return ((inventoryRes.data ?? []) as Array<{ producto_id: string; cantidad: number }>)
    .map((row) => ({
      productoId: row.producto_id,
      productoNombre: productById.get(row.producto_id)?.nombre ?? 'Producto',
      unidad: productById.get(row.producto_id)?.unidad ?? 'unidad',
      cantidad: row.cantidad ?? 0,
    }))
    .sort((a, b) => a.productoNombre.localeCompare(b.productoNombre, 'es'));
}
