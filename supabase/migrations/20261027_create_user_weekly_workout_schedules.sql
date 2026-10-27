create table if not exists public.user_weekly_workout_schedules (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  muscle_groups text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, weekday),
  constraint user_weekly_workout_schedules_groups_allowed check (
    muscle_groups <@ array[
      'Abdominals', 'Anterior Deltoid', 'Biceps', 'Calves', 'Chest', 'Forearms',
      'Front Shoulders', 'Gastrocnemius', 'Glutes', 'Gluteus Maximus', 'Gluteus Medius',
      'Hamstrings', 'Inner Thigh', 'Lateral Deltoid', 'Lateral Hamstrings', 'Lats',
      'Long Head Bicep', 'Long Head Tricep', 'Lower Abdominals', 'Lower back',
      'Lower Trapezius', 'Medial Hamstrings', 'Obliques', 'Posterior Deltoid', 'Quads',
      'Rear Shoulders', 'Shoulders', 'Short Head Bicep', 'Traps', 'Traps (mid-back)',
      'Triceps', 'Upper Abdominals', 'Upper Traps', 'Wrist Extensors', 'Cardio'
    ]::text[]
  )
);

comment on table public.user_weekly_workout_schedules is
  'One personalized weekly workout schedule per authenticated user, with Monday as weekday 1.';

create index if not exists user_weekly_workout_schedules_user_idx
  on public.user_weekly_workout_schedules (user_id);

alter table public.user_weekly_workout_schedules enable row level security;
revoke all on table public.user_weekly_workout_schedules from public, anon, authenticated;
grant select, insert, update, delete on table public.user_weekly_workout_schedules to authenticated;

drop policy if exists "Users can read their weekly workout schedule" on public.user_weekly_workout_schedules;
create policy "Users can read their weekly workout schedule"
on public.user_weekly_workout_schedules for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their weekly workout schedule" on public.user_weekly_workout_schedules;
create policy "Users can create their weekly workout schedule"
on public.user_weekly_workout_schedules for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their weekly workout schedule" on public.user_weekly_workout_schedules;
create policy "Users can update their weekly workout schedule"
on public.user_weekly_workout_schedules for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their weekly workout schedule" on public.user_weekly_workout_schedules;
create policy "Users can delete their weekly workout schedule"
on public.user_weekly_workout_schedules for delete
to authenticated
using ((select auth.uid()) = user_id);
