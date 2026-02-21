create table if not exists public.auditoria_eliminaciones_clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id),
  cliente_id uuid not null,
  cliente_nombre text,
  resumen jsonb not null,
  fecha timestamptz not null default now()
);

create index if not exists idx_auditoria_eliminaciones_clientes_empresa_id
on public.auditoria_eliminaciones_clientes(empresa_id);

create or replace function public.delete_client_full(p_empresa_id uuid, p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  file_id_row record;
  client_name_value text;
  total_points integer := 0;
  total_orders integer := 0;
  total_visits integer := 0;
  total_incidences integer := 0;
begin
  if p_empresa_id is null or p_client_id is null then
    raise exception 'Parámetros inválidos';
  end if;

  if p_empresa_id <> public.current_empresa_id() then
    raise exception 'Operación no permitida para esta empresa';
  end if;

  if not exists (
    select 1
    from public.clientes
    where id = p_client_id
      and empresa_id = p_empresa_id
  ) then
    raise exception 'Cliente no encontrado';
  end if;

  select c.nombre_completo into client_name_value
  from public.clientes c
  where c.id = p_client_id and c.empresa_id = p_empresa_id;

  select count(*) into total_points
  from public.puntos_venta
  where empresa_id = p_empresa_id and cliente_id = p_client_id;

  select count(*) into total_orders
  from public.pedidos
  where empresa_id = p_empresa_id and cliente_id = p_client_id;

  select count(*) into total_incidences
  from public.incidencias
  where empresa_id = p_empresa_id and cliente_id = p_client_id;

  select count(*) into total_visits
  from public.visitas
  where empresa_id = p_empresa_id
    and ruta_parada_id in (
      select id
      from public.ruta_paradas
      where empresa_id = p_empresa_id
        and cliente_id = p_client_id
    );

  insert into public.auditoria_eliminaciones_clientes (
    empresa_id,
    cliente_id,
    cliente_nombre,
    resumen
  )
  values (
    p_empresa_id,
    p_client_id,
    client_name_value,
    jsonb_build_object(
      'puntos_venta', total_points,
      'pedidos', total_orders,
      'incidencias', total_incidences,
      'visitas', total_visits
    )
  );

  update public.ruta_paradas
  set incidencia_id = null
  where empresa_id = p_empresa_id
    and incidencia_id in (
      select id
      from public.incidencias
      where empresa_id = p_empresa_id
        and cliente_id = p_client_id
    );

  update public.ruta_paradas
  set pedido_id = null
  where empresa_id = p_empresa_id
    and pedido_id in (
      select id
      from public.pedidos
      where empresa_id = p_empresa_id
        and cliente_id = p_client_id
    );

  delete from public.visitas
  where empresa_id = p_empresa_id
    and ruta_parada_id in (
      select id
      from public.ruta_paradas
      where empresa_id = p_empresa_id
        and cliente_id = p_client_id
    );

  delete from public.ruta_paradas
  where empresa_id = p_empresa_id
    and cliente_id = p_client_id;

  for file_id_row in
    select distinct ia.archivo_id as archivo_id
    from public.incidencias_archivos ia
    join public.incidencias i on i.id = ia.incidencia_id
    where ia.empresa_id = p_empresa_id
      and i.empresa_id = p_empresa_id
      and i.cliente_id = p_client_id
  loop
    delete from public.incidencias_archivos
    where empresa_id = p_empresa_id
      and archivo_id = file_id_row.archivo_id;

    delete from public.archivos
    where empresa_id = p_empresa_id
      and id = file_id_row.archivo_id;
  end loop;

  delete from public.incidencias
  where empresa_id = p_empresa_id
    and cliente_id = p_client_id;

  delete from public.movimientos_inventario
  where empresa_id = p_empresa_id
    and referencia_tipo = 'PEDIDO'
    and referencia_id in (
      select id
      from public.pedidos
      where empresa_id = p_empresa_id
        and cliente_id = p_client_id
    );

  delete from public.pedido_items
  where empresa_id = p_empresa_id
    and pedido_id in (
      select id
      from public.pedidos
      where empresa_id = p_empresa_id
        and cliente_id = p_client_id
    );

  delete from public.pedidos
  where empresa_id = p_empresa_id
    and cliente_id = p_client_id;

  delete from public.puntos_venta
  where empresa_id = p_empresa_id
    and cliente_id = p_client_id;

  delete from public.clientes
  where empresa_id = p_empresa_id
    and id = p_client_id;
end;
$$;

grant execute on function public.delete_client_full(uuid, uuid) to authenticated;
grant select on public.auditoria_eliminaciones_clientes to authenticated;
