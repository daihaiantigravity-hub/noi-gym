-- Exercise demos are uploaded directly to Supabase Storage with a signed URL.
-- The Next.js route validates the file metadata before issuing that URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-media',
  'exercise-media',
  true,
  26214400,
  array['video/mp4', 'video/webm', 'video/quicktime']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read exercise media" on storage.objects;
create policy "Public can read exercise media"
on storage.objects for select to public
using (bucket_id = 'exercise-media');
