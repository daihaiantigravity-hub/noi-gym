-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Correct 2 Yoga instruction sources and insert 2 reviewed VI translations.
-- Only exercise.steps changes; timestamps and all other fields are verified and preserved.
-- Temporary tables drop at commit.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_stage22_sources on commit drop as
select * from jsonb_to_recordset(convert_from(decode('WwogIHsKICAgICJleGVyY2lzZV9pZCI6ICIxNmIzMjMyMC0yNjlhLTRjNTEtYjhjZS0xYjliODY5M2M0YTYiLAogICAgInNvdXJjZV9pZCI6IDEyMzQ4MTU5MjUwNDA4OSwKICAgICJiZWZvcmVfaGFzaCI6ICJmMzU5ZTIwYmQyZTc4MmEwMWU1ZjQ0Yjc1MzYzYjkxYWFlNDg2MTk1M2M3ZTE0NTU5YjBhYzc2YmYxNDUzMTgxIiwKICAgICJhZnRlcl9oYXNoIjogIjdjZThiMzI0MTIyYjY1ZmQ2MWExODIyMmJiYmQ1ODYxMDgwNGM5NTc5OWM0YzRmZDg0MjJiZjM5OWQwNWE5NjkiLAogICAgImV4cGVjdGVkX3VwZGF0ZWRfYXQiOiAiMjAyNi0xMC0xNFQxMDo0NzoxMC41NzMzKzAwOjAwIiwKICAgICJzdGVwcyI6IFsKICAgICAgIkNvbWUgb250byB5b3VyIGhhbmRzIGFuZCBrbmVlcyBvbiB0aGUgbWF0IHdpdGggeW91ciB3cmlzdHMgZGlyZWN0bHkgdW5kZXIgeW91ciBzaG91bGRlcnMgYW5kIHlvdXIga25lZXMgdW5kZXIgeW91ciBoaXBzLiIsCiAgICAgICJUdXJuIHlvdXIgcGFsbXMgc28geW91ciBmaW5nZXJ0aXBzIHBvaW50IHRvd2FyZCB5b3VyIGtuZWVzLCBhbmQgc3ByZWFkIHlvdXIgZmluZ2VycyB3aWRlLiIsCiAgICAgICJQcmVzcyBpbnRvIHlvdXIgcGFsbXMgYW5kIGV4dGVuZCB5b3VyIGFybXMgZnVsbHkgdG8gbGlmdCB5b3VyIHNob3VsZGVycyBhd2F5IGZyb20geW91ciBlYXJzLiIsCiAgICAgICJIb2xkIHRoZSBwb3NlIGZvciBhIGZldyBicmVhdGhzLCB0aGVuIHJldHVybiB5b3VyIGhhbmRzIHRvIHRoZSBuZXV0cmFsIHRhYmxldG9wIHBvc2l0aW9uIHRvIHJlbGVhc2UuIgogICAgXQogIH0sCiAgewogICAgImV4ZXJjaXNlX2lkIjogImJhZWYyMmViLTg0NTQtNDZjZC05NjM5LTRmY2UyYzc2NTQ1YSIsCiAgICAic291cmNlX2lkIjogMTQzMzMyOTkwNjU5MTA5LAogICAgImJlZm9yZV9oYXNoIjogIjE0MWY3NTkxN2RmOGU5ZDI1NjQ0ZTU2YmNhMmU3YTc0MzMxNzY4ZGNlZTdiNDhiOGE4YWEwZjIzMzM5OWM3OWIiLAogICAgImFmdGVyX2hhc2giOiAiOWQzOTI0YjkwODk5NDg0NGE2NTQ5Njg5ZDE4OWIzYjA2NDg0ZjA5OGQyMzJiNzExYTVmZjRhNmRjMDBmYTMxYyIsCiAgICAiZXhwZWN0ZWRfdXBkYXRlZF9hdCI6ICIyMDI2LTEwLTE0VDEwOjQ3OjE0LjE0ODU0NyswMDowMCIsCiAgICAic3RlcHMiOiBbCiAgICAgICJCZWdpbiBpbiBDcmVzY2VudCBNb29uIFBvc2Ugd2l0aCB5b3VyIHJpZ2h0IGZvb3QgZm9yd2FyZCBhbmQgYSBibG9jayBuZWFyYnkgZm9yIHN1cHBvcnQgaWYgbmVlZGVkLiIsCiAgICAgICJCZW5kIHlvdXIgbGVmdCBrbmVlIGFuZCByZWFjaCB5b3VyIGxlZnQgaGFuZCBiZWhpbmQgeW91IHRvIGhvbGQgeW91ciBsZWZ0IGZvb3Qgb3IgYW5rbGUuIiwKICAgICAgIkdlbnRseSBkcmF3IHlvdXIgbGVmdCBoZWVsIHRvd2FyZCB5b3VyIGJ1dHRvY2sgdG8gc3RyZXRjaCB5b3VyIGxlZnQgcXVhZHJpY2Vwcy4iLAogICAgICAiVXNlIHlvdXIgZnJlZSBoYW5kIG9uIHlvdXIgZnJvbnQgdGhpZ2ggb3IgYSBibG9jayB0byBzdGVhZHkgeW91cnNlbGYuIEhvbGQgZm9yIGEgZmV3IGJyZWF0aHMsIHRoZW4gcmVsZWFzZSBhbmQgcmVwZWF0IG9uIHRoZSBvdGhlciBzaWRlLiIKICAgIF0KICB9Cl0=', 'base64'), 'UTF8')::jsonb) as payload(
  exercise_id uuid, source_id bigint, before_hash text, after_hash text, expected_updated_at timestamptz, steps jsonb
);
create temp table _noi_gym_stage22_translations on commit drop as
select * from jsonb_to_recordset(convert_from(decode('WwogIHsKICAgICJleGVyY2lzZV9pZCI6ICIxNmIzMjMyMC0yNjlhLTRjNTEtYjhjZS0xYjliODY5M2M0YTYiLAogICAgImxvY2FsZSI6ICJ2aSIsCiAgICAic291cmNlX2xvY2FsZSI6ICJlbiIsCiAgICAic291cmNlX2hhc2giOiAiN2NlOGIzMjQxMjJiNjVmZDYxYTE4MjIyYmJiZDU4NjEwODA0Yzk1Nzk5YzRjNGZkODQyMmJmMzk5ZDA1YTk2OSIsCiAgICAibmFtZSI6ICJUxrAgdGjhur8gbeG6t3QgYsOgbiBiaeG6v24gdGjhu4MgMyIsCiAgICAiZGVzY3JpcHRpb24iOiAiIiwKICAgICJzdGVwcyI6IFsKICAgICAgIkNo4buRbmcgaGFpIHRheSB2w6AgcXXhu7MgdHLDqm4gdGjhuqNtLCDEkeG6t3QgY+G7lSB0YXkgbmdheSBkxrDhu5tpIHZhaSB2w6AgxJHhuqd1IGfhu5FpIGTGsOG7m2kgaMO0bmcuIiwKICAgICAgIlhvYXkgaGFpIGLDoG4gdGF5IMSR4buDIGPDoWMgxJHhuqd1IG5nw7NuIHRheSBoxrDhu5tuZyB24buBIHBow61hIMSR4bqndSBn4buRaSwgxJHhu5NuZyB0aOG7nWkgeMOyZSBy4buZbmcgY8OhYyBuZ8OzbiB0YXkuIiwKICAgICAgIuG6pG4gbMOybmcgYsOgbiB0YXkgeHXhu5FuZyB0aOG6o20gdsOgIGR14buXaSB0aOG6s25nIGhhaSBjw6FuaCB0YXksIGdp4buvIHZhaSB0csOhbmggbmjDum4gbMOqbiBzw6F0IHRhaS4iLAogICAgICAiR2nhu68gdMawIHRo4bq/IHRyb25nIHbDoGkgbmjhu4twIHRo4bufLCBzYXUgxJHDsyDEkcawYSBoYWkgYsOgbiB0YXkgduG7gSB24buLIHRyw60gY2jhu5FuZyBiw6BuIHRydW5nIHTDrW5oIMSR4buDIHRo4bqjIGzhu49uZy4iCiAgICBdLAogICAgInRyYW5zbGF0aW9uX3N0YXR1cyI6ICJyZXZpZXdlZCIsCiAgICAicmV2aWV3ZWRfYXQiOiAiMjAyNi0xMC0yM1QxMDozMjozNy40OTFaIgogIH0sCiAgewogICAgImV4ZXJjaXNlX2lkIjogImJhZWYyMmViLTg0NTQtNDZjZC05NjM5LTRmY2UyYzc2NTQ1YSIsCiAgICAibG9jYWxlIjogInZpIiwKICAgICJzb3VyY2VfbG9jYWxlIjogImVuIiwKICAgICJzb3VyY2VfaGFzaCI6ICI5ZDM5MjRiOTA4OTk0ODQ0YTY1NDk2ODlkMTg5YjNiMDY0ODRmMDk4ZDIzMmI3MTFhNWZmNGE2ZGMwMGZhMzFjIiwKICAgICJuYW1lIjogIlTGsCB0aOG6vyB0csSDbmcgbMaw4buhaSBsaeG7gW0ga8OpbyBnacOjbiBjxqEgdOG7qSDEkeG6p3UgxJHDuWkiLAogICAgImRlc2NyaXB0aW9uIjogIiIsCiAgICAic3RlcHMiOiBbCiAgICAgICJC4bqvdCDEkeG6p3Ug4bufIHTGsCB0aOG6vyBDaMO5bmcgY2jDom4gdHLEg25nIGzGsOG7oWkgbGnhu4FtLCDEkeG6t3QgY2jDom4gcGjhuqNpIHBow61hIHRyxrDhu5tjIHbDoCDEkeG7gyBraOG7kWkga8OqIOG7nyBn4bqnbiBu4bq/dSBj4bqnbiBo4buXIHRy4bujLiIsCiAgICAgICJH4bqtcCBn4buRaSB0csOhaSwgxJHGsGEgdGF5IHRyw6FpIHJhIHNhdSDEkeG7gyBu4bqvbSBiw6BuIGNow6JuIGhv4bq3YyBj4buVIGNow6JuIHRyw6FpLiIsCiAgICAgICJOaOG6uSBuaMOgbmcga8OpbyBnw7N0IGNow6JuIHRyw6FpIHbhu4EgcGjDrWEgbcO0bmcgxJHhu4Mga8OpbyBnacOjbiBjxqEgdOG7qSDEkeG6p3UgxJHDuWkgdHLDoWkuIiwKICAgICAgIkTDuW5nIHRheSBjw7JuIGzhuqFpIHThu7FhIGzDqm4gxJHDuWkgdHLGsOG7m2MgaG/hurdjIGto4buRaSBrw6ogxJHhu4MgZ2nhu68gdGjEg25nIGLhurFuZy4gR2nhu68gdsOgaSBuaOG7i3AgdGjhu58sIHNhdSDEkcOzIHRo4bqjIHJhIHbDoCBs4bq3cCBs4bqhaSDhu58gYsOqbiBraWEuIgogICAgXSwKICAgICJ0cmFuc2xhdGlvbl9zdGF0dXMiOiAicmV2aWV3ZWQiLAogICAgInJldmlld2VkX2F0IjogIjIwMjYtMTAtMjNUMTA6MzI6MzcuNDkxWiIKICB9Cl0=', 'base64'), 'UTF8')::jsonb) as payload(
  exercise_id uuid, locale text, source_locale text, source_hash text, name text, description text, steps jsonb, translation_status text, reviewed_at timestamptz
);
create temp table _noi_gym_stage22_before on commit drop as
select e.* from public.exercises e join _noi_gym_stage22_sources p on p.exercise_id = e.id;

