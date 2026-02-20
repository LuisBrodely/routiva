create extension if not exists pgcrypto;

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rfc text,
  telefono text,
  direccion text,
  logo_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  auth_user_id uuid not null unique references auth.users(id),
  username text not null,
  rol text not null check (rol in ('OWNER', 'ADMIN', 'SELLER')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vendedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  usuario_id uuid not null unique references public.usuarios(id),
  nombre_completo text not null,
  telefono text,
  rfc text,
  status text not null default 'ACTIVO' check (status in ('ACTIVO', 'INACTIVO')),
  ultima_ubicacion_lat double precision,
  ultima_ubicacion_lng double precision,
  ultima_conexion timestamptz
);

create table if not exists public.ubicaciones_vendedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  vendedor_id uuid not null references public.vendedores(id),
  latitud double precision not null,
  longitud double precision not null,
  precision_metros double precision,
  velocidad_kmh double precision,
  bateria_porcentaje integer check (bateria_porcentaje between 0 and 100),
  fecha_hora timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  nombre_completo text not null,
  telefono text,
  rfc text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.puntos_venta (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  cliente_id uuid not null references public.clientes(id),
  nombre text not null,
  direccion text not null,
  latitud double precision,
  longitud double precision,
  horario text,
  notas text,
  activo boolean not null default true
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  nombre text not null,
  unidad text not null,
  activo boolean not null default true
);

create table if not exists public.precios_productos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  producto_id uuid not null references public.productos(id),
  precio numeric(12, 2) not null check (precio >= 0),
  vigente_desde timestamptz not null default now()
);

create table if not exists public.inventarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  producto_id uuid not null references public.productos(id),
  ubicacion_tipo text not null check (ubicacion_tipo in ('ALMACEN', 'VENDEDOR')),
  ubicacion_id uuid not null,
  cantidad numeric(12, 3) not null default 0
);

create table if not exists public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  producto_id uuid not null references public.productos(id),
  tipo text not null check (tipo in ('ENTRADA', 'SALIDA', 'VENTA', 'MERMA', 'AJUSTE')),
  cantidad numeric(12, 3) not null,
  referencia_tipo text check (referencia_tipo in ('PEDIDO', 'AJUSTE', 'DEVOLUCION')),
  referencia_id uuid,
  fecha timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  cliente_id uuid not null references public.clientes(id),
  punto_venta_id uuid not null references public.puntos_venta(id),
  vendedor_id uuid not null references public.vendedores(id),
  total numeric(12, 2) not null default 0,
  estatus text not null check (estatus in ('BORRADOR', 'CONFIRMADO', 'ENTREGADO', 'CANCELADO')),
  fecha timestamptz not null default now()
);

create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  pedido_id uuid not null references public.pedidos(id),
  producto_id uuid not null references public.productos(id),
  cantidad numeric(12, 3) not null,
  precio_unitario numeric(12, 2) not null,
  subtotal numeric(12, 2) not null
);

create table if not exists public.rutas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  vendedor_id uuid not null references public.vendedores(id),
  fecha date not null,
  estatus text not null check (estatus in ('PLANIFICADA', 'EN_PROGRESO', 'FINALIZADA'))
);

create table if not exists public.ruta_paradas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  ruta_id uuid not null references public.rutas(id),
  cliente_id uuid not null references public.clientes(id),
  punto_venta_id uuid not null references public.puntos_venta(id),
  orden integer not null,
  estatus_visita text not null check (estatus_visita in ('PENDIENTE', 'VISITADO', 'NO_VISITADO')),
  pedido_id uuid references public.pedidos(id),
  incidencia_id uuid
);

create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  ruta_parada_id uuid not null references public.ruta_paradas(id),
  vendedor_id uuid not null references public.vendedores(id),
  latitud_llegada double precision,
  longitud_llegada double precision,
  fecha_llegada timestamptz,
  latitud_salida double precision,
  longitud_salida double precision,
  fecha_salida timestamptz,
  resultado text not null check (resultado in ('PEDIDO', 'NO_ESTABA', 'NO_QUISO', 'CERRADO', 'OTRO')),
  notas text
);

create table if not exists public.incidencias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  cliente_id uuid not null references public.clientes(id),
  vendedor_id uuid not null references public.vendedores(id),
  tipo text not null check (tipo in ('CLIENTE_CERRADO', 'CLIENTE_NO_ESTABA', 'PROBLEMA_PAGO', 'OTRO')),
  descripcion text,
  fecha timestamptz not null default now()
);

create table if not exists public.archivos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  url text not null,
  tipo text,
  fecha timestamptz not null default now()
);

create table if not exists public.incidencias_archivos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  incidencia_id uuid not null references public.incidencias(id),
  archivo_id uuid not null references public.archivos(id)
);

alter table public.ruta_paradas
  add constraint ruta_paradas_incidencia_id_fkey
  foreign key (incidencia_id)
  references public.incidencias(id);

create index if not exists idx_usuarios_empresa_id on public.usuarios(empresa_id);
create index if not exists idx_usuarios_auth_user_id on public.usuarios(auth_user_id);
create index if not exists idx_vendedores_empresa_id on public.vendedores(empresa_id);
create index if not exists idx_ubicaciones_vendedores_empresa_id on public.ubicaciones_vendedores(empresa_id);
create index if not exists idx_clientes_empresa_id on public.clientes(empresa_id);
create index if not exists idx_pedidos_empresa_id on public.pedidos(empresa_id);
create index if not exists idx_rutas_empresa_id on public.rutas(empresa_id);
create index if not exists idx_incidencias_empresa_id on public.incidencias(empresa_id);

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
as $$
  select empresa_id
  from public.usuarios
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select rol
  from public.usuarios
  where auth_user_id = auth.uid()
  limit 1;
$$;

grant usage on schema public to anon, authenticated;

do $$
declare
  table_name text;
  scoped_tables text[] := array[
    'usuarios',
    'vendedores',
    'ubicaciones_vendedores',
    'clientes',
    'puntos_venta',
    'productos',
    'precios_productos',
    'inventarios',
    'movimientos_inventario',
    'pedidos',
    'pedido_items',
    'rutas',
    'ruta_paradas',
    'visitas',
    'incidencias',
    'archivos',
    'incidencias_archivos'
  ];
begin
  foreach table_name in array scoped_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', 'tenant_select_' || table_name, table_name);
    execute format('drop policy if exists %I on public.%I', 'tenant_insert_' || table_name, table_name);
    execute format('drop policy if exists %I on public.%I', 'tenant_update_' || table_name, table_name);

    execute format(
      'create policy %I on public.%I for select using (empresa_id = public.current_empresa_id())',
      'tenant_select_' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert with check (empresa_id = public.current_empresa_id())',
      'tenant_insert_' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for update using (empresa_id = public.current_empresa_id()) with check (empresa_id = public.current_empresa_id())',
      'tenant_update_' || table_name,
      table_name
    );
  end loop;
end $$;

alter table public.empresas enable row level security;
drop policy if exists tenant_owner_empresas on public.empresas;
create policy tenant_owner_empresas on public.empresas
for all
using (
  id = public.current_empresa_id()
  and public.current_user_role() in ('OWNER', 'ADMIN')
)
with check (
  id = public.current_empresa_id()
  and public.current_user_role() in ('OWNER', 'ADMIN')
);
