-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (synced with auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Posts table
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  source text check (source in ('GNEWS', 'NAVER', 'MANUAL')) not null,
  source_url text,
  is_ai_generated boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(source_url) -- prevent duplicates by URL
);

-- Likes table
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- Bookmarks table
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- Comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;

-- Profiles: Public Read, Update Own
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile." on public.profiles for insert with check (auth.uid() = id);

-- Posts: Public Read, Auth Create, Author Update/Delete
create policy "Public posts are viewable by everyone." on public.posts for select using (true);
create policy "Authenticated users can create posts." on public.posts for insert with check (auth.role() = 'authenticated');
create policy "Users can update own posts." on public.posts for update using (auth.uid() = author_id);
create policy "Users can delete own posts." on public.posts for delete using (auth.uid() = author_id);

-- Likes: Public Read, Auth Interact
create policy "Likes are viewable by everyone." on public.likes for select using (true);
create policy "Authenticated users can insert likes." on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes." on public.likes for delete using (auth.uid() = user_id);

-- Bookmarks: Private (Viewer = Owner) or Public? Usually bookmarks are private. 
-- Spec says "Activity -> Activity: My Bookmarks". 
-- Let's make bookmarks viewable by owner only for privacy, though spec didn't strictly say. 
-- But actually, "Activity" implies I see my own.
create policy "Users can view own bookmarks." on public.bookmarks for select using (auth.uid() = user_id);
create policy "Authenticated users can insert bookmarks." on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can delete own bookmarks." on public.bookmarks for delete using (auth.uid() = user_id);

-- Comments: Public Read, Auth Create, Author Update/Delete
create policy "Comments are viewable by everyone." on public.comments for select using (true);
create policy "Authenticated users can create comments." on public.comments for insert with check (auth.role() = 'authenticated');
create policy "Users can update own comments." on public.comments for update using (auth.uid() = author_id);
create policy "Users can delete own comments." on public.comments for delete using (auth.uid() = author_id);

-- Function to handle new user signup (Optional but recommended for Profile creation)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Setup (Run this if buckets are missing)
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

-- Storage Policies (Avatars)
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

-- Storage Policies (Images for Posts)
create policy "Post images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Authenticated users can upload post images."
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );
