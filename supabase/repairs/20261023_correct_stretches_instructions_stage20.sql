-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Correct 3 Stretches instruction sources and insert 3 reviewed VI translations.
-- Re-running this transaction is safe. It changes only exercise.steps; timestamps and media are preserved.
-- Temporary tables drop at commit; the exercise timestamp trigger is restored in this transaction.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_restore_sources on commit drop as
select * from jsonb_to_recordset(convert_from(decode('WwogIHsKICAgICJleGVyY2lzZV9pZCI6ICI0OTk4ZTM0Ni01NDYyLTRlZDMtYTU1ZS1lMTdjNzU2NmNhMjMiLAogICAgInNvdXJjZV9pZCI6IDU1MDUzNjI4NTk3NjQ2LAogICAgImJlZm9yZV9oYXNoIjogImJkZmQwZTY2MGY0YzEyODllNGI1NmVjZjA3ZThjZDlmNjE1NDYzMTc2YWVjY2IzOGE1ZmUzNDA4MDVhNjc4ODAiLAogICAgImFmdGVyX2hhc2giOiAiMWIxZGM0MTljZGQ0ZmQ5MWFkN2ViMjcxNjhlZGZiMGI3Y2ViMTllYzMzZWVjYTk1NmIyMTYwNTZhZjRlNTg1OCIsCiAgICAiZXhwZWN0ZWRfdXBkYXRlZF9hdCI6ICIyMDI2LTEwLTE0VDEwOjQ2OjU1LjcyNDI2NiswMDowMCIsCiAgICAic3RlcHMiOiBbCiAgICAgICJTZXQgdXAgaW4gYSBrbmVlbGluZyBsdW5nZSB3aXRoIHlvdXIgYmFjayBrbmVlIG9uIHRoZSBmbG9vciBhbmQgdGhlIHRvcCBvZiB5b3VyIGJhY2sgZm9vdCBhZ2FpbnN0IHRoZSB3YWxsLiBQbGFjZSB5b3VyIGZyb250IGZvb3QgZmxhdCBvbiB0aGUgZmxvb3IgYW5kIGJlbmQgeW91ciBmcm9udCBrbmVlIHRvIGFib3V0IDkwIGRlZ3JlZXMuIiwKICAgICAgIlBsYWNlIHlvdXIgaGFuZHMgb24geW91ciBmcm9udCBrbmVlIGFuZCBsZWFuIGZvcndhcmQsIGFsbG93aW5nIHRoZSBrbmVlIHRvIG1vdmUgb3ZlciB0aGUgZm9vdC4iLAogICAgICAiUGF1c2UgYXQgdGhlIGRlZXBlc3QgcG9pbnQgb2YgdGhlIHN0cmV0Y2gsIHRoZW4gc2xvd2x5IHJldHVybiB0byB0aGUgc3RhcnRpbmcgcG9zaXRpb24uIFJlcGVhdCB3aXRoIHlvdXIgb3RoZXIgbGVnLiIKICAgIF0KICB9LAogIHsKICAgICJleGVyY2lzZV9pZCI6ICI3OTAwOTY5Ny1kODcwLTRiMWUtOTU2Yi1jNWEwOWI5YTk5YzMiLAogICAgInNvdXJjZV9pZCI6IDI3MTM3MDMyMzk4MDU1MywKICAgICJiZWZvcmVfaGFzaCI6ICJlZDYwYmE2NWRiNjJmMjg0MDBmOTUzNzY4ODFlYzQwZGI3ODFmOTg0ZGI0OWQ2YzczN2U5MGZhOTNiMGMwMGZjIiwKICAgICJhZnRlcl9oYXNoIjogIjhhODRiMTFiOGYxNWJlNzc0NjZmZjEyMzk2MTExODA2NTdiYjJmODgwY2ZlYTEzMWE5ZGU3ZWViOTlkNTlmOGMiLAogICAgImV4cGVjdGVkX3VwZGF0ZWRfYXQiOiAiMjAyNi0xMC0xNFQxMDo0Nzo0MC4xNzY2MDIrMDA6MDAiLAogICAgInN0ZXBzIjogWwogICAgICAiU3RhbmQgdXByaWdodC4iLAogICAgICAiUmVhY2ggb3ZlcmhlYWQgd2l0aCB5b3VyIGxlZnQgYXJtIGFuZCBzbG93bHkgbGVhbiB0byB0aGUgcmlnaHQgdW50aWwgeW91IGZlZWwgYSBzdHJldGNoIGluIHlvdXIgb2JsaXF1ZXMuIiwKICAgICAgIkFmdGVyIHlvdXIgZGVzaXJlZCByZXBldGl0aW9ucyBvbiB0aGUgbGVmdCBzaWRlLCBzd2l0Y2ggdG8geW91ciByaWdodCBhcm0gYW5kIGxlYW4gdG8gdGhlIGxlZnQuIgogICAgXQogIH0sCiAgewogICAgImV4ZXJjaXNlX2lkIjogImUzOGM2MTY5LWM1NmMtNDA3NC05YTczLTYzMDM3MTY5ZTU4MiIsCiAgICAic291cmNlX2lkIjogMjExODYwOTI4NzI3MTE4LAogICAgImJlZm9yZV9oYXNoIjogIjcyMzhkNmYwN2E5ZDUzZjZhOTc5YzFhZjcwMTQzZWY5YTQ1OTRmMTAxOWI2YjNkOTlkMmYyMGVkNzZjZTcwYWQiLAogICAgImFmdGVyX2hhc2giOiAiOGZjM2RmYmY1NWI0NGY2ZTkxYmY1MmZjMjZlZmIzYTc4ZmE3YTEwOWJlYTM3OWIwN2M4MTlmYjdhMjViODAxNCIsCiAgICAiZXhwZWN0ZWRfdXBkYXRlZF9hdCI6ICIyMDI2LTEwLTE0VDEwOjQ3OjI4LjAwMzkyMSswMDowMCIsCiAgICAic3RlcHMiOiBbCiAgICAgICJTdGFydCBvbiB5b3VyIGhhbmRzIGFuZCBrbmVlcy4iLAogICAgICAiQnJpbmcgb25lIGtuZWUgZm9yd2FyZCB1bmRlciB5b3VyIGJvZHkgd2hpbGUgZXh0ZW5kaW5nIHRoZSBvdGhlciBsZWcgYmVoaW5kIHlvdS4iLAogICAgICAiUmVhY2ggb25lIGFybSBmb3J3YXJkIGFjcm9zcyB0aGUgbWF0IGFzIHlvdSBsb3dlciB5b3VyIGNoZXN0IHRvd2FyZCB0aGUgZmxvb3IuIiwKICAgICAgIkhvbGQgYXQgdGhlIGRlZXBlc3QgcG9pbnQgb2YgdGhlIHN0cmV0Y2gsIHRoZW4gc2xvd2x5IHJldHVybiB0byB0aGUgc3RhcnRpbmcgcG9zaXRpb24gYW5kIHJlcGVhdCBvbiB0aGUgb3RoZXIgc2lkZS4iCiAgICBdCiAgfQpd', 'base64'), 'UTF8')::jsonb) as payload(
  exercise_id uuid, source_id bigint, before_hash text, after_hash text, expected_updated_at timestamptz, steps jsonb
);

