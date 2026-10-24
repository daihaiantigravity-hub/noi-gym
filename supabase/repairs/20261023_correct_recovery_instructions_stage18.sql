-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 2 reviewed instruction corrections and insert 2 reviewed VI translations.
-- Run the WHOLE file in a new SQL Editor query. Re-running it is safe.
-- Only exercise.steps changes; media, names, categories and timestamps are preserved.
-- The timestamp trigger alone is suspended inside this transaction; RLS and
-- translation validation/staleness triggers remain enabled. Errors roll back all changes.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_restore_sources on commit drop as
select * from jsonb_to_recordset(convert_from(decode('WwogIHsKICAgICJleGVyY2lzZV9pZCI6ICI0ZDY0NDI1ZC1hODg0LTRhZWQtOGFhYy1iYzk5MWU5NDUwZGMiLAogICAgInNvdXJjZV9pZCI6IDE3NjI4MzEyMjA2ODgyMiwKICAgICJiZWZvcmVfaGFzaCI6ICJlZmFkNWRjZDZhNGVhZmIyOTk0MTc0NTlmYWY1ODI0ODg0YWIyMDAxYmQ3MmFjOWU5MGMyYTJiY2VkNmQxODA0IiwKICAgICJhZnRlcl9oYXNoIjogImMwMDJmOGRkZGFlYmFiMzUyMWQ3NTVhMzVjNzYwNDBlNjk0ZDk4ZmY1MTNlMWUzNTZlNWQyNGEyMWFjNjA5ZjciLAogICAgImV4cGVjdGVkX3VwZGF0ZWRfYXQiOiAiMjAyNi0xMC0xNFQxMDo0NzoyMS4zNjg3NDYrMDA6MDAiLAogICAgInN0ZXBzIjogWwogICAgICAiU3RhbmQgb24gYSBib3ggd2l0aCB0aGUgYmFsbHMgb2YgYm90aCBmZWV0IG5lYXIgaXRzIGVkZ2UuIiwKICAgICAgIkxvd2VyIGJvdGggaGVlbHMgdG93YXJkIHRoZSBncm91bmQgYW5kIGhvbGQgdGhlIHBvc2l0aW9uIGZvciB0aGUgZHVyYXRpb24gc3BlY2lmaWVkLiIsCiAgICAgICJZb3Ugc2hvdWxkIGZlZWwgeW91ciBjYWx2ZXMgc3RyZXRjaGluZy4iCiAgICBdCiAgfSwKICB7CiAgICAiZXhlcmNpc2VfaWQiOiAiYzVkMTUwZTMtZDBmMy00NWFhLWJlZDUtYWEyM2JiOWI1ZWI3IiwKICAgICJzb3VyY2VfaWQiOiAyMjYyNDY5MjM1Nzg3NjIsCiAgICAiYmVmb3JlX2hhc2giOiAiMDE4MTJjNGIyYjUxNzA4OGE0MzA4YjI4YjhkNWQwMGU4ODRlYzI0N2Y2NmFmODcyNGM2ZmI2M2VkZDcyZDgyMCIsCiAgICAiYWZ0ZXJfaGFzaCI6ICI0NmQ5NDZhM2IwY2FlODQ3Y2JhZTliY2M3MzE2NDk1M2Q5MzY1NjA2NjVhMGNlZDIwMTZlNTdiNGU3ZTkwM2FhIiwKICAgICJleHBlY3RlZF91cGRhdGVkX2F0IjogIjIwMjYtMTAtMTRUMTA6NDc6MzAuOTMwNTU4KzAwOjAwIiwKICAgICJzdGVwcyI6IFsKICAgICAgIlN0YW5kIHVwcmlnaHQgd2l0aCBnb29kIGZvcm0uIiwKICAgICAgIlB1c2ggeW91ciBoaXBzIGJhY2sgYW5kIGhpbmdlIHlvdXIgdXBwZXIgYm9keSBmb3J3YXJkLiIsCiAgICAgICJLZWVwIHlvdXIgYmFjayBzdHJhaWdodCBhcyB5b3UgcmVhY2ggdG93YXJkIHlvdXIgdG9lcy4iLAogICAgICAiUmV0dXJuIHRvIHN0YW5kaW5nIGJ5IGV4dGVuZGluZyB5b3VyIGhpcHMgYW5kIGtuZWVzIHdoaWxlIGtlZXBpbmcgeW91ciBiYWNrIHN0cmFpZ2h0LiIKICAgIF0KICB9Cl0=', 'base64'), 'UTF8')::jsonb) as payload(
  exercise_id uuid, source_id bigint, before_hash text, after_hash text,
  expected_updated_at timestamptz, steps jsonb
);

