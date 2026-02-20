import { supabase } from '@/lib/supabase/client';

import type { ProductFormInput, ProductItem } from '../schemas/product-schema';

interface RawProduct {
  id: string;
  nombre: string;
  unidad: string;
  activo: boolean;
}

interface RawPrice {
  producto_id: string;
  precio: number;
  vigente_desde: string;
}

function parsePrice(value: string): number {
  return Number(value);
}

export async function getProducts(empresaId: string): Promise<ProductItem[]> {
  const { data: productsData, error: productsError } = await supabase
    .from('productos')
    .select('id, nombre, unidad, activo')
    .eq('empresa_id', empresaId)
    .order('nombre', { ascending: true });

  if (productsError) throw productsError;

  const products = (productsData ?? []) as RawProduct[];
  if (!products.length) return [];

  const productIds = products.map((item) => item.id);

  const { data: pricesData, error: pricesError } = await (supabase
    .from('precios_productos')
    .select('producto_id, precio, vigente_desde')
    .eq('empresa_id', empresaId)
    .in('producto_id', productIds)
    .order('vigente_desde', { ascending: false }) as any);

  if (pricesError) throw pricesError;

  const latestPriceByProduct = new Map<string, number>();
  ((pricesData ?? []) as RawPrice[]).forEach((item) => {
    if (!latestPriceByProduct.has(item.producto_id)) {
      latestPriceByProduct.set(item.producto_id, item.precio);
    }
  });

  return products.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    unidad: item.unidad,
    activo: item.activo,
    precioActual: latestPriceByProduct.get(item.id) ?? null,
  }));
}

export async function createProduct(empresaId: string, input: ProductFormInput): Promise<void> {
  const productsTable = supabase.from('productos') as any;
  const pricesTable = supabase.from('precios_productos') as any;

  const { data: product, error: productError } = await productsTable
    .insert({
      empresa_id: empresaId,
      nombre: input.nombre,
      unidad: input.unidad,
      activo: true,
    })
    .select('id')
    .single();

  if (productError) throw productError;

  const { error: priceError } = await pricesTable.insert({
    empresa_id: empresaId,
    producto_id: product.id,
    precio: parsePrice(input.precio),
    vigente_desde: new Date().toISOString(),
  });

  if (priceError) throw priceError;
}

export async function updateProduct(
  empresaId: string,
  productId: string,
  input: ProductFormInput
): Promise<void> {
  const productsTable = supabase.from('productos') as any;
  const pricesTable = supabase.from('precios_productos') as any;

  const { error: productError } = await productsTable
    .update({
      nombre: input.nombre,
      unidad: input.unidad,
    })
    .eq('id', productId);

  if (productError) throw productError;

  const { error: priceError } = await pricesTable.insert({
    empresa_id: empresaId,
    producto_id: productId,
    precio: parsePrice(input.precio),
    vigente_desde: new Date().toISOString(),
  });

  if (priceError) throw priceError;
}

export async function deactivateProduct(productId: string): Promise<void> {
  const productsTable = supabase.from('productos') as any;
  const { error } = await productsTable.update({ activo: false }).eq('id', productId);
  if (error) throw error;
}

export async function activateProduct(productId: string): Promise<void> {
  const productsTable = supabase.from('productos') as any;
  const { error } = await productsTable.update({ activo: true }).eq('id', productId);
  if (error) throw error;
}
