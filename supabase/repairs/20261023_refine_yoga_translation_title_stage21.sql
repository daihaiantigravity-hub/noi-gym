-- Refine the Vietnamese label for Double Pigeon after the stage 21 terminology audit.
-- This transaction changes only the translation name and preserves the reviewed steps and timestamp.
begin;
set local lock_timeout = '5s';
lock table public.exercise_translations in share row exclusive mode;

do $verify_before$
begin
  if not exists (
    select 1 from public.exercise_translations
    where exercise_id = '3b04d689-6830-4946-9ea2-f73e926102cb'::uuid and locale = 'vi'
      and source_hash = '1f76192bc1b96f78ffbb54cad57423322e05372e7f35eed68267b419a0c35db5'
      and steps = convert_from(decode('WyJOZ+G7k2kgdHLDqm4gc8OgbiwgZHXhu5dpIGhhaSBjaMOibiB0csaw4bubYyBt4bq3dC4iLCJH4bqtcCBj4bqjIGhhaSBn4buRaSB2w6AgeOG6v3AgaGFpIGPhurNuZyBjaMOibiBjaOG7k25nIGzDqm4gbmhhdSwgxJHGsGEgbeG6r3QgY8OhIGNow6JuIHBow61hIHRyw6puIHbhu4EgZ+G6p24gxJHhuqd1IGfhu5FpIMSR4buRaSBkaeG7h24uIiwiR+G6rXAgbcWpaSBjaMOibiB2w6AgbmjhurkgbmjDoG5nIGjhuqEgaGFpIMSR4bqndSBn4buRaSB24buBIHBow61hIHPDoG4gxJHhu4MgY+G6o20gbmjhuq1uIMSR4buZIGPEg25nIOG7nyBow7RuZy4iLCJHaeG7ryB0xrAgdGjhur8gdHJvbmcgdsOgaSBuaOG7i3AgdGjhu58sIHNhdSDEkcOzIHRo4bqjIHJhIHbDoCBs4bq3cCBs4bqhaSB24bubaSBjaMOibiDEkeG7lWkgYsOqbi4iXQ==', 'base64'), 'UTF8')::jsonb
      and translation_status = 'reviewed'
      and name in ('Tư thế hoa sen đôi', 'Tư thế chim bồ câu đôi')
  ) then
    raise exception 'Double Pigeon translation changed. Refresh the title correction before applying it';
  end if;
end;
$verify_before$;

update public.exercise_translations
set name = 'Tư thế chim bồ câu đôi'
where exercise_id = '3b04d689-6830-4946-9ea2-f73e926102cb'::uuid and locale = 'vi'
  and source_hash = '1f76192bc1b96f78ffbb54cad57423322e05372e7f35eed68267b419a0c35db5'
  and steps = convert_from(decode('WyJOZ+G7k2kgdHLDqm4gc8OgbiwgZHXhu5dpIGhhaSBjaMOibiB0csaw4bubYyBt4bq3dC4iLCJH4bqtcCBj4bqjIGhhaSBn4buRaSB2w6AgeOG6v3AgaGFpIGPhurNuZyBjaMOibiBjaOG7k25nIGzDqm4gbmhhdSwgxJHGsGEgbeG6r3QgY8OhIGNow6JuIHBow61hIHRyw6puIHbhu4EgZ+G6p24gxJHhuqd1IGfhu5FpIMSR4buRaSBkaeG7h24uIiwiR+G6rXAgbcWpaSBjaMOibiB2w6AgbmjhurkgbmjDoG5nIGjhuqEgaGFpIMSR4bqndSBn4buRaSB24buBIHBow61hIHPDoG4gxJHhu4MgY+G6o20gbmjhuq1uIMSR4buZIGPEg25nIOG7nyBow7RuZy4iLCJHaeG7ryB0xrAgdGjhur8gdHJvbmcgdsOgaSBuaOG7i3AgdGjhu58sIHNhdSDEkcOzIHRo4bqjIHJhIHbDoCBs4bq3cCBs4bqhaSB24bubaSBjaMOibiDEkeG7lWkgYsOqbi4iXQ==', 'base64'), 'UTF8')::jsonb
  and translation_status = 'reviewed'
  and name = 'Tư thế hoa sen đôi';

do $verify_after$
begin
  if (select count(*) from public.exercise_translations
      where exercise_id = '3b04d689-6830-4946-9ea2-f73e926102cb'::uuid and locale = 'vi'
        and source_hash = '1f76192bc1b96f78ffbb54cad57423322e05372e7f35eed68267b419a0c35db5'
        and steps = convert_from(decode('WyJOZ+G7k2kgdHLDqm4gc8OgbiwgZHXhu5dpIGhhaSBjaMOibiB0csaw4bubYyBt4bq3dC4iLCJH4bqtcCBj4bqjIGhhaSBn4buRaSB2w6AgeOG6v3AgaGFpIGPhurNuZyBjaMOibiBjaOG7k25nIGzDqm4gbmhhdSwgxJHGsGEgbeG6r3QgY8OhIGNow6JuIHBow61hIHRyw6puIHbhu4EgZ+G6p24gxJHhuqd1IGfhu5FpIMSR4buRaSBkaeG7h24uIiwiR+G6rXAgbcWpaSBjaMOibiB2w6AgbmjhurkgbmjDoG5nIGjhuqEgaGFpIMSR4bqndSBn4buRaSB24buBIHBow61hIHPDoG4gxJHhu4MgY+G6o20gbmjhuq1uIMSR4buZIGPEg25nIOG7nyBow7RuZy4iLCJHaeG7ryB0xrAgdGjhur8gdHJvbmcgdsOgaSBuaOG7i3AgdGjhu58sIHNhdSDEkcOzIHRo4bqjIHJhIHbDoCBs4bq3cCBs4bqhaSB24bubaSBjaMOibiDEkeG7lWkgYsOqbi4iXQ==', 'base64'), 'UTF8')::jsonb
        and translation_status = 'reviewed' and name = 'Tư thế chim bồ câu đôi') <> 1 then
    raise exception 'Double Pigeon title correction failed';
  end if;
end;
$verify_after$;
commit;

select exercise_id, name, source_hash, translation_status
from public.exercise_translations
where exercise_id = '3b04d689-6830-4946-9ea2-f73e926102cb'::uuid and locale = 'vi';
