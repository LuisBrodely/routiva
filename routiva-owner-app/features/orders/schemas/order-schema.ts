import { z } from 'zod';

const orderItemSchema = z.object({
  productoId: z.string().uuid('Selecciona un producto valido'),
  cantidad: z
    .string()
    .trim()
    .min(1, 'Ingresa una cantidad')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: 'Cantidad invalida',
    }),
});

export const orderSchema = z.object({
  clienteId: z.string().uuid('Selecciona un cliente'),
  puntoVentaId: z.string().uuid('Selecciona un punto de venta'),
  vendedorId: z.string().uuid('Selecciona un vendedor'),
  items: z.array(orderItemSchema).min(1, 'Agrega al menos un producto'),
});

export interface OrderFormInput {
  clienteId: string;
  puntoVentaId: string;
  vendedorId: string;
  items: Array<{
    productoId: string;
    cantidad: string;
  }>;
}

export interface OrderItemInput {
  productoId: string;
  cantidad: number;
}

export interface OrderItemSummary {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrderSummary {
  id: string;
  clienteId: string;
  clienteNombre: string;
  puntoVentaId: string;
  puntoVentaNombre: string;
  vendedorId: string;
  vendedorNombre: string;
  total: number;
  estatus: 'BORRADOR' | 'CONFIRMADO' | 'ENTREGADO' | 'CANCELADO';
  fecha: string;
}
