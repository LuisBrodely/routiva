export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nombre: string;
          rfc: string | null;
          telefono: string | null;
          direccion: string | null;
          logo_url: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          rfc?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          logo_url?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          rfc?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          logo_url?: string | null;
          activo?: boolean;
        };
      };
      usuarios: {
        Row: {
          id: string;
          empresa_id: string;
          auth_user_id: string;
          username: string;
          rol: 'OWNER' | 'ADMIN' | 'SELLER';
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          auth_user_id: string;
          username: string;
          rol: 'OWNER' | 'ADMIN' | 'SELLER';
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          username?: string;
          rol?: 'OWNER' | 'ADMIN' | 'SELLER';
          activo?: boolean;
        };
      };
      vendedores: {
        Row: {
          id: string;
          empresa_id: string;
          usuario_id: string;
          nombre_completo: string;
          telefono: string | null;
          rfc: string | null;
          status: 'ACTIVO' | 'INACTIVO';
          ultima_ubicacion_lat: number | null;
          ultima_ubicacion_lng: number | null;
          ultima_conexion: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          usuario_id: string;
          nombre_completo: string;
          telefono?: string | null;
          rfc?: string | null;
          status?: 'ACTIVO' | 'INACTIVO';
          ultima_ubicacion_lat?: number | null;
          ultima_ubicacion_lng?: number | null;
          ultima_conexion?: string | null;
        };
        Update: {
          nombre_completo?: string;
          telefono?: string | null;
          rfc?: string | null;
          status?: 'ACTIVO' | 'INACTIVO';
          ultima_ubicacion_lat?: number | null;
          ultima_ubicacion_lng?: number | null;
          ultima_conexion?: string | null;
        };
      };
      ubicaciones_vendedores: {
        Row: {
          id: string;
          empresa_id: string;
          vendedor_id: string;
          latitud: number;
          longitud: number;
          precision_metros: number | null;
          velocidad_kmh: number | null;
          bateria_porcentaje: number | null;
          fecha_hora: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          vendedor_id: string;
          latitud: number;
          longitud: number;
          precision_metros?: number | null;
          velocidad_kmh?: number | null;
          bateria_porcentaje?: number | null;
          fecha_hora?: string;
        };
        Update: {
          latitud?: number;
          longitud?: number;
          precision_metros?: number | null;
          velocidad_kmh?: number | null;
          bateria_porcentaje?: number | null;
          fecha_hora?: string;
        };
      };
      clientes: {
        Row: {
          id: string;
          empresa_id: string;
          nombre_completo: string;
          telefono: string | null;
          rfc: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nombre_completo: string;
          telefono?: string | null;
          rfc?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          nombre_completo?: string;
          telefono?: string | null;
          rfc?: string | null;
          activo?: boolean;
        };
      };
      puntos_venta: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string;
          nombre: string;
          direccion: string;
          latitud: number | null;
          longitud: number | null;
          horario: string | null;
          notas: string | null;
          activo: boolean;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cliente_id: string;
          nombre: string;
          direccion: string;
          latitud?: number | null;
          longitud?: number | null;
          horario?: string | null;
          notas?: string | null;
          activo?: boolean;
        };
        Update: {
          nombre?: string;
          direccion?: string;
          latitud?: number | null;
          longitud?: number | null;
          horario?: string | null;
          notas?: string | null;
          activo?: boolean;
        };
      };
      productos: {
        Row: {
          id: string;
          empresa_id: string;
          nombre: string;
          unidad: string;
          activo: boolean;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nombre: string;
          unidad: string;
          activo?: boolean;
        };
        Update: {
          nombre?: string;
          unidad?: string;
          activo?: boolean;
        };
      };
      precios_productos: {
        Row: {
          id: string;
          empresa_id: string;
          producto_id: string;
          precio: number;
          vigente_desde: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          producto_id: string;
          precio: number;
          vigente_desde?: string;
        };
        Update: {
          precio?: number;
          vigente_desde?: string;
        };
      };
      inventarios: {
        Row: {
          id: string;
          empresa_id: string;
          producto_id: string;
          ubicacion_tipo: 'ALMACEN' | 'VENDEDOR';
          ubicacion_id: string;
          cantidad: number;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          producto_id: string;
          ubicacion_tipo: 'ALMACEN' | 'VENDEDOR';
          ubicacion_id: string;
          cantidad?: number;
        };
        Update: {
          ubicacion_tipo?: 'ALMACEN' | 'VENDEDOR';
          ubicacion_id?: string;
          cantidad?: number;
        };
      };
      movimientos_inventario: {
        Row: {
          id: string;
          empresa_id: string;
          producto_id: string;
          tipo: 'ENTRADA' | 'SALIDA' | 'VENTA' | 'MERMA' | 'AJUSTE';
          cantidad: number;
          referencia_tipo: 'PEDIDO' | 'AJUSTE' | 'DEVOLUCION' | null;
          referencia_id: string | null;
          fecha: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          producto_id: string;
          tipo: 'ENTRADA' | 'SALIDA' | 'VENTA' | 'MERMA' | 'AJUSTE';
          cantidad: number;
          referencia_tipo?: 'PEDIDO' | 'AJUSTE' | 'DEVOLUCION' | null;
          referencia_id?: string | null;
          fecha?: string;
        };
        Update: {
          tipo?: 'ENTRADA' | 'SALIDA' | 'VENTA' | 'MERMA' | 'AJUSTE';
          cantidad?: number;
          referencia_tipo?: 'PEDIDO' | 'AJUSTE' | 'DEVOLUCION' | null;
          referencia_id?: string | null;
          fecha?: string;
        };
      };
      pedidos: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string;
          punto_venta_id: string;
          vendedor_id: string;
          total: number;
          estatus: 'BORRADOR' | 'CONFIRMADO' | 'ENTREGADO' | 'CANCELADO';
          fecha: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cliente_id: string;
          punto_venta_id: string;
          vendedor_id: string;
          total?: number;
          estatus: 'BORRADOR' | 'CONFIRMADO' | 'ENTREGADO' | 'CANCELADO';
          fecha?: string;
        };
        Update: {
          cliente_id?: string;
          punto_venta_id?: string;
          vendedor_id?: string;
          total?: number;
          estatus?: 'BORRADOR' | 'CONFIRMADO' | 'ENTREGADO' | 'CANCELADO';
          fecha?: string;
        };
      };
      pedido_items: {
        Row: {
          id: string;
          empresa_id: string;
          pedido_id: string;
          producto_id: string;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          pedido_id: string;
          producto_id: string;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
        };
        Update: {
          cantidad?: number;
          precio_unitario?: number;
          subtotal?: number;
        };
      };
      rutas: {
        Row: {
          id: string;
          empresa_id: string;
          vendedor_id: string;
          fecha: string;
          estatus: 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA';
        };
        Insert: {
          id?: string;
          empresa_id: string;
          vendedor_id: string;
          fecha: string;
          estatus: 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA';
        };
        Update: {
          vendedor_id?: string;
          fecha?: string;
          estatus?: 'PLANIFICADA' | 'EN_PROGRESO' | 'FINALIZADA';
        };
      };
      ruta_paradas: {
        Row: {
          id: string;
          empresa_id: string;
          ruta_id: string;
          cliente_id: string;
          punto_venta_id: string;
          orden: number;
          estatus_visita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
          pedido_id: string | null;
          incidencia_id: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          ruta_id: string;
          cliente_id: string;
          punto_venta_id: string;
          orden: number;
          estatus_visita: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
          pedido_id?: string | null;
          incidencia_id?: string | null;
        };
        Update: {
          cliente_id?: string;
          punto_venta_id?: string;
          orden?: number;
          estatus_visita?: 'PENDIENTE' | 'VISITADO' | 'NO_VISITADO';
          pedido_id?: string | null;
          incidencia_id?: string | null;
        };
      };
      visitas: {
        Row: {
          id: string;
          empresa_id: string;
          ruta_parada_id: string;
          vendedor_id: string;
          latitud_llegada: number | null;
          longitud_llegada: number | null;
          fecha_llegada: string | null;
          latitud_salida: number | null;
          longitud_salida: number | null;
          fecha_salida: string | null;
          resultado: 'PEDIDO' | 'NO_ESTABA' | 'NO_QUISO' | 'CERRADO' | 'OTRO';
          notas: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          ruta_parada_id: string;
          vendedor_id: string;
          latitud_llegada?: number | null;
          longitud_llegada?: number | null;
          fecha_llegada?: string | null;
          latitud_salida?: number | null;
          longitud_salida?: number | null;
          fecha_salida?: string | null;
          resultado: 'PEDIDO' | 'NO_ESTABA' | 'NO_QUISO' | 'CERRADO' | 'OTRO';
          notas?: string | null;
        };
        Update: {
          ruta_parada_id?: string;
          vendedor_id?: string;
          latitud_llegada?: number | null;
          longitud_llegada?: number | null;
          fecha_llegada?: string | null;
          latitud_salida?: number | null;
          longitud_salida?: number | null;
          fecha_salida?: string | null;
          resultado?: 'PEDIDO' | 'NO_ESTABA' | 'NO_QUISO' | 'CERRADO' | 'OTRO';
          notas?: string | null;
        };
      };
      incidencias: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string;
          vendedor_id: string;
          tipo: 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO';
          descripcion: string | null;
          fecha: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cliente_id: string;
          vendedor_id: string;
          tipo: 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO';
          descripcion?: string | null;
          fecha?: string;
        };
        Update: {
          cliente_id?: string;
          vendedor_id?: string;
          tipo?: 'CLIENTE_CERRADO' | 'CLIENTE_NO_ESTABA' | 'PROBLEMA_PAGO' | 'OTRO';
          descripcion?: string | null;
          fecha?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
