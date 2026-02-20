import { supabase } from '@/lib/supabase/client';

import type { OrderFormInput, OrderItemSummary, OrderSummary } from '../schemas/order-schema';

interface RawOrder {
  id: string;
  cliente_id: string;
  punto_venta_id: string;
  vendedor_id: string;
  total: number | string;
  estatus: 'BORRADOR' | 'CONFIRMADO' | 'ENTREGADO' | 'CANCELADO';
  fecha: string;
}

interface RawOrderItem {
  id: string;
  pedido_id: string;
  producto_id: string;
  cantidad: number | string;
  precio_unitario: number | string;
  subtotal: number | string;
}

interface RawProduct {
  id: string;
  nombre: string;
}

interface RawInventory {
  id: string;
  producto_id: string;
  cantidad: number | string;
}

interface RawPrice {
  producto_id: string;
  precio: number | string;
}

function toNumber(value: number | string): number {
  if (typeof value === 'number') return value;
  return Number(value);
}

export async function getOrders(empresaId: string): Promise<OrderSummary[]> {
  const { data: ordersData, error: ordersError } = await (supabase
    .from('pedidos')
    .select('id, cliente_id, punto_venta_id, vendedor_id, total, estatus, fecha')
    .eq('empresa_id', empresaId)
    .order('fecha', { ascending: false })
    .limit(30) as any);

  if (ordersError) throw ordersError;

  const orders = (ordersData ?? []) as RawOrder[];
  if (!orders.length) return [];

  const clientIds = Array.from(new Set(orders.map((item) => item.cliente_id)));
  const pointIds = Array.from(new Set(orders.map((item) => item.punto_venta_id)));
  const vendorIds = Array.from(new Set(orders.map((item) => item.vendedor_id)));

  const [clientsRes, pointsRes, vendorsRes] = await Promise.all([
    supabase.from('clientes').select('id, nombre_completo').in('id', clientIds),
    supabase.from('puntos_venta').select('id, nombre').in('id', pointIds),
    supabase.from('vendedores').select('id, nombre_completo').in('id', vendorIds),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (pointsRes.error) throw pointsRes.error;
  if (vendorsRes.error) throw vendorsRes.error;

  const clientNameById = new Map<string, string>();
  ((clientsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((item) => {
    clientNameById.set(item.id, item.nombre_completo);
  });

  const pointNameById = new Map<string, string>();
  ((pointsRes.data ?? []) as Array<{ id: string; nombre: string }>).forEach((item) => {
    pointNameById.set(item.id, item.nombre);
  });

  const vendorNameById = new Map<string, string>();
  ((vendorsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((item) => {
    vendorNameById.set(item.id, item.nombre_completo);
  });

  return orders.map((item) => ({
    id: item.id,
    clienteId: item.cliente_id,
    clienteNombre: clientNameById.get(item.cliente_id) ?? 'Cliente',
    puntoVentaId: item.punto_venta_id,
    puntoVentaNombre: pointNameById.get(item.punto_venta_id) ?? 'Punto de venta',
    vendedorId: item.vendedor_id,
    vendedorNombre: vendorNameById.get(item.vendedor_id) ?? 'Vendedor',
    total: toNumber(item.total),
    estatus: item.estatus,
    fecha: item.fecha,
  }));
}

export async function getOrderItems(empresaId: string, orderId: string): Promise<OrderItemSummary[]> {
  const { data: itemsData, error: itemsError } = await (supabase
    .from('pedido_items')
    .select('id, pedido_id, producto_id, cantidad, precio_unitario, subtotal')
    .eq('empresa_id', empresaId)
    .eq('pedido_id', orderId) as any);

  if (itemsError) throw itemsError;

  const items = (itemsData ?? []) as RawOrderItem[];
  if (!items.length) return [];

  const productIds = Array.from(new Set(items.map((item) => item.producto_id)));

  const { data: productsData, error: productsError } = await supabase
    .from('productos')
    .select('id, nombre')
    .in('id', productIds);

  if (productsError) throw productsError;

  const productById = new Map<string, string>();
  ((productsData ?? []) as RawProduct[]).forEach((product) => {
    productById.set(product.id, product.nombre);
  });

  return items.map((item) => ({
    id: item.id,
    productoId: item.producto_id,
    productoNombre: productById.get(item.producto_id) ?? 'Producto',
    cantidad: toNumber(item.cantidad),
    precioUnitario: toNumber(item.precio_unitario),
    subtotal: toNumber(item.subtotal),
  }));
}

async function getLatestPrices(empresaId: string, productIds: string[]): Promise<Map<string, number>> {
  const { data, error } = await (supabase
    .from('precios_productos')
    .select('producto_id, precio, vigente_desde')
    .eq('empresa_id', empresaId)
    .in('producto_id', productIds)
    .order('vigente_desde', { ascending: false }) as any);

  if (error) throw error;

  const pricesByProduct = new Map<string, number>();
  ((data ?? []) as Array<RawPrice & { vigente_desde: string }>).forEach((row) => {
    if (!pricesByProduct.has(row.producto_id)) pricesByProduct.set(row.producto_id, toNumber(row.precio));
  });

  return pricesByProduct;
}

export async function createOrderDraft(empresaId: string, input: OrderFormInput): Promise<void> {
  const ordersTable = supabase.from('pedidos') as any;
  const orderItemsTable = supabase.from('pedido_items') as any;
  const sanitizedItems = input.items
    .map((item) => ({ productoId: item.productoId, cantidad: Number(item.cantidad) }))
    .filter((item) => item.productoId && item.cantidad > 0);

  if (!sanitizedItems.length) throw new Error('Agrega al menos un producto');

  const productIds = Array.from(new Set(sanitizedItems.map((item) => item.productoId)));
  const latestPrices = await getLatestPrices(empresaId, productIds);

  const orderItems = sanitizedItems.map((item) => {
    const unitPrice = latestPrices.get(item.productoId);
    if (unitPrice === undefined) throw new Error('Hay productos sin precio vigente');

    const subtotal = Number((item.cantidad * unitPrice).toFixed(2));

    return {
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: unitPrice,
      subtotal,
    };
  });

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const { data: orderData, error: orderError } = await ordersTable
    .insert({
      empresa_id: empresaId,
      cliente_id: input.clienteId,
      punto_venta_id: input.puntoVentaId,
      vendedor_id: input.vendedorId,
      total,
      estatus: 'BORRADOR',
    })
    .select('id')
    .single();

  if (orderError) throw orderError;

  const { error: itemsError } = await orderItemsTable.insert(
    orderItems.map((item) => ({
      empresa_id: empresaId,
      pedido_id: orderData.id,
      producto_id: item.productoId,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
      subtotal: item.subtotal,
    }))
  );

  if (itemsError) throw itemsError;
}

export async function confirmOrder(empresaId: string, orderId: string): Promise<void> {
  const { data: order, error: orderError } = await (supabase
    .from('pedidos')
    .select('id, estatus')
    .eq('empresa_id', empresaId)
    .eq('id', orderId)
    .single() as any);

  if (orderError) throw orderError;
  if (order.estatus !== 'BORRADOR') throw new Error('Solo se pueden confirmar pedidos en borrador');

  const { data: orderItemsData, error: orderItemsError } = await (supabase
    .from('pedido_items')
    .select('id, producto_id, cantidad')
    .eq('empresa_id', empresaId)
    .eq('pedido_id', orderId) as any);

  if (orderItemsError) throw orderItemsError;

  const orderItems = (orderItemsData ?? []) as Array<{ id: string; producto_id: string; cantidad: number | string }>;
  if (!orderItems.length) throw new Error('El pedido no tiene productos');

  const productIds = Array.from(new Set(orderItems.map((item) => item.producto_id)));

  const { data: inventoryData, error: inventoryError } = await (supabase
    .from('inventarios')
    .select('id, producto_id, cantidad')
    .eq('empresa_id', empresaId)
    .eq('ubicacion_tipo', 'ALMACEN')
    .eq('ubicacion_id', empresaId)
    .in('producto_id', productIds) as any);

  if (inventoryError) throw inventoryError;

  const inventoryByProduct = new Map<string, RawInventory>();
  ((inventoryData ?? []) as RawInventory[]).forEach((item) => {
    inventoryByProduct.set(item.producto_id, item);
  });

  for (const item of orderItems) {
    const inventory = inventoryByProduct.get(item.producto_id);
    const required = toNumber(item.cantidad);
    if (!inventory || toNumber(inventory.cantidad) < required) throw new Error('Inventario insuficiente para confirmar el pedido');
  }

  for (const item of orderItems) {
    const inventory = inventoryByProduct.get(item.producto_id)!;
    const required = toNumber(item.cantidad);
    const nextAmount = toNumber(inventory.cantidad) - required;

    const { error: updateInventoryError } = await (supabase.from('inventarios') as any)
      .update({ cantidad: nextAmount })
      .eq('id', inventory.id);

    if (updateInventoryError) throw updateInventoryError;

    const { error: movementError } = await (supabase.from('movimientos_inventario') as any).insert({
      empresa_id: empresaId,
      producto_id: item.producto_id,
      tipo: 'VENTA',
      cantidad: required,
      referencia_tipo: 'PEDIDO',
      referencia_id: orderId,
    });

    if (movementError) throw movementError;
  }

  const { error: updateOrderError } = await (supabase.from('pedidos') as any)
    .update({ estatus: 'CONFIRMADO' })
    .eq('id', orderId);

  if (updateOrderError) throw updateOrderError;
}
