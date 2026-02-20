import { supabase } from '@/lib/supabase/client';

export interface SellerOrderSummary {
  id: string;
  total: number;
  estatus: 'BORRADOR' | 'CONFIRMADO' | 'ENTREGADO' | 'CANCELADO';
  fecha: string;
  clienteNombre: string;
  puntoVentaNombre: string;
  totalItems: number;
}

export async function getSellerOrders(empresaId: string, vendedorId: string): Promise<SellerOrderSummary[]> {
  const { data: ordersData, error: ordersError } = await (supabase
    .from('pedidos')
    .select('id, total, estatus, fecha, cliente_id, punto_venta_id')
    .eq('empresa_id', empresaId)
    .eq('vendedor_id', vendedorId)
    .order('fecha', { ascending: false })
    .limit(60) as any);

  if (ordersError) throw ordersError;

  const orders = (ordersData ?? []) as Array<{
    id: string;
    total: number;
    estatus: 'BORRADOR' | 'CONFIRMADO' | 'ENTREGADO' | 'CANCELADO';
    fecha: string;
    cliente_id: string;
    punto_venta_id: string;
  }>;

  if (!orders.length) return [];

  const clientIds = Array.from(new Set(orders.map((item) => item.cliente_id)));
  const pointIds = Array.from(new Set(orders.map((item) => item.punto_venta_id)));
  const orderIds = orders.map((item) => item.id);

  const [clientsRes, pointsRes, itemsRes] = await Promise.all([
    supabase.from('clientes').select('id, nombre_completo').in('id', clientIds),
    supabase.from('puntos_venta').select('id, nombre').in('id', pointIds),
    supabase.from('pedido_items').select('pedido_id').in('pedido_id', orderIds),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (pointsRes.error) throw pointsRes.error;
  if (itemsRes.error) throw itemsRes.error;

  const clientById = new Map<string, string>();
  ((clientsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((item) => {
    clientById.set(item.id, item.nombre_completo);
  });

  const pointById = new Map<string, string>();
  ((pointsRes.data ?? []) as Array<{ id: string; nombre: string }>).forEach((item) => {
    pointById.set(item.id, item.nombre);
  });

  const itemCountByOrder = new Map<string, number>();
  ((itemsRes.data ?? []) as Array<{ pedido_id: string }>).forEach((item) => {
    itemCountByOrder.set(item.pedido_id, (itemCountByOrder.get(item.pedido_id) ?? 0) + 1);
  });

  return orders.map((item) => ({
    id: item.id,
    total: item.total,
    estatus: item.estatus,
    fecha: item.fecha,
    clienteNombre: clientById.get(item.cliente_id) ?? 'Cliente',
    puntoVentaNombre: pointById.get(item.punto_venta_id) ?? 'Punto de venta',
    totalItems: itemCountByOrder.get(item.id) ?? 0,
  }));
}
