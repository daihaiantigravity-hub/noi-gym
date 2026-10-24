-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 8 reviewed instruction corrections and insert 8 reviewed VI translations.
-- Run the WHOLE file in a new SQL Editor query. Re-running it is safe.
-- Only exercise.steps changes; media, names, categories and timestamps are preserved.
-- The timestamp trigger alone is suspended inside this transaction; RLS and
-- translation validation/staleness triggers remain enabled. Errors roll back all changes.

begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;

create temp table _noi_gym_restore_sources on commit drop as
select * from jsonb_to_recordset($noi_gym_sources$
[
  {
    "exercise_id": "07c8b8ae-c0e7-4dcb-82db-dba648b2f6e5",
    "source_id": 177221108532512,
    "before_hash": "4c598db47dba2d04373762784d75b4c1d7ad67278d9c2476093a43fed849139e",
    "after_hash": "ea14a5b60f159615fec414120f3c3e0d2aa432602131dfd4e24980aa112e667c",
    "expected_updated_at": "2026-10-14T10:47:21.641379+00:00",
    "steps": [
      "Start in a forearm plank with your elbows farther forward than your shoulders, until your ears are between your biceps. Support your body on your forearms and toes.",
      "Hold in this position for the allotted amount of time.",
      "Make sure you keep a flat back for the whole set."
    ]
  },
  {
    "exercise_id": "090000cf-7975-47eb-98ea-1c8bdb29653d",
    "source_id": 170325139663590,
    "before_hash": "53378fb2c3fc334612e1a0bc65785b51d3b436ee92802c38311ccd6556cc3b79",
    "after_hash": "094a0dd9dfa7d6edc2891cdf5a0164df0492cbfb9897190c748cce9dcd5e52a7",
    "expected_updated_at": "2026-10-14T10:47:19.928139+00:00",
    "steps": [
      "Start by sitting on a bench with one kettlebell resting on each thigh near your knees. Your feet should be flat on the ground, about hip-width apart.",
      "Hold the kettlebells steady with your hands and lift your heels off the ground.",
      "Hold this position for a moment, then slowly lower your heels back to the ground."
    ]
  },
  {
    "exercise_id": "1990c31f-1797-420b-95c7-b1f7e84d0e79",
    "source_id": 81259791125914,
    "before_hash": "181bceb45ff66107e2bd5b55457b681b7a22f8da675654039506e510e46c2344",
    "after_hash": "ca7a35b5b555534244bf1839b32f537ee152eb8ccfaa5c48d29d63a38935a667",
    "expected_updated_at": "2026-10-14T10:47:01.570923+00:00",
    "steps": [
      "Place your foot on a plate or a low box. Hold one kettlebell in each hand.",
      "Put all of your weight on your front foot and lean forward.",
      "Lower until your calves touch your hamstrings and then extend back up."
    ]
  },
  {
    "exercise_id": "1c3f8472-f46d-4425-b75a-067d22be80ea",
    "source_id": 184352009603150,
    "before_hash": "e326eb3b79dc03e4d0b53505ce3056f4c2f2c0a4c3145115bfb49fb404e4298d",
    "after_hash": "694b5d989d50f1ada954250d97b07052f0ab4f1af5ead88c9c9521621d97910c",
    "expected_updated_at": "2026-10-14T10:47:23.208864+00:00",
    "steps": [
      "To perform a bodyweight mountain climber, start in a plank position with your hands placed directly under your shoulders.",
      "Slowly bring your right knee towards your chest, then extend that leg back and bring your left knee towards your chest.",
      "Continue this movement, alternating legs, at a slow pace for a set amount of time or repetitions."
    ]
  },
  {
    "exercise_id": "1d51764d-0979-40ee-a893-dd9cbb7f70fd",
    "source_id": 52779351285688,
    "before_hash": "e85196bd3628570394017ef392de90ce9dbe709a77036b95154b55d41c119b0d",
    "after_hash": "850f29015c91c01c989f4bd57b0bd3b44b2a4cb03f65a9b432ff2157d197a188",
    "expected_updated_at": "2026-10-14T10:46:55.051784+00:00",
    "steps": [
      "Stand in front of a step or bench with your feet shoulder-width apart and hold one dumbbell at each shoulder.",
      "Step up onto the bench with your right foot, pushing off your foot to raise your body up onto the bench.",
      "Bring your left foot up onto the bench and stand up straight, keeping the dumbbells at your shoulders.",
      "Step back down with your left foot, followed by your right foot, to return to the starting position."
    ]
  },
  {
    "exercise_id": "209cfd4e-69c1-40b6-903c-6f4d22bef4d0",
    "source_id": 105688550173706,
    "before_hash": "ebb05f93218010206347f6f2fb76d76fa3f1229ca8f31bc362f8a8710e0af1f2",
    "after_hash": "a82dc82703f546fbea9d87b791b57c1f5ec3890d7f267839f12d39b158876f54",
    "expected_updated_at": "2026-10-14T10:47:06.803495+00:00",
    "steps": [
      "Lie on your back with your feet supported in the foot cradles of the TRX straps and your knees bent. Keep your feet suspended off the ground.",
      "Place your arms by your sides with your palms facing down.",
      "Drive your hips up towards the ceiling, squeezing your glutes and hamstrings at the top of the movement, then lower your hips back down under control."
    ]
  },
  {
    "exercise_id": "26ad762c-2f0f-482e-bbf3-32d5d9b6851b",
    "source_id": 62432389504716,
    "before_hash": "81edcee09038e1e59a52ce2583b5d9ea8aa407e422f82bc97836add538002571",
    "after_hash": "4e386d3ed4bd90fea956be676e6556fbd55dc332b6963b7a74e9f193bdbea39f",
    "expected_updated_at": "2026-10-14T10:46:57.777451+00:00",
    "steps": [
      "Start by lying flat on your back with your feet resting on top of a ball.",
      "Push through your heels and raise your hips towards the ceiling, keeping your feet on the ball.",
      "Engage your glutes at the top of the movement, pause briefly and then lower your hips back down to the starting position."
    ]
  },
  {
    "exercise_id": "29955145-41dd-4e7d-b11a-e7a632f8e714",
    "source_id": 51079406228995,
    "before_hash": "78d8b938a4ff3d6cf3127190a1357532113d69fba92cfcd80b3e20ca2453c916",
    "after_hash": "017f851e1964d23b208bbbb1220b96a99ba3c5cd9dea5bccad34bdd2b3597309",
    "expected_updated_at": "2026-10-14T10:46:54.77706+00:00",
    "steps": [
      "Stand between the two anchored bands, grasp them with an overhand grip, and position the bands at shoulder level.",
      "Brace your core and push the bands overhead, fully extending your arms.",
      "Lower the bands back to shoulder level by bending your elbows, keeping your core engaged. Repeat for desired number of reps."
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
    "exercise_id": "07c8b8ae-c0e7-4dcb-82db-dba648b2f6e5",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ea14a5b60f159615fec414120f3c3e0d2aa432602131dfd4e24980aa112e667c",
    "name": "Plank cẳng tay với khuỷu tay đưa xa về trước",
    "description": "",
    "steps": [
      "Bắt đầu ở tư thế plank cẳng tay, đưa khuỷu tay ra trước vai đến khi tai nằm giữa hai bắp tay. Chống cơ thể trên cẳng tay và các ngón chân.",
      "Giữ tư thế trong thời gian đã định.",
      "Giữ lưng phẳng trong suốt hiệp tập."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T04:42:49.237Z"
  },
  {
    "exercise_id": "090000cf-7975-47eb-98ea-1c8bdb29653d",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "094a0dd9dfa7d6edc2891cdf5a0164df0492cbfb9897190c748cce9dcd5e52a7",
    "name": "Nhón gót ngồi với hai tạ ấm",
    "description": "",
    "steps": [
      "Ngồi trên ghế, đặt một tạ ấm lên mỗi đùi ở gần đầu gối. Hai bàn chân đặt phẳng trên sàn, cách nhau khoảng bằng hông.",
      "Dùng tay giữ ổn định hai tạ ấm rồi nhấc gót chân khỏi sàn.",
      "Giữ một chút rồi từ từ hạ gót chân trở lại sàn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T04:42:49.237Z"
  },
  {
    "exercise_id": "1990c31f-1797-420b-95c7-b1f7e84d0e79",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ca7a35b5b555534244bf1839b32f537ee152eb8ccfaa5c48d29d63a38935a667",
    "name": "Hạ gối tập đùi trước với tạ ấm và chân trước kê bục",
    "description": "",
    "steps": [
      "Đặt bàn chân lên bánh tạ hoặc bục thấp. Mỗi tay cầm một tạ ấm.",
      "Dồn toàn bộ trọng lượng lên chân trước và nghiêng người về trước.",
      "Hạ xuống đến khi bắp chân chạm cơ đùi sau rồi duỗi người lên lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T04:42:49.237Z"
  },
  {
    "exercise_id": "1c3f8472-f46d-4425-b75a-067d22be80ea",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "694b5d989d50f1ada954250d97b07052f0ab4f1af5ead88c9c9521621d97910c",
    "name": "Leo núi tại chỗ nhịp chậm",
    "description": "",
    "steps": [
      "Bắt đầu bài leo núi tại chỗ không tạ ở tư thế plank, hai tay đặt ngay dưới vai.",
      "Từ từ đưa đầu gối phải về phía ngực, sau đó duỗi chân đó ra sau rồi đưa đầu gối trái về phía ngực.",
      "Tiếp tục luân phiên hai chân với nhịp chậm trong thời gian hoặc số lần đã định."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T04:42:49.237Z"
  },
  {
    "exercise_id": "1d51764d-0979-40ee-a893-dd9cbb7f70fd",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "850f29015c91c01c989f4bd57b0bd3b44b2a4cb03f65a9b432ff2157d197a188",
    "name": "Bước lên bục với tạ đơn giữ trước vai",
    "description": "",
    "steps": [
      "Đứng trước bục hoặc ghế, hai chân rộng bằng vai và giữ một tạ đơn ở mỗi vai.",
      "Bước chân phải lên ghế, đẩy qua bàn chân để nâng người lên ghế.",
      "Đưa chân trái lên ghế và đứng thẳng, vẫn giữ hai tạ đơn ở vai.",
      "Bước chân trái xuống trước, sau đó đến chân phải để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T04:42:49.237Z"
  },
  {
    "exercise_id": "209cfd4e-69c1-40b6-903c-6f4d22bef4d0",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "a82dc82703f546fbea9d87b791b57c1f5ec3890d7f267839f12d39b158876f54",
    "name": "Nâng hông với chân treo trên dây TRX",
    "description": "",
    "steps": [
      "Nằm ngửa, đặt hai bàn chân vào quai đỡ chân của dây TRX và gập đầu gối. Giữ hai chân treo khỏi sàn.",
      "Đặt hai tay dọc hai bên người, lòng bàn tay úp xuống.",
      "Đẩy hông lên phía trần, siết cơ mông và cơ đùi sau ở vị trí cao nhất, sau đó hạ hông xuống có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T04:42:49.237Z"
  },
  {
    "exercise_id": "26ad762c-2f0f-482e-bbf3-32d5d9b6851b",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "4e386d3ed4bd90fea956be676e6556fbd55dc332b6963b7a74e9f193bdbea39f",
    "name": "Nâng hông với chân đặt trên bóng thăng bằng",
    "description": "",
    "steps": [
      "Nằm ngửa, đặt hai bàn chân lên trên bóng.",
      "Ấn qua gót chân và nâng hông lên phía trần, giữ hai bàn chân trên bóng.",
      "Siết cơ mông ở vị trí cao nhất, dừng một chút rồi hạ hông trở lại tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T04:42:49.237Z"
  },
  {
    "exercise_id": "29955145-41dd-4e7d-b11a-e7a632f8e714",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "017f851e1964d23b208bbbb1220b96a99ba3c5cd9dea5bccad34bdd2b3597309",
    "name": "Đẩy vai qua đầu với dây kháng lực",
    "description": "",
    "steps": [
      "Đứng giữa hai dây đã neo cố định, nắm dây với lòng bàn tay hướng về trước và đưa dây lên ngang vai.",
      "Siết cơ trung tâm rồi đẩy dây qua đầu, duỗi thẳng hai tay.",
      "Gập khuỷu tay để hạ dây về ngang vai, vẫn siết cơ trung tâm. Lặp lại theo số lần mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T04:42:49.237Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 8
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 8
    or (select count(*) from _noi_gym_restore_translations) <> 8
    or (select count(*) from _noi_gym_restore_before) <> 8 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 8 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1792, VI 1791, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
