-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Correct the named heel grip in Wide Legged Standing Forward Bend Holding Heels and add its reviewed Vietnamese translation.
-- Run the whole file. It is idempotent and refuses to overwrite a changed revision.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_restore_sources on commit drop as
select * from jsonb_to_recordset($noi_gym_sources$[{"exercise_id":"f98f8ba1-005a-4c83-9926-1d956a471333","source_id":76547392951327,"before_hash":"8675790bdb0a9acb53f18929ff5f43ae2295fe2ed133a61dbd4c064a1b665a0c","after_hash":"ca5b56d07a888a1c5994b4965612b3b65e257ca8fef3e6bdeb20c11d722716d4","expected_updated_at":"2026-10-14T10:47:00.304546+00:00","steps":["Start standing at the top of your mat with your feet wide apart.","Exhale and fold forward from your hips, reaching both hands down to hold your heels.","Hold both heels for a few breaths, then release the grip and slowly return to standing."]}]$noi_gym_sources$::jsonb) as payload(
  exercise_id uuid, source_id bigint, before_hash text, after_hash text,
  expected_updated_at timestamptz, steps jsonb
);

create temp table _noi_gym_restore_translations on commit drop as
select * from jsonb_to_recordset($noi_gym_translations$[{"exercise_id":"f98f8ba1-005a-4c83-9926-1d956a471333","locale":"vi","source_locale":"en","source_hash":"ca5b56d07a888a1c5994b4965612b3b65e257ca8fef3e6bdeb20c11d722716d4","name":"Tư thế gập người chân rộng giữ gót chân","description":"","steps":["Bắt đầu đứng ở đầu thảm, hai chân mở rộng.","Thở ra, gập người từ hông và đưa cả hai tay xuống nắm gót chân.","Giữ cả hai gót chân trong vài nhịp thở, sau đó thả tay và từ từ trở lại tư thế đứng."],"translation_status":"reviewed","reviewed_at":"2026-10-23T14:27:42.672Z"}]$noi_gym_translations$::jsonb) as payload(
  exercise_id uuid, locale text, source_locale text, source_hash text,
  name text, description text, steps jsonb, translation_status text, reviewed_at timestamptz
);

create temp table _noi_gym_restore_before on commit drop as
select exercise.* from public.exercises as exercise
join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id;

do $verify_before$
begin
  if (select count(*) from _noi_gym_restore_sources) <> 1
    or (select count(*) from _noi_gym_restore_translations) <> 1
    or (select count(*) from _noi_gym_restore_before) <> 1 then
    raise exception 'Unexpected repair scope or wrong Supabase project';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Expected enabled exercise timestamp trigger';
  end if;
  if exists (
    select 1 from public.exercises as exercise
    join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id
    where exercise.source <> 'musclewiki' or exercise.source_id is distinct from patch.source_id
      or exercise.updated_at is distinct from patch.expected_updated_at
      or public.exercise_content_hash(exercise.name, exercise.description, exercise.steps)
        not in (patch.before_hash, patch.after_hash)
  ) then raise exception 'Source revision changed. Do not overwrite; refresh the prepared repair'; end if;
  if exists (
    select 1 from public.exercise_translations as current
    join _noi_gym_restore_translations as planned
      on planned.exercise_id = current.exercise_id and planned.locale = current.locale
    where current.source_hash is distinct from planned.source_hash
      or current.source_locale is distinct from planned.source_locale
      or current.name is distinct from planned.name
      or current.description is distinct from planned.description
      or current.steps is distinct from planned.steps
      or current.translation_status is distinct from planned.translation_status
  ) then raise exception 'Translation changed during review. Refresh the prepared repair'; end if;
end;
$verify_before$;

alter table public.exercises disable trigger exercises_updated_at;
update public.exercises as exercise
set steps = patch.steps
from _noi_gym_restore_sources as patch
where exercise.id = patch.exercise_id
  and public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) = patch.before_hash;
alter table public.exercises enable trigger exercises_updated_at;

insert into public.exercise_translations (
  exercise_id, locale, source_locale, source_hash, name, description,
  steps, translation_status, reviewed_at
)
select exercise_id, locale, source_locale, source_hash, name, description,
  steps, translation_status, reviewed_at
from _noi_gym_restore_translations
on conflict (exercise_id, locale) do nothing;

do $verify_after$
begin
  if exists (
    select 1 from public.exercises as exercise
    join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id
    join _noi_gym_restore_before as original on original.id = exercise.id
    where public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) <> patch.after_hash
      or (to_jsonb(exercise) - 'steps') is distinct from (to_jsonb(original) - 'steps')
  ) then raise exception 'Unexpected exercise field or timestamp change; repair rolled back'; end if;
  if (select count(*) from public.exercise_translations as current
    join _noi_gym_restore_translations as planned
      on planned.exercise_id = current.exercise_id and planned.locale = current.locale
    where current.source_hash = planned.source_hash and current.name = planned.name
      and current.description = planned.description and current.steps = planned.steps
      and current.source_locale = planned.source_locale
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 1 then
    raise exception 'Incomplete translation import; transaction rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this repair: 1,929 reviewed (1,928 Vietnamese; 1 English).
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
