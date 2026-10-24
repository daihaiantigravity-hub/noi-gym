-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Correct 2 Yoga instruction sources and insert 2 reviewed VI translations.
-- Re-running is safe. Only exercise.steps changes; timestamps and all other fields are preserved.
-- Temporary tables drop at commit.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_restore_sources on commit drop as
select * from jsonb_to_recordset(convert_from(decode('WwogIHsKICAgICJleGVyY2lzZV9pZCI6ICIzYjA0ZDY4OS02ODMwLTQ5NDYtOWVhMi1mNzNlOTI2MTAyY2IiLAogICAgInNvdXJjZV9pZCI6IDkwNDQwNzg5ODI1MjY5LAogICAgImJlZm9yZV9oYXNoIjogIjc0NzFhMjI5NzdhMmZhNzgzNmU4ODUwNTA0YjBhN2VjMjEwZTM0Zjg2ZjYwZmUzMzUyMmZmMDZjYzQyYmJlZDEiLAogICAgImFmdGVyX2hhc2giOiAiMWY3NjE5MmJjMWI5NmY3OGZmYmI1NGNhZDU3NDIzMzIyZTA1MzcyZTdmMzVlZWQ2ODI2N2I0MTlhMGMzNWRiNSIsCiAgICAiZXhwZWN0ZWRfdXBkYXRlZF9hdCI6ICIyMDI2LTEwLTE0VDEwOjQ3OjAzLjY0MTQ0MSswMDowMCIsCiAgICAic3RlcHMiOiBbCiAgICAgICJTaXQgb24gdGhlIGdyb3VuZCB3aXRoIHlvdXIgbGVncyBleHRlbmRlZCBpbiBmcm9udCBvZiB5b3UuIiwKICAgICAgIkJlbmQgYm90aCBrbmVlcyBhbmQgc3RhY2sgeW91ciBzaGlucywgYnJpbmdpbmcgdGhlIHRvcCBhbmtsZSB0b3dhcmQgdGhlIG9wcG9zaXRlIGtuZWUuIiwKICAgICAgIkZsZXggYm90aCBmZWV0IGFuZCBnZW50bHkgbG93ZXIgeW91ciBrbmVlcyB0b3dhcmQgdGhlIGdyb3VuZCwgZmVlbGluZyBhIHN0cmV0Y2ggaW4geW91ciBoaXBzLiIsCiAgICAgICJIb2xkIHRoZSBwb3NlIGZvciBhIGZldyBicmVhdGhzLCB0aGVuIHJlbGVhc2UgYW5kIHJlcGVhdCBvbiB0aGUgb3RoZXIgc2lkZS4iCiAgICBdCiAgfSwKICB7CiAgICAiZXhlcmNpc2VfaWQiOiAiYmQ4NDNkNjgtN2Y1ZC00ZGNjLWE4NzAtZTgzOTQyN2ExMGEzIiwKICAgICJzb3VyY2VfaWQiOiAyNjkxOTU2MDAwOTUwOSwKICAgICJiZWZvcmVfaGFzaCI6ICJhMTcyY2JhY2VmMjI3ZWQ3ZWJlNTY5YTZlYzcwN2QxODJlYzI2NDA0OTQ5MDMxMGZlMDJkMjQ0NGJmZjVlMWQwIiwKICAgICJhZnRlcl9oYXNoIjogIjhhMGZiYjZlMjMyYjU0ODExMGI0YjA5MzAyOTZhMTAwNTNiZGM5YjA1MjAyZmM1NjZmOTg4MTVlZDgyN2Y1M2MiLAogICAgImV4cGVjdGVkX3VwZGF0ZWRfYXQiOiAiMjAyNi0xMC0xNFQxMDo0Njo0OS4xMTAzMzMrMDA6MDAiLAogICAgInN0ZXBzIjogWwogICAgICAiU2l0IG9uIGEgeW9nYSBtYXQgd2l0aCB5b3VyIGxlZ3MgZXh0ZW5kZWQgaW4gZnJvbnQgb2YgeW91LiIsCiAgICAgICJCZW5kIG9uZSBrbmVlIGFuZCBwbGFjZSB0aGF0IGZvb3Qgb24gdGhlIG9wcG9zaXRlIHRoaWdoLCBhbGxvd2luZyB0aGUga25lZSB0byBsb3dlciBjb21mb3J0YWJseS4iLAogICAgICAiS2VlcCB5b3VyIG90aGVyIGxlZyBleHRlbmRlZCBvbiB0aGUgbWF0LCBzaXQgdXByaWdodCwgYW5kIHJlc3QgeW91ciBoYW5kcyBvbiB5b3VyIHRoaWdocy4iLAogICAgICAiSG9sZCBmb3Igc2V2ZXJhbCBicmVhdGhzIGFuZCB0aGVuIHJlbGVhc2UuIgogICAgXQogIH0KXQ==', 'base64'), 'UTF8')::jsonb) as payload(
  exercise_id uuid, source_id bigint, before_hash text, after_hash text, expected_updated_at timestamptz, steps jsonb
);

