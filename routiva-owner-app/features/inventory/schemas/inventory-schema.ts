import { z } from 'zod';

export const inventoryMovementTypes = ['ENTRADA', 'SALIDA', 'MERMA', 'AJUSTE'] as const;

export const inventoryMovementSchema = z.object({
  productoId: z.string().uuid('Selecciona un producto valido'),
  tipo: z.enum(inventoryMovementTypes),
  cantidad: z
    .string()
    .trim()
    .min(1, 'Ingresa una cantidad')
    .refine((value) => !Number.isNaN(Number(value)) && Number.isInteger(Number(value)), {
      message: 'Cantidad invalida',
    }),
}).superRefine((input, ctx) => {
  const parsed = Number(input.cantidad);
  if (input.tipo === 'AJUSTE') {
    if (parsed < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cantidad'],
        message: 'La existencia objetivo debe ser 0 o mayor',
      });
    }
    return;
  }

  if (parsed <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cantidad'],
      message: 'La cantidad debe ser mayor a 0',
    });
  }
});

export interface InventoryItem {
  productoId: string;
  productoNombre: string;
  unidad: string;
  activo: boolean;
  cantidadAlmacen: number;
  cantidadAsignada: number;
  cantidadTotal: number;
}

export interface VendorInventoryItem {
  vendedorId: string;
  vendedorNombre: string;
  productoId: string;
  productoNombre: string;
  unidad: string;
  cantidad: number;
}

export interface InventoryMovementItem {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'VENTA' | 'MERMA' | 'AJUSTE';
  cantidad: number;
  referenciaTipo: 'PEDIDO' | 'AJUSTE' | 'DEVOLUCION' | null;
  referenciaId: string | null;
  referenciaDetalle: string | null;
  fecha: string;
}

export interface InventoryMovementFormInput {
  productoId: string;
  tipo: (typeof inventoryMovementTypes)[number];
  cantidad: string;
}

export const inventoryTransferSchema = z.object({
  productoId: z.string().uuid('Selecciona un producto valido'),
  vendedorId: z.string().uuid('Selecciona un vendedor valido'),
  direccion: z.enum(['ASIGNAR', 'DEVOLVER']),
  cantidad: z
    .string()
    .trim()
    .min(1, 'Ingresa una cantidad')
    .refine((value) => !Number.isNaN(Number(value)) && Number.isInteger(Number(value)) && Number(value) > 0, {
      message: 'La cantidad debe ser entero mayor a 0',
    }),
});

export interface InventoryTransferFormInput {
  productoId: string;
  vendedorId: string;
  direccion: 'ASIGNAR' | 'DEVOLVER';
  cantidad: string;
}
