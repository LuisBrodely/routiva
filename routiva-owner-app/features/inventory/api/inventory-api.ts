import { supabase } from '@/lib/supabase/client';

import type {
  InventoryItem,
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

  const { data: inventoryData, error: inventoryError } = await (supabase
    .from('inventarios')
    .select('id, producto_id, cantidad')
    .eq('empresa_id', empresaId)
    .eq('ubicacion_tipo', 'ALMACEN')
    .eq('ubicacion_id', empresaId) as any);

  if (inventoryError) throw inventoryError;

  const byProduct = new Map<string, number>();
  ((inventoryData ?? []) as RawInventory[]).forEach((item) => {
    byProduct.set(item.producto_id, toNumber(item.cantidad));
  });

  return products.map((product) => ({
    productoId: product.id,
    productoNombre: product.nombre,
    unidad: product.unidad,
    activo: product.activo,
    cantidad: byProduct.get(product.id) ?? 0,
  }));
}

export async function getInventoryMovements(empresaId: string): Promise<InventoryMovementItem[]> {
  const { data: movementsData, error: movementsError } = await (supabase
    .from('movimientos_inventario')
    .select('id, producto_id, tipo, cantidad, referencia_tipo, fecha')
    .eq('empresa_id', empresaId)
    .order('fecha', { ascending: false })
    .limit(30) as any);

  if (movementsError) throw movementsError;

  const movements = (movementsData ?? []) as RawMovement[];
  const productIds = Array.from(new Set(movements.map((movement) => movement.producto_id)));

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

  return movements.map((movement) => ({
    id: movement.id,
    productoId: movement.producto_id,
    productoNombre: productNameById.get(movement.producto_id) ?? 'Producto',
    tipo: movement.tipo,
    cantidad: toNumber(movement.cantidad),
    referenciaTipo: movement.referencia_tipo,
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
