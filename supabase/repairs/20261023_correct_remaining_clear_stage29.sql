-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Correct five source sequences confirmed against original front/side videos and add reviewed Vietnamese translations.
-- Run the whole file. It is idempotent and refuses to overwrite a changed revision.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_restore_sources on commit drop as
select * from jsonb_to_recordset($noi_gym_sources$[{"exercise_id":"c15c48e4-3318-4b63-ac31-22a315943752","source_id":72053964370442,"before_hash":"977ace9e465ddafc8ffa36d7c5ae949434b39b39fd3b31206a48f0858378ef34","after_hash":"3ebb7611f09f1b3e75e16f805ab7d9bc7210056d485548bd4dca5b565fa8d97e","expected_updated_at":"2026-10-14T10:46:59.734066+00:00","steps":["Stand with both forefeet on the edge of a step and hold a wall for balance.","Quickly raise both heels to the top position.","Pause briefly, then slowly lower both heels below the step until you feel a stretch in your calves.","Pause at both ends of the range."]},{"exercise_id":"443b5ff2-5934-44f8-a10e-685bf0a7d708","source_id":146788599012127,"before_hash":"59ff5f67a1b0ed3629a2638b6b49df706ba2d714f983025690037cfbd7b22743","after_hash":"e4648f59c209044a649b6f56533b0184a33ab7748551ff530471d81d0c1bc348","expected_updated_at":"2026-10-14T10:47:14.695623+00:00","steps":["Lie on your back on the carriage with your knees bent and feet hip-width apart on the footbar; keep your hips slightly off the carriage.","Engage your core and glutes, then press through your heels to move the carriage.","Keep your hips lifted and stable as you press."]},{"exercise_id":"ff0457f4-54bb-48e6-84e3-e8a66867688b","source_id":184283879469673,"before_hash":"58eecd53a19712396ce3b7eb388116d52a83d1319ba99b5e0e53a381f0b55f3a","after_hash":"5e82dcafd565643033a525678eca748837792fc1d8f2035b3b5996bcff135db3","expected_updated_at":"2026-10-14T10:47:23.215797+00:00","steps":["Lie flat on your back with your arms by your sides and both knees bent.","Extend one leg and bend the other, crossing the bent knee over the straight leg.","Rotate your hips so the bent knee moves toward the floor to the side, keeping the straight leg flat.","Pause at the end of the stretch, then repeat with the other leg."]},{"exercise_id":"94fa27d3-e887-4289-ac56-57f2cae2101e","source_id":170991639200362,"before_hash":"f787b1a9e4d316847c675f5d926e673f6756d1bd17dac2192701defba7326ed1","after_hash":"0a0d648315004e959825ff70bd81836e842ba84651ee731808477eb41b024dc3","expected_updated_at":"2026-10-14T10:47:20.141913+00:00","steps":["Stand tall with your feet hip-width apart and your back in a neutral position.","Push your hips back and hinge your torso forward while keeping your back straight.","Reach toward your toes and perform small controlled bounces within a comfortable range.","Return to standing; your range depends on your hamstring flexibility."]},{"exercise_id":"9c3889b0-767c-479e-a1d3-bde7fd252e04","source_id":271154191783137,"before_hash":"1a619c19166f419364c721dc313b602f25d120f65a24e9f63a0587fd287f4a7d","after_hash":"0fad71722f06a5644dca37e69c3f147d7130eb142938410fca0ec4ae81b0d42f","expected_updated_at":"2026-10-14T10:47:40.173266+00:00","steps":["Stand with your feet hip-width apart and place a kettlebell on the floor beside one foot.","Hinge forward with a flat back and pick up the kettlebell with one hand.","Stand tall holding it at your side, keeping your torso level and avoiding a side lean."]}]$noi_gym_sources$::jsonb) as payload(
  exercise_id uuid, source_id bigint, before_hash text, after_hash text,
  expected_updated_at timestamptz, steps jsonb
);

