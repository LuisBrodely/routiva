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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