create temp table _noi_gym_restore_translations on commit drop as
select * from jsonb_to_recordset(convert_from(decode('WwogIHsKICAgICJleGVyY2lzZV9pZCI6ICI0OTk4ZTM0Ni01NDYyLTRlZDMtYTU1ZS1lMTdjNzU2NmNhMjMiLAogICAgImxvY2FsZSI6ICJ2aSIsCiAgICAic291cmNlX2xvY2FsZSI6ICJlbiIsCiAgICAic291cmNlX2hhc2giOiAiMWIxZGM0MTljZGQ0ZmQ5MWFkN2ViMjcxNjhlZGZiMGI3Y2ViMTllYzMzZWVjYTk1NmIyMTYwNTZhZjRlNTg1OCIsCiAgICAibmFtZSI6ICJHacOjbiBjxqEgxJHDuWkgdHLGsOG7m2MgYmnhur9uIHRo4buDIGhhaSIsCiAgICAiZGVzY3JpcHRpb24iOiAiIiwKICAgICJzdGVwcyI6IFsKICAgICAgIlbDoG8gdMawIHRo4bq/IGNow7luZyBjaMOibiBxdeG7szogxJHhurd0IGfhu5FpIGNow6JuIHNhdSB4deG7kW5nIHPDoG4sIG11IGLDoG4gY2jDom4gc2F1IHThu7FhIHbDoG8gdMaw4budbmcuIMSQ4bq3dCBiw6BuIGNow6JuIHRyxrDhu5tjIHBo4bqzbmcgdHLDqm4gc8OgbiB2w6AgZ+G6rXAgZ+G7kWkgdHLGsOG7m2Mga2hv4bqjbmcgOTAgxJHhu5kuIiwKICAgICAgIsSQ4bq3dCBoYWkgdGF5IGzDqm4gZ+G7kWkgdHLGsOG7m2MgcuG7k2kgbmdoacOqbmcgbmfGsOG7nWkgduG7gSB0csaw4bubYywgxJHGsGEgZ+G7kWkgduG7gSBwaMOtYSB0csaw4bubYyBxdWEgYsOgbiBjaMOibi4iLAogICAgICAiROG7q25nIOG7nyDEkWnhu4NtIGPEg25nIHPDonUgbmjhuqV0LCBzYXUgxJHDsyB04burIHThu6sgdHLhu58gduG7gSB0xrAgdGjhur8gYmFuIMSR4bqndS4gTOG6t3AgbOG6oWkgduG7m2kgY2jDom4gYsOqbiBraWEuIgogICAgXSwKICAgICJ0cmFuc2xhdGlvbl9zdGF0dXMiOiAicmV2aWV3ZWQiLAogICAgInJldmlld2VkX2F0IjogIjIwMjYtMTAtMjNUMDk6NDY6MzYuNTM4WiIKICB9LAogIHsKICAgICJleGVyY2lzZV9pZCI6ICI3OTAwOTY5Ny1kODcwLTRiMWUtOTU2Yi1jNWEwOWI5YTk5YzMiLAogICAgImxvY2FsZSI6ICJ2aSIsCiAgICAic291cmNlX2xvY2FsZSI6ICJlbiIsCiAgICAic291cmNlX2hhc2giOiAiOGE4NGIxMWI4ZjE1YmU3NzQ2NmZmMTIzOTYxMTE4MDY1N2JiMmY4ODBjZmVhMTMxYTlkZTdlZWI5OWQ1OWY4YyIsCiAgICAibmFtZSI6ICJHacOjbiBjxqEgYuG7pW5nIGJp4bq/biB0aOG7gyBiYSIsCiAgICAiZGVzY3JpcHRpb24iOiAiIiwKICAgICJzdGVwcyI6IFsKICAgICAgIsSQ4bupbmcgdGjhurNuZy4iLAogICAgICAixJDGsGEgdGF5IHRyw6FpIHF1YSDEkeG6p3UgcuG7k2kgbmdoacOqbmcgbmfGsOG7nWkgdOG7qyB04burIHNhbmcgcGjhuqNpIMSR4bq/biBraGkgY+G6o20gdGjhuqV5IGPEg25nIOG7nyBjxqEgY2jDqW8gYuG7pW5nLiIsCiAgICAgICJTYXUga2hpIGhvw6BuIHRow6BuaCBz4buRIGzhuqduIG1vbmcgbXXhu5FuIOG7nyBiw6puIHRyw6FpLCDEkeG7lWkgc2FuZyB0YXkgcGjhuqNpIHbDoCBuZ2hpw6puZyBuZ8aw4budaSBzYW5nIHRyw6FpLiIKICAgIF0sCiAgICAidHJhbnNsYXRpb25fc3RhdHVzIjogInJldmlld2VkIiwKICAgICJyZXZpZXdlZF9hdCI6ICIyMDI2LTEwLTIzVDA5OjQ2OjM2LjUzOFoiCiAgfSwKICB7CiAgICAiZXhlcmNpc2VfaWQiOiAiZTM4YzYxNjktYzU2Yy00MDc0LTlhNzMtNjMwMzcxNjllNTgyIiwKICAgICJsb2NhbGUiOiAidmkiLAogICAgInNvdXJjZV9sb2NhbGUiOiAiZW4iLAogICAgInNvdXJjZV9oYXNoIjogIjhmYzNkZmJmNTViNDRmNmU5MWJmNTJmYzI2ZWZiM2E3OGZhN2ExMDliZWEzNzliMDdjODE5ZmI3YTI1YjgwMTQiLAogICAgIm5hbWUiOiAiR2nDo24gY8ahIG3DtG5nIGJp4bq/biB0aOG7gyBt4buZdCIsCiAgICAiZGVzY3JpcHRpb24iOiAiIiwKICAgICJzdGVwcyI6IFsKICAgICAgIkLhuq90IMSR4bqndSDhu58gdMawIHRo4bq/IGNo4buRbmcgaGFpIHRheSB2w6AgaGFpIGfhu5FpLiIsCiAgICAgICLEkMawYSBt4buZdCBn4buRaSB24buBIHRyxrDhu5tjLCBkxrDhu5tpIHRow6JuIG5nxrDhu51pLCDEkeG7k25nIHRo4budaSBkdeG7l2kgY2jDom4gY8OybiBs4bqhaSByYSBzYXUuIiwKICAgICAgIlbGsMahbiBt4buZdCB0YXkgY2jDqW8gduG7gSB0csaw4bubYyB0csOqbiB0aOG6o20ga2hpIGjhuqEgbmfhu7FjIHh14buRbmcgZ+G6p24gdGjhuqNtLiIsCiAgICAgICJHaeG7ryDhu58gxJFp4buDbSBjxINuZyBzw6J1IG5o4bqldCwgcuG7k2kgdOG7qyB04burIHRy4bufIHbhu4EgdMawIHRo4bq/IGJhbiDEkeG6p3UgdsOgIGzhurdwIGzhuqFpIHbhu5tpIGLDqm4ga2lhLiIKICAgIF0sCiAgICAidHJhbnNsYXRpb25fc3RhdHVzIjogInJldmlld2VkIiwKICAgICJyZXZpZXdlZF9hdCI6ICIyMDI2LTEwLTIzVDA5OjQ2OjM2LjUzOFoiCiAgfQpd', 'base64'), 'UTF8')::jsonb) as payload(
  exercise_id uuid, locale text, source_locale text, source_hash text, name text, description text, steps jsonb, translation_status text, reviewed_at timestamptz
);

