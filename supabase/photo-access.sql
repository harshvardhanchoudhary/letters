begin;
-- Apply after relaunch.sql. These policies affect only timeline-photos.
-- Then switch that bucket to Private in the Supabase Storage dashboard.
-- No files or rows are removed. Existing names and photo URLs remain stored.
create policy "Letters photos deny anonymous reads" on storage.objects as restrictive
for select to anon using (bucket_id <> 'timeline-photos');
create policy "Letters photos member reads" on storage.objects as restrictive
for select to authenticated using (bucket_id <> 'timeline-photos' or (select private.is_member()));
create policy "Letters photos owner uploads" on storage.objects as restrictive
for insert to authenticated with check (bucket_id <> 'timeline-photos' or
 ((select private.is_member()) and (storage.foldername(name))[1] = (select auth.uid())::text));
create policy "Letters photos no anonymous uploads" on storage.objects as restrictive
for insert to anon with check (bucket_id <> 'timeline-photos');
create policy "Letters photos immutable" on storage.objects as restrictive
for update to public using (bucket_id <> 'timeline-photos') with check (bucket_id <> 'timeline-photos');
-- An upload whose postcard save failed may be cleaned up by its uploader.
-- Referenced photographs, including the original photo, cannot be removed.
create policy "Letters orphan cleanup" on storage.objects for delete to authenticated using (
 bucket_id = 'timeline-photos' and (select private.is_member())
 and (storage.foldername(name))[1] = (select auth.uid())::text
 and not exists (select 1 from public.postcards where image_url = storage.objects.name));
create policy "Letters photos protect referenced files" on storage.objects as restrictive
for delete to authenticated using (bucket_id <> 'timeline-photos' or (
 (select private.is_member()) and (storage.foldername(name))[1] = (select auth.uid())::text
 and not exists (select 1 from public.postcards where image_url = storage.objects.name)));
create policy "Letters photos no anonymous deletion" on storage.objects as restrictive
for delete to anon using (bucket_id <> 'timeline-photos');
commit;
