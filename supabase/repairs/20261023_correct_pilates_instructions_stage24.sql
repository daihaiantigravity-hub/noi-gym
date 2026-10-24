-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Clarify Hip Rolls carriage return and add its reviewed Vietnamese translation.
-- Run the whole file. It is idempotent and refuses to overwrite a changed revision.
-- Only exercises.steps changes; all other source fields and timestamps are preserved.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_restore_sources on commit drop as
select * from jsonb_to_recordset($noi_gym_sources$
[
  {
    "exercise_id": "06144a01-a685-456d-a1be-ebbb1f1c9192",
    "source_id": 35808622277544,
    "before_hash": "cf8f9ed68ce332d961fd3f649ea55aa6d708f2e29958017fe0520925ebe6315f",
    "after_hash": "3eb3102e8b58eda5768f743920b704f253864ce82394b9d509ebf00a2f950416",
    "expected_updated_at": "2026-10-14T10:46:50.998489+00:00",
    "steps": [
      "Lie supine with knees bent, feet hip-width, arms relaxed by sides.",
      "Inhale to prepare, exhale and posteriorly tilt pelvis.",
      "Roll spine up one vertebra at a time into bridge.",
      "Press through your legs until they are nearly extended, then bend your knees to return the carriage to its starting position while keeping your hips lifted.",
      "Then begin rolling your spine downward until your back is flat against the carriage."
    ]
  }
]
$noi_gym_sources$::jsonb) as payload(
  exercise_id uuid, source_id bigint, before_hash text, after_hash text,
  expected_updated_at timestamptz, steps jsonb
);

create temp table _noi_gym_restore_translations on commit drop as
select * from jsonb_to_recordset($noi_gym_translations$
[
  {
    "exercise_id": "06144a01-a685-456d-a1be-ebbb1f1c9192",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3eb3102e8b58eda5768f743920b704f253864ce82394b9d509ebf00a2f950416",
    "name": "Cuộn hông",
    "description": "",
    "steps": [
      "Nằm ngửa trên máy Reformer, gập gối, đặt hai bàn chân rộng bằng hông và thả lỏng hai tay dọc theo thân người.",
      "Hít vào để chuẩn bị, thở ra và nghiêng xương chậu về phía sau.",
      "Cuộn cột sống lên từng đốt một để nâng hông thành tư thế cây cầu.",
      "Giữ hông nâng lên, đạp chân đến khi gần duỗi thẳng, sau đó gập gối để đưa bàn trượt về vị trí ban đầu.",
      "Sau đó cuộn cột sống xuống từng đốt một cho đến khi lưng áp phẳng lên bàn trượt."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T11:18:05.848Z"
  }
]
$noi_gym_translations$::jsonb) as payload(
  exercise_id uuid, locale text, source_locale text, source_hash text,
  name text, description text, steps jsonb, translation_status text, reviewed_at timestamptz
);

create temp table _noi_gym_restore_before on commit drop as
select exercise.* from public.exercises as exercise
join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id;

do $verify_before$
begin
  if (select count(*) from _noi_gym_restore_sources) <> 1
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 1
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
  ) then
    raise exception 'Source revision changed. Do not overwrite; refresh the prepared repair';
  end if;
  if exists (
    select 1 from public.exercise_translations as current
    join _noi_gym_restore_sources as source on source.exercise_id = current.exercise_id
    left join _noi_gym_restore_translations as planned
      on planned.exercise_id = current.exercise_id and planned.locale = current.locale
    where planned.exercise_id is null
      or current.source_hash is distinct from planned.source_hash
      or current.source_locale is distinct from planned.source_locale
      or current.name is distinct from planned.name
      or current.description is distinct from planned.description
      or current.steps is distinct from planned.steps
      or current.translation_status is distinct from planned.translation_status
      or current.reviewed_at is distinct from planned.reviewed_at
  ) then
    raise exception 'Translation changed during review. Refresh instead of overwriting';
  end if;
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
  ) then
    raise exception 'Unexpected exercise field or timestamp change; repair rolled back';
  end if;
  if (select count(*) from public.exercise_translations as current
    join _noi_gym_restore_translations as planned
      on planned.exercise_id = current.exercise_id and planned.locale = current.locale
    where current.source_hash = planned.source_hash and current.name = planned.name
      and current.description = planned.description and current.steps = planned.steps
      and current.source_locale = planned.source_locale
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 1 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this repair: 1,926 reviewed (1,925 Vietnamese, 1 English).
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
