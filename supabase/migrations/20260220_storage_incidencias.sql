insert into storage.buckets (id, name, public, file_size_limit)
values ('incidencias-evidencias', 'incidencias-evidencias', false, 10485760)
on conflict (id) do nothing;

drop policy if exists incidencia_evidencia_select on storage.objects;
drop policy if exists incidencia_evidencia_insert on storage.objects;
drop policy if exists incidencia_evidencia_update on storage.objects;
drop policy if exists incidencia_evidencia_delete on storage.objects;

create policy incidencia_evidencia_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'incidencias-evidencias'
  and split_part(name, '/', 1) = public.current_empresa_id()::text
);

create policy incidencia_evidencia_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'incidencias-evidencias'
  and split_part(name, '/', 1) = public.current_empresa_id()::text
);

create policy incidencia_evidencia_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'incidencias-evidencias'
  and split_part(name, '/', 1) = public.current_empresa_id()::text
)
with check (
  bucket_id = 'incidencias-evidencias'
  and split_part(name, '/', 1) = public.current_empresa_id()::text
);

create policy incidencia_evidencia_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'incidencias-evidencias'
  and split_part(name, '/', 1) = public.current_empresa_id()::text
);
