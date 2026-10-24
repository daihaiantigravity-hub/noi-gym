-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 4 reviewed instruction corrections and insert 4 reviewed VI translations.
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
    "exercise_id": "59c29200-b637-4c9b-8203-f72cc620f98d",
    "source_id": 273404307121980,
    "before_hash": "6e8dad8adb449462c4f5a736b410755bb48d94dcc118d4360c77d616121d906a",
    "after_hash": "7b3e9eccd85520145246afc06c3abc480388a3d9b191d1bb0a3635d55f4835c6",
    "expected_updated_at": "2026-10-14T10:47:40.63774+00:00",
    "steps": [
      "Begin in a squatting position with your feet together and your knees apart.",
      "Place your hands on the floor in front of you, shoulder-width apart. Keep your arms straight and engage your core.",
      "Shift your weight forward over your hands and rise onto your toes, bringing your knees toward your upper arms.",
      "Bend your elbows and lean your weight onto your hands, shifting your knees towards your upper arms.",
      "Gently lift one foot off the ground, and then the other, balancing on your hands. Hold the pose for a few breaths before releasing back to the ground."
    ]
  },
  {
    "exercise_id": "889058f1-8343-477e-89ab-833177608803",
    "source_id": 10170937093419,
    "before_hash": "e04b6841a646c8bb38146b8528a9344a42a83d0c4918355eff562e9b6f4de55f",
    "after_hash": "d8f5dc1ae4a28a34fd29ce13e36ccd4ec9cd19d32d9e396797ee1b235d9d2254",
    "expected_updated_at": "2026-10-14T10:46:45.773355+00:00",
    "steps": [
      "Begin on your hands and knees with your wrists under your shoulders and your knees under your hips.",
      "Place your forearms on the floor and interlace your fingers.",
      "Place the crown of your head on the floor and tuck your toes under.",
      "Walk your feet towards your head and lift your hips up.",
      "Engage your core, tuck your knees toward your chest, and lift your legs overhead. Straighten your legs and stack your ankles over your hips to balance. Hold for several breaths, then lower your legs with control."
    ]
  },
  {
    "exercise_id": "d78dd7b1-3296-48d7-aa1f-89777f00b8d6",
    "source_id": 153159243593661,
    "before_hash": "7bfd8eb18ee00b58db0683c4c01a4212e7437f2e3cc12b2e0f00037b99f44936",
    "after_hash": "fede166e202024ed30d54719fee49421c56cc3a94c32679b4a44b3fd3e129ae1",
    "expected_updated_at": "2026-10-14T10:47:16.319899+00:00",
    "steps": [
      "Start in a seated position with your legs extended in front of you.",
      "Bend both knees and stack your right knee over your left, bringing your right foot beside your left hip and your left foot toward your right hip.",
      "Sit tall, relax your arms by your sides or rest your hands on your abdomen, and breathe deeply while holding the pose.",
      "Release your legs and extend them forward. Switch sides by stacking your left knee over your right, then settle into the pose and breathe deeply for several breaths."
    ]
  },
  {
    "exercise_id": "f20e50b0-df5a-49be-a980-92a5f894128b",
    "source_id": 272325948163863,
    "before_hash": "aa47cb154c678e4b4fa6bb3be26fc1f07f218a2de80e07ba69c37233aade11a1",
    "after_hash": "908301f65e255c00d61c0b5bae80c8c01113dac7b2bbc90abcbb3ec5eeb8beef",
    "expected_updated_at": "2026-10-14T10:47:40.428269+00:00",
    "steps": [
      "Begin in a low crescent lunge with one foot forward, the opposite knee resting on the floor, and a block beside the front foot.",
      "Set the block at a height that lets you support your torso comfortably, then place one hand on it for balance.",
      "Bend your rear knee and reach the other hand behind you to hold your rear foot or ankle.",
      "Gently draw your rear heel toward your buttock while pressing your support hand into the block. Hold for a few breaths, then release and repeat on the other side."
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
    "exercise_id": "59c29200-b637-4c9b-8203-f72cc620f98d",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "7b3e9eccd85520145246afc06c3abc480388a3d9b191d1bb0a3635d55f4835c6",
    "name": "Tư thế con quạ",
    "description": "",
    "steps": [
      "Bắt đầu ở tư thế ngồi xổm, hai bàn chân gần nhau và hai đầu gối mở sang hai bên.",
      "Đặt hai bàn tay trên sàn phía trước, rộng bằng vai. Giữ tay thẳng và siết cơ trung tâm.",
      "Dồn trọng lượng về phía trước qua hai bàn tay, nhón gót và đưa đầu gối về gần cánh tay trên.",
      "Gập khuỷu tay và nghiêng người về phía trước, dồn trọng lượng lên hai bàn tay, đồng thời đưa đầu gối về phía cánh tay trên.",
      "Lần lượt nhấc từng chân khỏi sàn để giữ thăng bằng trên hai tay. Giữ tư thế trong vài nhịp thở rồi hạ chân có kiểm soát xuống sàn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T10:59:21.780Z"
  },
  {
    "exercise_id": "889058f1-8343-477e-89ab-833177608803",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "d8f5dc1ae4a28a34fd29ce13e36ccd4ec9cd19d32d9e396797ee1b235d9d2254",
    "name": "Tư thế đứng bằng đầu",
    "description": "",
    "steps": [
      "Bắt đầu chống hai tay và quỳ, cổ tay ở dưới vai và đầu gối ở dưới hông.",
      "Đặt hai cẳng tay xuống sàn và đan các ngón tay vào nhau.",
      "Đặt đỉnh đầu xuống sàn và thu các ngón chân làm điểm tựa.",
      "Bước chân lại gần đầu và nâng hông lên.",
      "Siết cơ trung tâm, co gối về phía ngực rồi nâng hai chân lên cao. Duỗi thẳng chân và giữ cổ chân thẳng trên hông để thăng bằng. Giữ vài nhịp thở rồi hạ chân xuống có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T10:59:21.780Z"
  },
  {
    "exercise_id": "d78dd7b1-3296-48d7-aa1f-89777f00b8d6",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "fede166e202024ed30d54719fee49421c56cc3a94c32679b4a44b3fd3e129ae1",
    "name": "Tư thế mặt bò thư giãn – biến thể chân",
    "description": "",
    "steps": [
      "Bắt đầu ở tư thế ngồi, duỗi hai chân về phía trước.",
      "Gập cả hai gối và xếp gối phải lên trên gối trái; đưa bàn chân phải cạnh hông trái và bàn chân trái về phía hông phải.",
      "Ngồi thẳng, thả lỏng hai tay bên người hoặc đặt tay lên bụng, rồi hít thở sâu trong khi giữ tư thế.",
      "Thả hai chân và duỗi về phía trước. Đổi bên bằng cách xếp gối trái lên trên gối phải, sau đó ổn định tư thế và hít thở sâu trong vài nhịp."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T10:59:21.780Z"
  },
  {
    "exercise_id": "f20e50b0-df5a-49be-a980-92a5f894128b",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "908301f65e255c00d61c0b5bae80c8c01113dac7b2bbc90abcbb3ec5eeb8beef",
    "name": "Tư thế lưỡi liềm kéo giãn cơ đùi trước với gạch yoga",
    "description": "",
    "steps": [
      "Bắt đầu ở tư thế chùng chân thấp: một chân đặt phía trước, gối chân còn lại đặt trên sàn và có gạch yoga bên cạnh bàn chân trước.",
      "Đặt gạch ở độ cao giúp bạn chống đỡ thân người thoải mái, rồi đặt một tay lên gạch để giữ thăng bằng.",
      "Gập gối chân sau và đưa tay còn lại ra sau để nắm bàn chân hoặc cổ chân phía sau.",
      "Nhẹ nhàng kéo gót chân sau về phía mông trong khi ấn tay đang chống xuống gạch. Giữ vài nhịp thở, sau đó thả ra và lặp lại ở bên kia."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T10:59:21.780Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 4
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 4
    or (select count(*) from _noi_gym_restore_translations) <> 4
    or (select count(*) from _noi_gym_restore_before) <> 4 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 4 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1925, VI 1924, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