do $verify_before$
begin
  if (select count(*) from _noi_gym_stage22_sources) <> 2
    or (select count(distinct exercise_id) from _noi_gym_stage22_sources) <> 2
    or (select count(*) from _noi_gym_stage22_translations) <> 2
    or (select count(*) from _noi_gym_stage22_before) <> 2 then
    raise exception 'Unexpected repair scope or wrong Supabase project';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Expected enabled exercise timestamp trigger';
  end if;
  if exists (select 1 from public.exercises e join _noi_gym_stage22_sources p on p.exercise_id = e.id
    where e.source <> 'musclewiki' or e.source_id is distinct from p.source_id or e.updated_at is distinct from p.expected_updated_at
      or public.exercise_content_hash(e.name, e.description, e.steps) not in (p.before_hash, p.after_hash)) then
    raise exception 'Source revision changed. Refresh the prepared repair instead of overwriting';
  end if;
  if exists (select 1 from public.exercise_translations c join _noi_gym_stage22_sources p on p.exercise_id = c.exercise_id
    where c.locale = 'vi') then
    raise exception 'A Vietnamese translation appeared during review. Refresh instead of overwriting';
  end if;
end;
$verify_before$;

alter table public.exercises disable trigger exercises_updated_at;
update public.exercises e set steps = p.steps from _noi_gym_stage22_sources p
where e.id = p.exercise_id and public.exercise_content_hash(e.name, e.description, e.steps) = p.before_hash;
alter table public.exercises enable trigger exercises_updated_at;

insert into public.exercise_translations (exercise_id, locale, source_locale, source_hash, name, description, steps, translation_status, reviewed_at)
select exercise_id, locale, source_locale, source_hash, name, description, steps, translation_status, reviewed_at
from _noi_gym_stage22_translations;

do $verify_after$
begin
  if exists (select 1 from public.exercises e join _noi_gym_stage22_sources p on p.exercise_id = e.id
    join _noi_gym_stage22_before b on b.id = e.id
    where public.exercise_content_hash(e.name, e.description, e.steps) <> p.after_hash
      or (to_jsonb(e) - 'steps') is distinct from (to_jsonb(b) - 'steps')) then
    raise exception 'Unexpected exercise field or timestamp change; repair rolled back';
  end if;
  if (select count(*) from public.exercise_translations c join _noi_gym_stage22_translations p
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
