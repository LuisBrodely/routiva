import { supabase } from '@/lib/supabase/client';

import type {
  CheckOutInput,
  OrderDraftItem,
  SellerRouteStop,
  SellerRouteSummary,
  StopCoordinateInput,
} from '../schemas/route-schema';

interface RawRoute {
  id: string;
  fecha: string;
  estatus: 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA';
}

interface RawStop {
  id: string;
  ruta_id: string;
  cliente_id: string;
  punto_venta_id: string;
  orden: number;
  estatus_visita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
  pedido_id: string | null;
  incidencia_id: string | null;
}

interface RawVisit {
  id: string;
  ruta_parada_id: string;
  resultado: 'PEDIDO' | 'NO_ESTABA' | 'NO_QUISO' | 'CERRADO' | 'OTRO';
  notas: string | null;
  fecha_llegada: string | null;
  fecha_salida: string | null;
  latitud_llegada: number | null;
  longitud_llegada: number | null;
  latitud_salida: number | null;
  longitud_salida: number | null;
}

interface RawStopContext {
  id: string;
  ruta_id: string;
  cliente_id: string;
  punto_venta_id: string;
}

interface RawInventory {
  id: string;
  producto_id: string;
  cantidad: number;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function resolveRouteStopContext(empresaId: string, routeStopId: string): Promise<RawStopContext> {
  const { data, error } = await (supabase
    .from('ruta_paradas')
    .select('id, ruta_id, cliente_id, punto_venta_id')
    .eq('empresa_id', empresaId)
    .eq('id', routeStopId)
    .single() as any);

  if (error) throw error;
  return data as RawStopContext;
}

async function updateRouteStatusByStops(empresaId: string, routeId: string): Promise<void> {
  const routeStopsTable = supabase.from('ruta_paradas') as any;
  const routesTable = supabase.from('rutas') as any;

  const { data, error } = await routeStopsTable
    .select('estatus_visita')
    .eq('empresa_id', empresaId)
    .eq('ruta_id', routeId);

  if (error) throw error;

  const statuses = (data ?? []) as Array<{ estatus_visita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO' }>;
  if (!statuses.length) return;

  const hasPending = statuses.some((item) => item.estatus_visita === 'PENDIENTE');

  const { error: updateError } = await routesTable
    .update({ estatus: hasPending ? 'EN_PROGRESO' : 'FINALIZADA' })
    .eq('empresa_id', empresaId)
    .eq('id', routeId);

  if (updateError) throw updateError;
}

export async function getTodaySellerRoute(empresaId: string, vendedorId: string): Promise<SellerRouteSummary | null> {
  const { data: routeData, error: routeError } = await (supabase
    .from('rutas')
    .select('id, fecha, estatus')
    .eq('empresa_id', empresaId)
    .eq('vendedor_id', vendedorId)
    .eq('fecha', todayDateString())
    .order('fecha', { ascending: false })
    .limit(1)
    .maybeSingle() as any);

  if (routeError) throw routeError;
  const route = routeData as RawRoute | null;
  if (!route) return null;

  const { data: stopsData, error: stopsError } = await (supabase
    .from('ruta_paradas')
    .select('id, ruta_id, cliente_id, punto_venta_id, orden, estatus_visita, pedido_id, incidencia_id')
    .eq('empresa_id', empresaId)
    .eq('ruta_id', route.id)
    .order('orden', { ascending: true }) as any);

  if (stopsError) throw stopsError;

  const stops = (stopsData ?? []) as RawStop[];
  if (!stops.length) {
    return {
      id: route.id,
      fecha: route.fecha,
      estatus: route.estatus,
      totalParadas: 0,
      completadas: 0,
      stops: [],
    };
  }

  const clientIds = Array.from(new Set(stops.map((item) => item.cliente_id)));
  const pointIds = Array.from(new Set(stops.map((item) => item.punto_venta_id)));
  const stopIds = stops.map((item) => item.id);

  const [clientsRes, pointsRes, visitsRes] = await Promise.all([
    supabase.from('clientes').select('id, nombre_completo').in('id', clientIds),
    supabase.from('puntos_venta').select('id, nombre, direccion, latitud, longitud').in('id', pointIds),
    supabase
      .from('visitas')
      .select(
        'id, ruta_parada_id, resultado, notas, fecha_llegada, fecha_salida, latitud_llegada, longitud_llegada, latitud_salida, longitud_salida'
      )
      .eq('empresa_id', empresaId)
      .in('ruta_parada_id', stopIds)
      .order('fecha_llegada', { ascending: false }),
  ]);

  if (clientsRes.error) throw clientsRes.error;
  if (pointsRes.error) throw pointsRes.error;
  if (visitsRes.error) throw visitsRes.error;

  const clientById = new Map<string, string>();
  ((clientsRes.data ?? []) as Array<{ id: string; nombre_completo: string }>).forEach((item) => {
    clientById.set(item.id, item.nombre_completo);
  });

  const pointById = new Map<string, { nombre: string; direccion: string | null; latitud: number | null; longitud: number | null }>();
  ((pointsRes.data ?? []) as Array<{ id: string; nombre: string; direccion: string | null; latitud: number | null; longitud: number | null }>).forEach(
    (item) => {
      pointById.set(item.id, {
        nombre: item.nombre,
        direccion: item.direccion,
        latitud: item.latitud,
        longitud: item.longitud,
      });
    }
  );

  const lastVisitByStop = new Map<string, RawVisit>();
  ((visitsRes.data ?? []) as RawVisit[]).forEach((item) => {
    if (!lastVisitByStop.has(item.ruta_parada_id)) {
      lastVisitByStop.set(item.ruta_parada_id, item);
    }
  });

  const mappedStops: SellerRouteStop[] = stops.map((stop) => {
    const point = pointById.get(stop.punto_venta_id);
    const visit = lastVisitByStop.get(stop.id);

    return {
      id: stop.id,
      rutaId: stop.ruta_id,
      clienteId: stop.cliente_id,
      clienteNombre: clientById.get(stop.cliente_id) ?? 'Cliente',
      puntoVentaId: stop.punto_venta_id,
      puntoVentaNombre: point?.nombre ?? 'Punto de venta',
      puntoVentaDireccion: point?.direccion ?? null,
      latitud: point?.latitud ?? null,
      longitud: point?.longitud ?? null,
      orden: stop.orden,
      estatusVisita: stop.estatus_visita,
      pedidoId: stop.pedido_id,
      incidenciaId: stop.incidencia_id,
      lastVisit: visit
        ? {
            id: visit.id,
            resultado: visit.resultado,
            notas: visit.notas,
            fechaLlegada: visit.fecha_llegada,
            fechaSalida: visit.fecha_salida,
            latitudLlegada: visit.latitud_llegada,
            longitudLlegada: visit.longitud_llegada,
            latitudSalida: visit.latitud_salida,
            longitudSalida: visit.longitud_salida,
          }
        : null,
    };
  });

  return {
    id: route.id,
    fecha: route.fecha,
    estatus: route.estatus,
    totalParadas: mappedStops.length,
    completadas: mappedStops.filter((item) => item.estatusVisita !== 'PENDIENTE').length,
    stops: mappedStops,
  };
}

export async function registerCheckIn(
  empresaId: string,
  vendedorId: string,
  routeStopId: string,
  location: StopCoordinateInput
): Promise<string> {
  const visitsTable = supabase.from('visitas') as any;
  const routesTable = supabase.from('rutas') as any;

  const stop = await resolveRouteStopContext(empresaId, routeStopId);

  const { data: openVisit, error: openVisitError } = await visitsTable
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('vendedor_id', vendedorId)
    .eq('ruta_parada_id', routeStopId)
    .is('fecha_salida', null)
    .order('fecha_llegada', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openVisitError) throw openVisitError;
  if (openVisit?.id) return openVisit.id as string;

  const { data: visit, error: visitError } = await visitsTable
    .insert({
      empresa_id: empresaId,
      ruta_parada_id: routeStopId,
      vendedor_id: vendedorId,
      latitud_llegada: location.latitud,
      longitud_llegada: location.longitud,
      fecha_llegada: new Date().toISOString(),
      resultado: 'OTRO',
      notas: null,
    })
    .select('id')
    .single();

  if (visitError) throw visitError;

  await routesTable
    .update({ estatus: 'EN_PROGRESO' })
    .eq('empresa_id', empresaId)
    .eq('id', stop.ruta_id);

  return visit.id as string;
}

function mapResultToIncidenceType(resultado: CheckOutInput['resultado']) {
  if (resultado === 'NO_ESTABA') return 'CLIENTE_NO_ESTABA';
  if (resultado === 'CERRADO') return 'CLIENTE_CERRADO';
  if (resultado === 'NO_QUISO') return 'OTRO';
  return null;
}

export async function registerCheckOut(
  empresaId: string,
  vendedorId: string,
  routeStopId: string,
  input: CheckOutInput
): Promise<void> {
  const visitsTable = supabase.from('visitas') as any;
  const incidencesTable = supabase.from('incidencias') as any;
  const routeStopsTable = supabase.from('ruta_paradas') as any;

  const stop = await resolveRouteStopContext(empresaId, routeStopId);

  const { data: openVisitData, error: openVisitError } = await visitsTable
    .select('id, fecha_llegada, latitud_llegada, longitud_llegada')
    .eq('empresa_id', empresaId)
    .eq('vendedor_id', vendedorId)
    .eq('ruta_parada_id', routeStopId)
    .is('fecha_salida', null)
    .order('fecha_llegada', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openVisitError) throw openVisitError;

  const nowIso = new Date().toISOString();
  const salidaLat = input.salida?.latitud ?? null;
  const salidaLng = input.salida?.longitud ?? null;

  let visitId: string;

  if (!openVisitData?.id) {
    const { data: createdVisit, error: createVisitError } = await visitsTable
      .insert({
        empresa_id: empresaId,
        ruta_parada_id: routeStopId,
        vendedor_id: vendedorId,
        fecha_llegada: nowIso,
        latitud_llegada: salidaLat,
        longitud_llegada: salidaLng,
        fecha_salida: nowIso,
        latitud_salida: salidaLat,
        longitud_salida: salidaLng,
        resultado: input.resultado,
        notas: input.notas?.trim() || null,
      })
      .select('id')
      .single();

    if (createVisitError) throw createVisitError;
    visitId = createdVisit.id as string;
  } else {
    visitId = openVisitData.id as string;
    const { error: updateVisitError } = await visitsTable
      .update({
        fecha_llegada: openVisitData.fecha_llegada ?? nowIso,
        latitud_llegada: openVisitData.latitud_llegada ?? salidaLat,
        longitud_llegada: openVisitData.longitud_llegada ?? salidaLng,
        fecha_salida: nowIso,
        latitud_salida: salidaLat,
        longitud_salida: salidaLng,
        resultado: input.resultado,
        notas: input.notas?.trim() || null,
      })
      .eq('empresa_id', empresaId)
      .eq('id', visitId);

    if (updateVisitError) throw updateVisitError;
  }

  const nextStopStatus = input.resultado === 'PEDIDO' ? 'VISITADO' : 'NO_VISITADO';
  let incidenciaId: string | null = null;

  const shouldCreateIncidence = Boolean(input.createIncidence && ['NO_ESTABA', 'NO_QUISO', 'CERRADO'].includes(input.resultado));
  if (shouldCreateIncidence) {
    const incidenceType = mapResultToIncidenceType(input.resultado);
    if (incidenceType) {
      const { data: incidence, error: incidenceError } = await incidencesTable
        .insert({
          empresa_id: empresaId,
          cliente_id: stop.cliente_id,
          vendedor_id: vendedorId,
          tipo: incidenceType,
          descripcion: input.notas?.trim() || null,
        })
        .select('id')
        .single();

      if (incidenceError) throw incidenceError;
      incidenciaId = incidence.id as string;
    }
  }

  const { error: stopUpdateError } = await routeStopsTable
    .update({
      estatus_visita: nextStopStatus,
      incidencia_id: incidenciaId,
    })
    .eq('empresa_id', empresaId)
    .eq('id', routeStopId);

  if (stopUpdateError) throw stopUpdateError;

  await updateRouteStatusByStops(empresaId, stop.ruta_id);

  if (visitId) {
    return;
  }
}

export async function createOrderForStop(
  empresaId: string,
  vendedorId: string,
  routeStopId: string,
  items: OrderDraftItem[]
): Promise<string> {
  const ordersTable = supabase.from('pedidos') as any;
  const orderItemsTable = supabase.from('pedido_items') as any;
  const routeStopsTable = supabase.from('ruta_paradas') as any;

  const cleanItems = items.filter((item) => Number.isFinite(item.cantidad) && item.cantidad > 0);
  if (!cleanItems.length) throw new Error('Agrega al menos un producto con cantidad mayor a cero');

  const stop = await resolveRouteStopContext(empresaId, routeStopId);
  const productIds = Array.from(new Set(cleanItems.map((item) => item.productoId)));

  const { data: priceRows, error: pricesError } = await (supabase
    .from('precios_productos')
    .select('producto_id, precio, vigente_desde')
    .eq('empresa_id', empresaId)
    .in('producto_id', productIds)
    .order('vigente_desde', { ascending: false }) as any);

  if (pricesError) throw pricesError;

  const latestPriceByProduct = new Map<string, number>();
  ((priceRows ?? []) as Array<{ producto_id: string; precio: number; vigente_desde: string }>).forEach((row) => {
    if (!latestPriceByProduct.has(row.producto_id)) {
      latestPriceByProduct.set(row.producto_id, row.precio);
    }
  });

  const lines = cleanItems.map((item) => {
    const unitPrice = latestPriceByProduct.get(item.productoId);
    if (unitPrice === undefined) {
      throw new Error('Falta precio vigente para uno de los productos seleccionados');
    }
    return {
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: unitPrice,
      subtotal: item.cantidad * unitPrice,
    };
  });

  const total = lines.reduce((acc, line) => acc + line.subtotal, 0);

  const productIdsForStock = lines.map((line) => line.productoId);
  const [vendorInventoryRes, warehouseInventoryRes] = await Promise.all([
    supabase
      .from('inventarios')
      .select('id, producto_id, cantidad')
      .eq('empresa_id', empresaId)
      .eq('ubicacion_tipo', 'VENDEDOR')
      .eq('ubicacion_id', vendedorId)
      .in('producto_id', productIdsForStock),
    supabase
      .from('inventarios')
      .select('id, producto_id, cantidad')
      .eq('empresa_id', empresaId)
      .eq('ubicacion_tipo', 'ALMACEN')
      .eq('ubicacion_id', empresaId)
      .in('producto_id', productIdsForStock),
  ]);

  if (vendorInventoryRes.error) throw vendorInventoryRes.error;
  if (warehouseInventoryRes.error) throw warehouseInventoryRes.error;

  const vendorInventory = (vendorInventoryRes.data ?? []) as RawInventory[];
  const warehouseInventory = (warehouseInventoryRes.data ?? []) as RawInventory[];
  const shouldUseVendorInventory = vendorInventory.length > 0;
  const inventoryRows = shouldUseVendorInventory ? vendorInventory : warehouseInventory;
  const inventoryByProduct = new Map<string, RawInventory>();
  inventoryRows.forEach((row) => {
    inventoryByProduct.set(row.producto_id, row);
  });

  for (const line of lines) {
    const inventory = inventoryByProduct.get(line.productoId);
    if (!inventory) {
      throw new Error('Inventario insuficiente para confirmar el pedido');
    }
    if (inventory.cantidad < line.cantidad) {
      throw new Error('Inventario insuficiente para confirmar el pedido');
    }
  }

  const { data: order, error: orderError } = await ordersTable
    .insert({
      empresa_id: empresaId,
      cliente_id: stop.cliente_id,
      punto_venta_id: stop.punto_venta_id,
      vendedor_id: vendedorId,
      total,
      estatus: 'CONFIRMADO',
    })
    .select('id')
    .single();

  if (orderError) throw orderError;

  const { error: itemsError } = await orderItemsTable.insert(
    lines.map((line) => ({
      empresa_id: empresaId,
      pedido_id: order.id,
      producto_id: line.productoId,
      cantidad: line.cantidad,
      precio_unitario: line.precioUnitario,
      subtotal: line.subtotal,
    }))
  );

  if (itemsError) throw itemsError;

  for (const line of lines) {
    const inventory = inventoryByProduct.get(line.productoId)!;
    const nextAmount = inventory.cantidad - line.cantidad;

    const { error: updateInventoryError } = await (supabase.from('inventarios') as any)
      .update({ cantidad: nextAmount })
      .eq('id', inventory.id)
      .eq('empresa_id', empresaId);
    if (updateInventoryError) throw updateInventoryError;

    const { error: movementError } = await (supabase.from('movimientos_inventario') as any).insert({
      empresa_id: empresaId,
      producto_id: line.productoId,
      tipo: 'VENTA',
      cantidad: line.cantidad,
      referencia_tipo: 'PEDIDO',
      referencia_id: order.id,
    });
    if (movementError) throw movementError;
  }

  const { error: stopError } = await routeStopsTable
    .update({ pedido_id: order.id, estatus_visita: 'VISITADO' })
    .eq('empresa_id', empresaId)
    .eq('id', routeStopId);

  if (stopError) throw stopError;

  await updateRouteStatusByStops(empresaId, stop.ruta_id);

  return order.id as string;
}

export async function getActiveProductsWithPrice(empresaId: string): Promise<Array<{ id: string; nombre: string; unidad: string; precio: number }>> {
  const { data: productsData, error: productsError } = await supabase
    .from('productos')
    .select('id, nombre, unidad')
    .eq('empresa_id', empresaId)
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (productsError) throw productsError;

  const products = (productsData ?? []) as Array<{ id: string; nombre: string; unidad: string }>;
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
  ((pricesData ?? []) as Array<{ producto_id: string; precio: number; vigente_desde: string }>).forEach((row) => {
    if (!latestPriceByProduct.has(row.producto_id)) latestPriceByProduct.set(row.producto_id, row.precio);
  });

  return products
    .map((item) => ({
      id: item.id,
      nombre: item.nombre,
      unidad: item.unidad,
      precio: latestPriceByProduct.get(item.id) ?? 0,
    }))
    .filter((item) => item.precio > 0);
}