create temp table _noi_gym_restore_translations on commit drop as
select * from jsonb_to_recordset(convert_from(decode('WwogIHsKICAgICJleGVyY2lzZV9pZCI6ICIzYjA0ZDY4OS02ODMwLTQ5NDYtOWVhMi1mNzNlOTI2MTAyY2IiLAogICAgImxvY2FsZSI6ICJ2aSIsCiAgICAic291cmNlX2xvY2FsZSI6ICJlbiIsCiAgICAic291cmNlX2hhc2giOiAiMWY3NjE5MmJjMWI5NmY3OGZmYmI1NGNhZDU3NDIzMzIyZTA1MzcyZTdmMzVlZWQ2ODI2N2I0MTlhMGMzNWRiNSIsCiAgICAibmFtZSI6ICJUxrAgdGjhur8gaG9hIHNlbiDEkcO0aSIsCiAgICAiZGVzY3JpcHRpb24iOiAiIiwKICAgICJzdGVwcyI6IFsKICAgICAgIk5n4buTaSB0csOqbiBzw6BuLCBkdeG7l2kgaGFpIGNow6JuIHRyxrDhu5tjIG3hurd0LiIsCiAgICAgICJH4bqtcCBj4bqjIGhhaSBn4buRaSB2w6AgeOG6v3AgaGFpIGPhurNuZyBjaMOibiBjaOG7k25nIGzDqm4gbmhhdSwgxJHGsGEgbeG6r3QgY8OhIGNow6JuIHBow61hIHRyw6puIHbhu4EgZ+G6p24gxJHhuqd1IGfhu5FpIMSR4buRaSBkaeG7h24uIiwKICAgICAgIkfhuq1wIG3FqWkgY2jDom4gdsOgIG5o4bq5IG5ow6BuZyBo4bqhIGhhaSDEkeG6p3UgZ+G7kWkgduG7gSBwaMOtYSBzw6BuIMSR4buDIGPhuqNtIG5o4bqtbiDEkeG7mSBjxINuZyDhu58gaMO0bmcuIiwKICAgICAgIkdp4buvIHTGsCB0aOG6vyB0cm9uZyB2w6BpIG5o4buLcCB0aOG7nywgc2F1IMSRw7MgdGjhuqMgcmEgdsOgIGzhurdwIGzhuqFpIHbhu5tpIGNow6JuIMSR4buVaSBiw6puLiIKICAgIF0sCiAgICAidHJhbnNsYXRpb25fc3RhdHVzIjogInJldmlld2VkIiwKICAgICJyZXZpZXdlZF9hdCI6ICIyMDI2LTEwLTIzVDEwOjA2OjMzLjIzMVoiCiAgfSwKICB7CiAgICAiZXhlcmNpc2VfaWQiOiAiYmQ4NDNkNjgtN2Y1ZC00ZGNjLWE4NzAtZTgzOTQyN2ExMGEzIiwKICAgICJsb2NhbGUiOiAidmkiLAogICAgInNvdXJjZV9sb2NhbGUiOiAiZW4iLAogICAgInNvdXJjZV9oYXNoIjogIjhhMGZiYjZlMjMyYjU0ODExMGI0YjA5MzAyOTZhMTAwNTNiZGM5YjA1MjAyZmM1NjZmOTg4MTVlZDgyN2Y1M2MiLAogICAgIm5hbWUiOiAiVMawIHRo4bq/IGhvYSBzZW4gYsOhbiBwaOG6p24iLAogICAgImRlc2NyaXB0aW9uIjogIiIsCiAgICAic3RlcHMiOiBbCiAgICAgICJOZ+G7k2kgdHLDqm4gdGjhuqNtLCBkdeG7l2kgaGFpIGNow6JuIHJhIHRyxrDhu5tjLiIsCiAgICAgICJH4bqtcCBt4buZdCBn4buRaSwgxJHhurd0IGLDoG4gY2jDom4gxJHDsyBsw6puIMSRw7lpIGNow6JuIMSR4buRaSBkaeG7h247IMSR4buDIGfhu5FpIGjhuqEgeHXhu5FuZyB0cm9uZyBwaOG6oW0gdmkgdGhv4bqjaSBtw6FpLiIsCiAgICAgICJHaeG7ryBjaMOibiBjw7JuIGzhuqFpIGR14buXaSB0csOqbiB0aOG6o20sIG5n4buTaSB0aOG6s25nIGzGsG5nIHbDoCDEkeG6t3QgaGFpIHRheSBsw6puIMSRw7lpLiIsCiAgICAgICJHaeG7ryB0cm9uZyB2w6BpIG5o4buLcCB0aOG7nyBy4buTaSB0aOG6oyBs4buPbmcuIgogICAgXSwKICAgICJ0cmFuc2xhdGlvbl9zdGF0dXMiOiAicmV2aWV3ZWQiLAogICAgInJldmlld2VkX2F0IjogIjIwMjYtMTAtMjNUMTA6MDY6MzMuMjMxWiIKICB9Cl0=', 'base64'), 'UTF8')::jsonb) as payload(
  exercise_id uuid, locale text, source_locale text, source_hash text, name text, description text, steps jsonb, translation_status text, reviewed_at timestamptz
);

create temp table _noi_gym_restore_before on commit drop as
select exercise.* from public.exercises exercise join _noi_gym_restore_sources patch on patch.exercise_id = exercise.id;

do $verify_before$
begin
  if (select count(*) from _noi_gym_restore_sources) <> 2 or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 2
    or (select count(*) from _noi_gym_restore_translations) <> 2 or (select count(*) from _noi_gym_restore_before) <> 2 then
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
      and c.source_locale = p.source_locale and c.translation_status = 'reviewed' and c.reviewed_at = p.reviewed_at) <> 2 then
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
