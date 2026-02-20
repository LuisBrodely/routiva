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
  cantidad: number;
}

export interface InventoryMovementItem {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'VENTA' | 'MERMA' | 'AJUSTE';
  cantidad: number;
  referenciaTipo: 'PEDIDO' | 'AJUSTE' | 'DEVOLUCION' | null;
  fecha: string;
}

export interface InventoryMovementFormInput {
  productoId: string;
  tipo: (typeof inventoryMovementTypes)[number];
  cantidad: string;
}
