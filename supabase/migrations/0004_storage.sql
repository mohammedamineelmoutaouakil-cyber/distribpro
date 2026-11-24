-- ============================================================================
-- DistribPro — 0004 Storage buckets & policies
-- Buckets are private. Images are served through short-lived signed URLs.
-- Object paths are always "<company_id>/...".
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', false, 2097152, array['image/jpeg','image/png','image/webp']),
  ('company-assets', 'company-assets', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "distribpro_storage_read" on storage.objects;
create policy "distribpro_storage_read" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('product-images', 'company-assets')
    and (
      public.is_platform_admin()
      or public.is_company_member(((storage.foldername(name))[1])::uuid)
      or public.current_customer_id(((storage.foldername(name))[1])::uuid) is not null
    )
  );

drop policy if exists "distribpro_storage_insert" on storage.objects;
create policy "distribpro_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images', 'company-assets')
    and public.is_company_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "distribpro_storage_update" on storage.objects;
create policy "distribpro_storage_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images', 'company-assets')
    and public.is_company_admin(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id in ('product-images', 'company-assets')
    and public.is_company_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "distribpro_storage_delete" on storage.objects;
create policy "distribpro_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images', 'company-assets')
    and public.is_company_admin(((storage.foldername(name))[1])::uuid)
  );
