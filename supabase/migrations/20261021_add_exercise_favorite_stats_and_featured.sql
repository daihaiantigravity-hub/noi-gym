create table if not exists public.exercise_favorite_stats (
  exercise_id uuid primary key references public.exercises(id) on delete cascade,
  favorite_count bigint not null default 0 check (favorite_count >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.exercise_favorite_stats is
  'Public aggregate favorite count per exercise. Contains no user identity.';

alter table public.exercise_favorite_stats enable row level security;

drop policy if exists "Favorite counts are public" on public.exercise_favorite_stats;
create policy "Favorite counts are public"
on public.exercise_favorite_stats for select
to public
using (true);

revoke all on table public.exercise_favorite_stats from public, anon, authenticated;
grant select on table public.exercise_favorite_stats to anon, authenticated;

create or replace function public.sync_exercise_favorite_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.exercise_favorite_stats (exercise_id, favorite_count, updated_at)
    values (new.exercise_id, 1, now())
    on conflict (exercise_id) do update
      set favorite_count = public.exercise_favorite_stats.favorite_count + 1,
          updated_at = now();
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.exercise_favorite_stats
    set favorite_count = greatest(favorite_count - 1, 0),
        updated_at = now()
    where exercise_id = old.exercise_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists user_favorite_exercises_update_stats on public.user_favorite_exercises;
create trigger user_favorite_exercises_update_stats
after insert or delete on public.user_favorite_exercises
for each row execute function public.sync_exercise_favorite_stats();

insert into public.exercise_favorite_stats (exercise_id, favorite_count, updated_at)
select exercise_id, count(*)::bigint, now()
from public.user_favorite_exercises
group by exercise_id
on conflict (exercise_id) do update
set favorite_count = excluded.favorite_count,
    updated_at = excluded.updated_at;

create table if not exists public.admin_featured_exercises (
  exercise_id uuid primary key references public.exercises(id) on delete cascade,
  featured_by uuid references auth.users(id) on delete set null,
  featured_at timestamptz not null default now()
);

comment on table public.admin_featured_exercises is
  'Exercises explicitly featured by an administrator. Separate from personal favorites.';

create index if not exists admin_featured_exercises_featured_at_idx
  on public.admin_featured_exercises (featured_at desc);

alter table public.admin_featured_exercises enable row level security;
revoke all on table public.admin_featured_exercises from public, anon, authenticated;

-- Before public user favorites existed, every row was created through the admin-only API.
-- Preserve that earlier priority list as explicit admin recommendations.
insert into public.admin_featured_exercises (exercise_id, featured_by, featured_at)
select distinct on (exercise_id) exercise_id, user_id, created_at
from public.user_favorite_exercises
order by exercise_id, created_at desc
on conflict (exercise_id) do nothing;

create or replace function public.reconcile_exercise_favorite_stats()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.exercise_favorite_stats (exercise_id, favorite_count, updated_at)
  select exercises.id, count(favorites.exercise_id)::bigint, now()
  from public.exercises
  left join public.user_favorite_exercises as favorites
    on favorites.exercise_id = exercises.id
  group by exercises.id
  on conflict (exercise_id) do update
  set favorite_count = excluded.favorite_count,
      updated_at = excluded.updated_at;
$$;

revoke all on function public.reconcile_exercise_favorite_stats() from public, anon, authenticated;