create temp table _noi_gym_restore_translations on commit drop as
select * from jsonb_to_recordset(convert_from(decode('WwogIHsKICAgICJleGVyY2lzZV9pZCI6ICI0ZDY0NDI1ZC1hODg0LTRhZWQtOGFhYy1iYzk5MWU5NDUwZGMiLAogICAgImxvY2FsZSI6ICJ2aSIsCiAgICAic291cmNlX2xvY2FsZSI6ICJlbiIsCiAgICAic291cmNlX2hhc2giOiAiYzAwMmY4ZGRkYWViYWIzNTIxZDc1NWEzNWM3NjA0MGU2OTRkOThmZjUxM2UxZTM1NmU1ZDI0YTIxYWM2MDlmNyIsCiAgICAibmFtZSI6ICJHacOjbiBi4bqvcCBjaMOibiBoYWkgY2jDom4gdHLDqm4gYuG7pWMiLAogICAgImRlc2NyaXB0aW9uIjogIiIsCiAgICAic3RlcHMiOiBbCiAgICAgICLEkOG7qW5nIHRyw6puIGLhu6VjLCDEkeG6t3QgbcWpaSBj4bqjIGhhaSBiw6BuIGNow6JuIGfhuqduIG3DqXAgYuG7pWMuIiwKICAgICAgIkjhuqEgY+G6oyBoYWkgZ8OzdCBjaMOibiB24buBIHBow61hIHPDoG4gdsOgIGdp4buvIHTGsCB0aOG6vyB0cm9uZyBraG/huqNuZyB0aOG7nWkgZ2lhbiDEkcaw4bujYyBjaOG7iSDEkeG7i25oLiIsCiAgICAgICJC4bqhbiBz4bq9IGPhuqNtIHRo4bqleSBi4bqvcCBjaMOibiDEkcaw4bujYyBrw6lvIGdpw6NuLiIKICAgIF0sCiAgICAidHJhbnNsYXRpb25fc3RhdHVzIjogInJldmlld2VkIiwKICAgICJyZXZpZXdlZF9hdCI6ICIyMDI2LTEwLTIzVDA4OjUxOjA4LjIzMFoiCiAgfSwKICB7CiAgICAiZXhlcmNpc2VfaWQiOiAiYzVkMTUwZTMtZDBmMy00NWFhLWJlZDUtYWEyM2JiOWI1ZWI3IiwKICAgICJsb2NhbGUiOiAidmkiLAogICAgInNvdXJjZV9sb2NhbGUiOiAiZW4iLAogICAgInNvdXJjZV9oYXNoIjogIjQ2ZDk0NmEzYjBjYWU4NDdjYmFlOWJjYzczMTY0OTUzZDkzNjU2MDY2NWEwY2VkMjAxNmU1N2I0ZTdlOTAzYWEiLAogICAgIm5hbWUiOiAiRGVhZGxpZnQga2jDtG5nIHThuqEiLAogICAgImRlc2NyaXB0aW9uIjogIiIsCiAgICAic3RlcHMiOiBbCiAgICAgICLEkOG7qW5nIHRo4bqzbmcgduG7m2kgdMawIHRo4bq/IMSRw7puZy4iLAogICAgICAixJDhuql5IGjDtG5nIHJhIHNhdSB2w6AgZ+G6rXAgdGjDom4gdHLDqm4gduG7gSBwaMOtYSB0csaw4bubYy4iLAogICAgICAiR2nhu68gbMawbmcgdGjhurNuZyBraGkgxJHGsGEgdGF5IHbhu4EgcGjDrWEgY8OhYyBuZ8OzbiBjaMOibi4iLAogICAgICAiRHXhu5dpIGjDtG5nIHbDoCBn4buRaSDEkeG7gyDEkeG7qW5nIHRo4bqzbmcgdHLhu58gbOG6oWksIMSR4buTbmcgdGjhu51pIGdp4buvIGzGsG5nIHRo4bqzbmcuIgogICAgXSwKICAgICJ0cmFuc2xhdGlvbl9zdGF0dXMiOiAicmV2aWV3ZWQiLAogICAgInJldmlld2VkX2F0IjogIjIwMjYtMTAtMjNUMDg6NTE6MDguMjMwWiIKICB9Cl0=', 'base64'), 'UTF8')::jsonb) as payload(
  exercise_id uuid, locale text, source_locale text, source_hash text,
  name text, description text, steps jsonb, translation_status text, reviewed_at timestamptz
);

create temp table _noi_gym_restore_before on commit drop as
select exercise.* from public.exercises as exercise
join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id;

do $verify_before$
begin
  if (select count(*) from _noi_gym_restore_sources) <> 2
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 2
    or (select count(*) from _noi_gym_restore_translations) <> 2
    or (select count(*) from _noi_gym_restore_before) <> 2 then
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
  -- Existing rows are accepted only when they exactly match this completed repair.
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 2 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1910, VI 1909, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