create temp table _noi_gym_restore_translations on commit drop as
select * from jsonb_to_recordset($noi_gym_translations$[{"exercise_id":"c15c48e4-3318-4b63-ac31-22a315943752","locale":"vi","source_locale":"en","source_hash":"3ebb7611f09f1b3e75e16f805ab7d9bc7210056d485548bd4dca5b565fa8d97e","name":"Nâng bắp chân 1C lệch tâm hai chân trên bục","description":"","steps":["Đặt phần trước của cả hai bàn chân trên mép bục và vịn tường để giữ thăng bằng.","Nhanh chóng nâng cả hai gót chân lên vị trí cao nhất.","Giữ ngắn, sau đó từ từ hạ cả hai gót xuống dưới mặt bục cho đến khi cảm thấy căng bắp chân.","Tạm dừng ở cả hai điểm cuối biên độ."],"translation_status":"reviewed","reviewed_at":"2026-10-23T15:40:22.785Z"},{"exercise_id":"443b5ff2-5934-44f8-a10e-685bf0a7d708","locale":"vi","source_locale":"en","source_hash":"e4648f59c209044a649b6f56533b0184a33ab7748551ff530471d81d0c1bc348","name":"Nâng hông","description":"","steps":["Nằm ngửa trên bệ trượt, gập gối và đặt hai bàn chân rộng bằng hông trên thanh đạp; giữ hông hơi nhấc khỏi bệ.","Siết cơ bụng và cơ mông, sau đó dùng gót chân đạp thanh để di chuyển bệ trượt.","Giữ hông nâng và ổn định trong khi đạp."],"translation_status":"reviewed","reviewed_at":"2026-10-23T15:40:22.790Z"},{"exercise_id":"ff0457f4-54bb-48e6-84e3-e8a66867688b","locale":"vi","source_locale":"en","source_hash":"5e82dcafd565643033a525678eca748837792fc1d8f2035b3b5996bcff135db3","name":"Giãn lưng dưới biến thể 2","description":"","steps":["Nằm ngửa, duỗi hai tay dọc theo thân và gập cả hai gối.","Duỗi một chân, gập chân kia và đưa gối chân gập bắt chéo qua chân duỗi.","Xoay hông để gối chân gập hạ về phía sàn bên cạnh, giữ chân duỗi áp trên sàn.","Giữ ở cuối biên độ giãn, sau đó đổi bên."],"translation_status":"reviewed","reviewed_at":"2026-10-23T15:40:22.790Z"},{"exercise_id":"94fa27d3-e887-4289-ac56-57f2cae2101e","locale":"vi","source_locale":"en","source_hash":"0a0d648315004e959825ff70bd81836e842ba84651ee731808477eb41b024dc3","name":"Gập người deadlift nhún giãn cơ","description":"","steps":["Đứng thẳng, hai chân rộng bằng hông và giữ lưng ở tư thế trung lập.","Đẩy hông ra sau, gập thân người về trước và giữ lưng thẳng.","Vươn về phía các ngón chân và thực hiện những nhịp nhún nhỏ có kiểm soát trong biên độ thoải mái.","Trở lại tư thế đứng; biên độ phụ thuộc vào độ linh hoạt của gân kheo."],"translation_status":"reviewed","reviewed_at":"2026-10-23T15:40:22.790Z"},{"exercise_id":"9c3889b0-767c-479e-a1d3-bde7fd252e04","locale":"vi","source_locale":"en","source_hash":"0fad71722f06a5644dca37e69c3f147d7130eb142938410fca0ec4ae81b0d42f","name":"Ổn định cơ trung tâm chéo bên với tạ ấm một tay","description":"","steps":["Đứng hai chân rộng bằng hông và đặt tạ ấm trên sàn bên cạnh một bàn chân.","Gập hông với lưng thẳng và nhấc tạ ấm bằng một tay.","Đứng thẳng, giữ tạ bên thân, giữ thân người cân bằng và không nghiêng sang một bên."],"translation_status":"reviewed","reviewed_at":"2026-10-23T15:40:22.790Z"}]$noi_gym_translations$::jsonb) as payload(
  exercise_id uuid, locale text, source_locale text, source_hash text,
  name text, description text, steps jsonb, translation_status text, reviewed_at timestamptz
);

create temp table _noi_gym_restore_before on commit drop as
select exercise.* from public.exercises as exercise
join _noi_gym_restore_sources as patch on patch.exercise_id = exercise.id;

do $verify_before$
begin
  if (select count(*) from _noi_gym_restore_sources) <> 5
    or (select count(*) from _noi_gym_restore_translations) <> 5
    or (select count(*) from _noi_gym_restore_before) <> 5 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 5 then
    raise exception 'Incomplete translation import; transaction rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this repair: 1,935 reviewed (1,934 Vietnamese; 1 English).
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