create temp table _noi_gym_restore_before on commit drop as
select exercise.* from public.exercises exercise join _noi_gym_restore_sources patch on patch.exercise_id = exercise.id;

do $verify_before$
begin
  if (select count(*) from _noi_gym_restore_sources) <> 3 or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 3
    or (select count(*) from _noi_gym_restore_translations) <> 3 or (select count(*) from _noi_gym_restore_before) <> 3 then
    raise exception 'Unexpected repair scope or wrong Supabase project';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Expected enabled exercise timestamp trigger';
  end if;
  if exists (select 1 from public.exercises e join _noi_gym_restore_sources p on p.exercise_id = e.id
    where e.source <> 'musclewiki' or e.source_id is distinct from p.source_id or e.updated_at is distinct from p.expected_updated_at
      or public.exercise_content_hash(e.name, e.description, e.steps) not in (p.before_hash, p.after_hash)) then
    raise exception 'Source revision changed. Do not overwrite; refresh the prepared repair';
  end if;
  if exists (select 1 from public.exercise_translations c join _noi_gym_restore_sources s on s.exercise_id = c.exercise_id
    left join _noi_gym_restore_translations p on p.exercise_id = c.exercise_id and p.locale = c.locale
    where p.exercise_id is null or c.source_hash is distinct from p.source_hash or c.source_locale is distinct from p.source_locale
      or c.name is distinct from p.name or c.description is distinct from p.description or c.steps is distinct from p.steps
      or c.translation_status is distinct from p.translation_status or c.reviewed_at is distinct from p.reviewed_at) then
    raise exception 'Translation changed during review. Refresh instead of overwriting';
  end if;
