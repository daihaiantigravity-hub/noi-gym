create table if not exists public.exercise_targets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  mode text not null check (mode in ('advanced', 'joint')),
  slug text not null,
  label text not null,
  source text not null default 'musclewiki' check (source in ('custom', 'musclewiki')),
  source_url text,
  created_at timestamptz not null default now(),
  unique (exercise_id, mode, slug)
);

create index if not exists exercise_targets_lookup_idx
  on public.exercise_targets (mode, slug);
create index if not exists exercise_targets_exercise_idx
  on public.exercise_targets (exercise_id);

alter table public.exercise_targets enable row level security;

drop policy if exists "Published exercise targets are public" on public.exercise_targets;
create policy "Published exercise targets are public"
on public.exercise_targets for select to public
using (
  exists (
    select 1
    from public.exercises
    where public.exercises.id = public.exercise_targets.exercise_id
      and public.exercises.status = 'Published'
  )
);

-- Admin mutations are performed server-side with SUPABASE_SECRET_KEY.
