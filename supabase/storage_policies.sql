
-- Storage Policies
-- IMPORTANT: You must create a bucket named 'images' in the Storage dashboard first.

-- Allow public read access to the 'images' bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- Allow authenticated users to upload files to the 'images' bucket
create policy "Authenticated users can upload images"
on storage.objects for insert
with check (
  bucket_id = 'images'
  and auth.role() = 'authenticated'
);
