-- Storage Setup (Run ONLY this if you get "relation already exists" errors)

-- 1. Create Buckets
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. Create Policies for Avatars (Drop first to avoid duplication errors if re-running)
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Authenticated users can upload avatars." on storage.objects;
drop policy if exists "Users can update own avatar." on storage.objects;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Authenticated users can upload avatars."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner )
  with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- 3. Create Policies for Post Images
drop policy if exists "Post images are publicly accessible." on storage.objects;
drop policy if exists "Authenticated users can upload post images." on storage.objects;

create policy "Post images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Authenticated users can upload post images."
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );
