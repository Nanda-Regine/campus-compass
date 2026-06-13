-- Add bio to profiles + create avatars storage bucket

alter table public.profiles add column if not exists bio text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728,
  array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'avatars: public read'
  ) then
    execute $p$
      create policy "avatars: public read"
        on storage.objects for select using (bucket_id = 'avatars')
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'avatars: auth upload'
  ) then
    execute $p$
      create policy "avatars: auth upload"
        on storage.objects for insert
        with check (bucket_id = 'avatars' and auth.uid() is not null)
    $p$;
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'avatars: owner update'
  ) then
    execute $p$
      create policy "avatars: owner update"
        on storage.objects for update
        using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
    $p$;
  end if;
end $$;
