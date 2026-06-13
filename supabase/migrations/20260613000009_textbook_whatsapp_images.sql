-- Add WhatsApp contact fields to textbook tables
-- and create textbook image storage bucket

alter table textbook_listings add column if not exists whatsapp_number text;
alter table textbook_interests add column if not exists whatsapp_number text;

-- Storage bucket for textbook cover images (5 MB limit)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('textbook-images', 'textbook-images', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

create policy if not exists "textbook images: public read"
  on storage.objects for select
  using (bucket_id = 'textbook-images');

create policy if not exists "textbook images: auth upload"
  on storage.objects for insert
  with check (bucket_id = 'textbook-images' and auth.uid() is not null);

create policy if not exists "textbook images: owner delete"
  on storage.objects for delete
  using (bucket_id = 'textbook-images' and auth.uid()::text = (storage.foldername(name))[1]);
