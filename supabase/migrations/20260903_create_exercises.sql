create extension if not exists pgcrypto;

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'custom' check (source in ('custom', 'musclewiki')),
  source_id bigint,
  name text not null,
  slug text not null unique,
  description text not null default '',
  primary_muscles text[] not null default '{}',
  category text not null default '',
  force text check (force in ('Push', 'Pull', 'Hold')),
  grips text check (grips in ('Mixed', 'Neutral', 'None', 'Overhand', 'Underhand')),
  mechanic text check (mechanic in ('Compound', 'Isolation')),
  difficulty text not null default '' check (difficulty in ('', 'Beginner', 'Novice', 'Intermediate', 'Advanced')),
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  steps jsonb not null default '[]'::jsonb,
  media jsonb not null default '[]'::jsonb,
  source_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists exercises_status_idx on public.exercises (status);
create index if not exists exercises_category_idx on public.exercises (category);
create index if not exists exercises_muscles_idx on public.exercises using gin (primary_muscles);

create or replace function public.set_exercises_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exercises_updated_at on public.exercises;
create trigger exercises_updated_at
before update on public.exercises
for each row execute function public.set_exercises_updated_at();

alter table public.exercises enable row level security;

drop policy if exists "Published exercises are public" on public.exercises;
create policy "Published exercises are public"
on public.exercises for select
using (status = 'Published');

-- Admin mutations are performed server-side with SUPABASE_SECRET_KEY.

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
