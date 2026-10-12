create table if not exists public.user_favorite_exercises (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

comment on table public.user_favorite_exercises is
  'Exercises saved as favorites by authenticated users.';

create index if not exists user_favorite_exercises_user_created_idx
  on public.user_favorite_exercises (user_id, created_at desc);

create index if not exists user_favorite_exercises_exercise_idx
  on public.user_favorite_exercises (exercise_id);

alter table public.user_favorite_exercises enable row level security;

drop policy if exists "Users can read their favorite exercises" on public.user_favorite_exercises;
create policy "Users can read their favorite exercises"
on public.user_favorite_exercises for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can add their favorite exercises" on public.user_favorite_exercises;
create policy "Users can add their favorite exercises"
on public.user_favorite_exercises for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.exercises
    where public.exercises.id = exercise_id
      and public.exercises.status = 'Published'
  )
);

drop policy if exists "Users can remove their favorite exercises" on public.user_favorite_exercises;
create policy "Users can remove their favorite exercises"
on public.user_favorite_exercises for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_favorite_exercises from public, anon, authenticated;
grant select, insert, delete on table public.user_favorite_exercises to authenticated;
