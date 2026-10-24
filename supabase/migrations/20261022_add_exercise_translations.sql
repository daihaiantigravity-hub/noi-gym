-- Additive migration. Source content, media, favorites and exercise.updated_at stay intact.
begin;

create or replace function public.exercise_content_hash(content_name text, content_description text, content_steps jsonb)
returns text language sql immutable set search_path = ''
as $$
  select pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(
    pg_catalog.octet_length(coalesce(content_name, ''))::text || ':' || coalesce(content_name, '') ||
    pg_catalog.octet_length(coalesce(content_description, ''))::text || ':' || coalesce(content_description, '') ||
    coalesce((select pg_catalog.string_agg(pg_catalog.octet_length(value)::text || ':' || value, '' order by position)
      from pg_catalog.jsonb_array_elements_text(coalesce(content_steps, '[]'::jsonb)) with ordinality as step(value, position)), ''),
    'UTF8')), 'hex');
$$;

create or replace function public.valid_exercise_translation_steps(value jsonb)
returns boolean language sql immutable set search_path = ''
as $$
  select case when pg_catalog.jsonb_typeof(value) <> 'array' then false
  else not exists (
    select 1 from pg_catalog.jsonb_array_elements(value) as step(item)
    where pg_catalog.jsonb_typeof(item) <> 'string'
      or pg_catalog.length(pg_catalog.btrim(item #>> '{}')) = 0
      or pg_catalog.length(item #>> '{}') > 2000
  ) end;
$$;

create table if not exists public.exercise_translations (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  locale text not null check (locale in ('en', 'vi')),
  name text not null check (length(btrim(name)) between 1 and 200),
  description text not null default '' check (length(description) <= 2000),
  steps jsonb not null default '[]'::jsonb check (public.valid_exercise_translation_steps(steps)),
  source_locale text not null check (source_locale in ('en', 'vi')),
  source_hash text not null check (source_hash ~ '^[0-9a-f]{64}$'),
  translation_status text not null default 'draft' check (translation_status in ('draft', 'reviewed', 'stale')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (exercise_id, locale),
  check ((translation_status = 'reviewed' and reviewed_at is not null and jsonb_array_length(steps) > 0)
    or (translation_status <> 'reviewed' and reviewed_at is null))
);

create index if not exists exercise_translations_locale_status_idx
  on public.exercise_translations (locale, translation_status);

alter table public.exercise_translations enable row level security;
revoke all on table public.exercise_translations from public, anon, authenticated;
grant select on table public.exercise_translations to anon, authenticated;
grant select, insert, update, delete on table public.exercise_translations to service_role;

drop policy if exists "Reviewed current translations are public" on public.exercise_translations;
create policy "Reviewed current translations are public"
on public.exercise_translations for select to anon, authenticated
using (
  translation_status = 'reviewed'
  and exists (
    select 1 from public.exercises as exercise
    where exercise.id = exercise_id and exercise.status = 'Published'
      and source_hash = public.exercise_content_hash(exercise.name, exercise.description, exercise.steps)
  )
);

create or replace function public.validate_exercise_translation_source()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  exercise public.exercises%rowtype;
begin
  select * into exercise from public.exercises where id = new.exercise_id for share;
  if not found then raise exception 'Exercise not found' using errcode = '23503'; end if;
  if new.translation_status <> 'stale' and new.source_hash <> public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) then
    raise exception 'Source content changed; re-export before saving this translation' using errcode = '23514';
  end if;
  if new.translation_status = 'reviewed' then
    if pg_catalog.jsonb_array_length(new.steps) <> pg_catalog.jsonb_array_length(exercise.steps)
      or (pg_catalog.btrim(exercise.description) <> '' and pg_catalog.btrim(new.description) = '') then
      raise exception 'A reviewed translation must preserve all source instructions and description' using errcode = '23514';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists exercise_translation_validate_source on public.exercise_translations;
create trigger exercise_translation_validate_source
before insert or update on public.exercise_translations
for each row execute function public.validate_exercise_translation_source();

create or replace function public.expire_changed_exercise_translations()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.exercise_translations
  set translation_status = 'stale', reviewed_at = null
  where exercise_id = new.id and translation_status <> 'stale';
  return new;
end;
$$;

drop trigger if exists exercise_content_expire_translations on public.exercises;
create trigger exercise_content_expire_translations
after update of name, description, steps on public.exercises
for each row when (old.name is distinct from new.name or old.description is distinct from new.description or old.steps is distinct from new.steps)
execute function public.expire_changed_exercise_translations();

revoke all on function public.validate_exercise_translation_source() from public;
revoke all on function public.expire_changed_exercise_translations() from public;

comment on table public.exercise_translations is 'Versioned exercise text translations shared by male and female media; writes are authorized server-side.';
commit;