end;
$verify_before$;

alter table public.exercises disable trigger exercises_updated_at;
update public.exercises e set steps = p.steps from _noi_gym_restore_sources p
where e.id = p.exercise_id and public.exercise_content_hash(e.name, e.description, e.steps) = p.before_hash;
alter table public.exercises enable trigger exercises_updated_at;

insert into public.exercise_translations (exercise_id, locale, source_locale, source_hash, name, description, steps, translation_status, reviewed_at)
select exercise_id, locale, source_locale, source_hash, name, description, steps, translation_status, reviewed_at
from _noi_gym_restore_translations on conflict (exercise_id, locale) do nothing;

do $verify_after$
begin
  if exists (select 1 from public.exercises e join _noi_gym_restore_sources p on p.exercise_id = e.id
    join _noi_gym_restore_before b on b.id = e.id
    where public.exercise_content_hash(e.name, e.description, e.steps) <> p.after_hash
      or (to_jsonb(e) - 'steps') is distinct from (to_jsonb(b) - 'steps')) then
    raise exception 'Unexpected exercise field or timestamp change; repair rolled back';
  end if;
  if (select count(*) from public.exercise_translations c join _noi_gym_restore_translations p
    on p.exercise_id = c.exercise_id and p.locale = c.locale
    where c.source_hash = p.source_hash and c.name = p.name and c.description = p.description and c.steps = p.steps
      and c.source_locale = p.source_locale and c.translation_status = 'reviewed' and c.reviewed_at = p.reviewed_at) <> 3 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
