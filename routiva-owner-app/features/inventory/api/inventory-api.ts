import { supabase } from '@/lib/supabase/client';

import type {
  InventoryItem,
  InventoryTransferFormInput,
  VendorInventoryItem,
  InventoryMovementFormInput,
  InventoryMovementItem,
} from '../schemas/inventory-schema';

interface RawProduct {
  id: string;
  nombre: string;
  unidad: string;
  activo: boolean;
}

interface RawInventory {
  id: string;
  producto_id: string;
  cantidad: number | string;
}

interface RawMovement {
  id: string;
  producto_id: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'VENTA' | 'MERMA' | 'AJUSTE';
  cantidad: number | string;
  referencia_tipo: 'PEDIDO' | 'AJUSTE' | 'DEVOLUCION' | null;
  referencia_id: string | null;
  fecha: string;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
}

export async function getInventorySummary(empresaId: string): Promise<InventoryItem[]> {
  const { data: productsData, error: productsError } = await supabase
    .from('productos')
    .select('id, nombre, unidad, activo')
    .eq('empresa_id', empresaId)
    .order('nombre', { ascending: true });

  if (productsError) throw productsError;

  const products = (productsData ?? []) as RawProduct[];

  const { data: warehouseData, error: warehouseError } = await (supabase
    .from('inventarios')
    .select('id, producto_id, cantidad')
    .eq('empresa_id', empresaId)
    .eq('ubicacion_tipo', 'ALMACEN')
    .eq('ubicacion_id', empresaId) as any);

  if (warehouseError) throw warehouseError;

  const { data: vendorData, error: vendorError } = await (supabase
    .from('inventarios')
    .select('id, producto_id, cantidad')
    .eq('empresa_id', empresaId)
    .eq('ubicacion_tipo', 'VENDEDOR') as any);

  if (vendorError) throw vendorError;

  const warehouseByProduct = new Map<string, number>();
  ((warehouseData ?? []) as RawInventory[]).forEach((item) => {
    warehouseByProduct.set(item.producto_id, toNumber(item.cantidad));
  });

  const assignedByProduct = new Map<string, number>();
  ((vendorData ?? []) as RawInventory[]).forEach((item) => {
    assignedByProduct.set(item.producto_id, (assignedByProduct.get(item.producto_id) ?? 0) + toNumber(item.cantidad));
  });

  return products.map((product) => ({
    productoId: product.id,
    productoNombre: product.nombre,
    unidad: product.unidad,
    activo: product.activo,
    cantidadAlmacen: warehouseByProduct.get(product.id) ?? 0,
    cantidadAsignada: assignedByProduct.get(product.id) ?? 0,
    cantidadTotal: (warehouseByProduct.get(product.id) ?? 0) + (assignedByProduct.get(product.id) ?? 0),
  }));
}

export async function getVendorInventorySummary(empresaId: string): Promise<VendorInventoryItem[]> {
  const [vendorsRes, inventoryRes, productsRes] = await Promise.all([
    supabase.from('vendedores').select('id, nombre_completo').eq('empresa_id', empresaId),
    supabase
      .from('inventarios')
      .select('ubicacion_id, producto_id, cantidad')
      .eq('empresa_id', empresaId)
      .eq('ubicacion_tipo', 'VENDEDOR'),
    supabase.from('productos').select('id, nombre, unidad').eq('empresa_id', empresaId),
  ]);

  if (vendorsRes.error) throw vendorsRes.error;
  if (inventoryRes.error) throw inventoryRes.error;
  if (productsRes.error) throw productsRes.error;

  const vendorNameById = new Map<string, string>();
  ((vendorsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((row) => {
    vendorNameById.set(row.id, row.nombre_completo);
  });

  const productById = new Map<string, { nombre: string; unidad: string }>();
  ((productsRes.data ?? []) as Array<{ id: string; nombre: string; unidad: string }>).forEach((row) => {
    productById.set(row.id, { nombre: row.nombre, unidad: row.unidad });
  });

  return ((inventoryRes.data ?? []) as Array<{ ubicacion_id: string; producto_id: string; cantidad: number | string }>)
    .map((row) => ({
      vendedorId: row.ubicacion_id,
      vendedorNombre: vendorNameById.get(row.ubicacion_id) ?? 'Vendedor',
      productoId: row.producto_id,
      productoNombre: productById.get(row.producto_id)?.nombre ?? 'Producto',
      unidad: productById.get(row.producto_id)?.unidad ?? 'unidad',
      cantidad: toNumber(row.cantidad),
    }))
    .filter((row) => row.cantidad > 0);
}

export async function getInventoryMovements(empresaId: string): Promise<InventoryMovementItem[]> {
  const { data: movementsData, error: movementsError } = await (supabase
    .from('movimientos_inventario')
    .select('id, producto_id, tipo, cantidad, referencia_tipo, referencia_id, fecha')
    .eq('empresa_id', empresaId)
    .order('fecha', { ascending: false })
    .limit(30) as any);

  if (movementsError) throw movementsError;

  const movements = (movementsData ?? []) as RawMovement[];
  const productIds = Array.from(new Set(movements.map((movement) => movement.producto_id)));
  const vendorIds = Array.from(
    new Set(
      movements
        .filter((movement) => movement.referencia_id && (movement.referencia_tipo === 'AJUSTE' || movement.referencia_tipo === 'DEVOLUCION'))
        .map((movement) => movement.referencia_id as string)
    )
  );

  const productNameById = new Map<string, string>();

  if (productIds.length) {
    const { data: productsData, error: productsError } = await supabase
      .from('productos')
      .select('id, nombre')
      .in('id', productIds);

    if (productsError) throw productsError;

    ((productsData ?? []) as Array<{ id: string; nombre: string }>).forEach((product) => {
      productNameById.set(product.id, product.nombre);
    });
  }

  const vendorNameById = new Map<string, string>();
  if (vendorIds.length) {
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendedores')
      .select('id, nombre_completo')
      .eq('empresa_id', empresaId)
      .in('id', vendorIds);
    if (vendorsError) throw vendorsError;
    ((vendorsData ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((vendor) => {
      vendorNameById.set(vendor.id, vendor.nombre_completo);
    });
  }

  return movements.map((movement) => ({
    id: movement.id,
    productoId: movement.producto_id,
    productoNombre: productNameById.get(movement.producto_id) ?? 'Producto',
    tipo: movement.tipo,
    cantidad: toNumber(movement.cantidad),
    referenciaTipo: movement.referencia_tipo,
    referenciaId: movement.referencia_id,
    referenciaDetalle: movement.referencia_id ? vendorNameById.get(movement.referencia_id) ?? null : null,
    fecha: movement.fecha,
  }));
}

export async function createInventoryMovement(
  empresaId: string,
  input: InventoryMovementFormInput
): Promise<void> {
  const table = supabase.from('inventarios') as any;
  const movimientosTable = supabase.from('movimientos_inventario') as any;

  const parsedAmount = Number.parseInt(input.cantidad, 10);

  const { data: existingInventory, error: existingError } = await table
    .select('id, cantidad')
    .eq('empresa_id', empresaId)
    .eq('producto_id', input.productoId)
    .eq('ubicacion_tipo', 'ALMACEN')
    .eq('ubicacion_id', empresaId)
    .maybeSingle();

  if (existingError) throw existingError;

  const currentAmount = toNumber(existingInventory?.cantidad);
  let nextAmount = currentAmount;
  let movementAmount = parsedAmount;

  if (input.tipo === 'ENTRADA') nextAmount = currentAmount + parsedAmount;

  if (input.tipo === 'SALIDA' || input.tipo === 'MERMA') {
    if (parsedAmount > currentAmount) throw new Error('No hay inventario suficiente para este movimiento');
    nextAmount = currentAmount - parsedAmount;
  }

  if (input.tipo === 'AJUSTE') {
    nextAmount = parsedAmount;
    movementAmount = Math.abs(parsedAmount - currentAmount);
  }

  if (!existingInventory) {
    const { error: insertInventoryError } = await table.insert({
      empresa_id: empresaId,
      producto_id: input.productoId,
      ubicacion_tipo: 'ALMACEN',
      ubicacion_id: empresaId,
      cantidad: nextAmount,
    });

    if (insertInventoryError) throw insertInventoryError;
  } else {
    const { error: updateInventoryError } = await table.update({ cantidad: nextAmount }).eq('id', existingInventory.id);
    if (updateInventoryError) throw updateInventoryError;
  }

  const { error: movementError } = await movimientosTable.insert({
    empresa_id: empresaId,
    producto_id: input.productoId,
    tipo: input.tipo,
    cantidad: movementAmount,
    referencia_tipo: input.tipo === 'AJUSTE' ? 'AJUSTE' : null,
  });

  if (movementError) throw movementError;
}

export async function transferInventoryToVendor(
  empresaId: string,
  input: InventoryTransferFormInput
): Promise<void> {
  const table = supabase.from('inventarios') as any;
  const movementsTable = supabase.from('movimientos_inventario') as any;
  const parsedAmount = Number.parseInt(input.cantidad, 10);

  const { data: warehouseInventory, error: warehouseError } = await table
    .select('id, cantidad')
    .eq('empresa_id', empresaId)
    .eq('producto_id', input.productoId)
    .eq('ubicacion_tipo', 'ALMACEN')
    .eq('ubicacion_id', empresaId)
    .maybeSingle();
  if (warehouseError) throw warehouseError;

  const { data: vendorInventory, error: vendorError } = await table
    .select('id, cantidad')
    .eq('empresa_id', empresaId)
    .eq('producto_id', input.productoId)
    .eq('ubicacion_tipo', 'VENDEDOR')
    .eq('ubicacion_id', input.vendedorId)
    .maybeSingle();
  if (vendorError) throw vendorError;

  const warehouseCurrent = toNumber(warehouseInventory?.cantidad);
  const vendorCurrent = toNumber(vendorInventory?.cantidad);
  const isAssign = input.direccion === 'ASIGNAR';

  if (isAssign && parsedAmount > warehouseCurrent) throw new Error('No hay inventario suficiente en almacén');
  if (!isAssign && parsedAmount > vendorCurrent) throw new Error('El vendedor no tiene inventario suficiente');

  const nextWarehouse = isAssign ? warehouseCurrent - parsedAmount : warehouseCurrent + parsedAmount;
  const nextVendor = isAssign ? vendorCurrent + parsedAmount : vendorCurrent - parsedAmount;

  if (!warehouseInventory) {
    const { error: insertWarehouseError } = await table.insert({
      empresa_id: empresaId,
      producto_id: input.productoId,
      ubicacion_tipo: 'ALMACEN',
      ubicacion_id: empresaId,
      cantidad: nextWarehouse,
    });
    if (insertWarehouseError) throw insertWarehouseError;
  } else {
    const { error: updateWarehouseError } = await table.update({ cantidad: nextWarehouse }).eq('id', warehouseInventory.id);
    if (updateWarehouseError) throw updateWarehouseError;
  }

  if (!vendorInventory) {
    const { error: insertVendorError } = await table.insert({
      empresa_id: empresaId,
      producto_id: input.productoId,
      ubicacion_tipo: 'VENDEDOR',
      ubicacion_id: input.vendedorId,
      cantidad: nextVendor,
    });
    if (insertVendorError) throw insertVendorError;
  } else {
    const { error: updateVendorError } = await table.update({ cantidad: nextVendor }).eq('id', vendorInventory.id);
    if (updateVendorError) throw updateVendorError;
  }

  const { error: movementError } = await movementsTable.insert({
    empresa_id: empresaId,
    producto_id: input.productoId,
    tipo: isAssign ? 'SALIDA' : 'ENTRADA',
    cantidad: parsedAmount,
    referencia_tipo: isAssign ? 'AJUSTE' : 'DEVOLUCION',
    referencia_id: input.vendedorId,
  });
  if (movementError) throw movementError;
}
