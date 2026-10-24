-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 12 reviewed instruction corrections and insert 12 reviewed VI translations.
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
    "exercise_id": "23e433fe-9617-41bc-a5c5-917acea34538",
    "source_id": 134517526969851,
    "before_hash": "05ecdd9843837555accdf23a32b37360ff77886f82a1bf4565e89ede2074c9d4",
    "after_hash": "cdf2dc0de0a478c4efeb2d1a5ad5601cd6deed672420b27ed2fa686b49f35977",
    "expected_updated_at": "2026-10-14T10:47:12.710705+00:00",
    "steps": [
      "Stand tall holding one kettlebell in each hand.",
      "March in place for the desired amount of reps or time."
    ]
  },
  {
    "exercise_id": "2d178d61-0642-4b3f-9d32-7f611fd14a0e",
    "source_id": 267409708979970,
    "before_hash": "8fb33e76ca3fc8e4bf47f70b6e53572be6df4ca75f3a5164ee4aa6e7139ae9ea",
    "after_hash": "5fab97d3592a548914e1233289a416d591d69ac6b878e457bd9e183cc2517eeb",
    "expected_updated_at": "2026-10-14T10:47:39.371037+00:00",
    "steps": [
      "Stand upright with a kettlebell in one hand and lift one knee toward hip height.",
      "Bring the leg back to standing and repeat with the other leg, keeping the kettlebell on the same side.",
      "Repeat."
    ]
  },
  {
    "exercise_id": "2e056973-3976-46a0-b752-ae58fd0a218b",
    "source_id": 27588129220631,
    "before_hash": "acde9f6c52cf39ba2cedd5486e2272c91a089fbaa893622451b42a8ad2b85fcd",
    "after_hash": "344fc5839acffd05154b167da241256b6093976b2f920a67f4def0c3455e8437",
    "expected_updated_at": "2026-10-14T10:46:49.233325+00:00",
    "steps": [
      "Hold two dumbbells by your side.",
      "Take a big step backwards with your left leg, lowering your body until your right thigh is parallel to the ground and your right knee is bent at a 90-degree angle.",
      "Push back up and switch legs, alternating each rep."
    ]
  },
  {
    "exercise_id": "379849bc-ad8a-48d3-8946-d74537ef15f2",
    "source_id": 83691888227414,
    "before_hash": "e9cf974429abf338fa7719057138f9fb30d105d64698d75db00238d6a59c4742",
    "after_hash": "8db71994a6dfd0dd25cf3b1932b313f05b55197b136d97d0a6fe2f82de589c82",
    "expected_updated_at": "2026-10-14T10:47:02.169774+00:00",
    "steps": [
      "Stand between the cable stacks with the pulleys below shoulder height. Take a handle in each hand and step one foot forward, holding your arms out to the sides with your elbows slightly bent.",
      "Bring the handles upward and inward in front of your body, keeping the slight bend in your elbows.",
      "Open your arms back out to the sides under control, then repeat."
    ]
  },
  {
    "exercise_id": "5002aef8-c257-4252-aab7-2dde4b24ddea",
    "source_id": 102333237375147,
    "before_hash": "953e3076d9809fdb9a084df7cc8b8acf0712f6bd61c8871fe6f3c5a69c8090a7",
    "after_hash": "7af8d594f33d7a5dfb71426c5ce54474548a13cd256c80fc8f697f8ab24971cc",
    "expected_updated_at": "2026-10-14T10:47:05.961997+00:00",
    "steps": [
      "Hold one kettlebell in each hand.",
      "Keep your shoulders blades pulled back and walk for a specified duration."
    ]
  },
  {
    "exercise_id": "82cbb629-f8ff-451e-8624-6fb554ea948e",
    "source_id": 181135918303118,
    "before_hash": "5bb0e03280ed0e8c8c8e64088a827f9da57548d65be4262410a984b9f25ea233",
    "after_hash": "cdf8e4283d5a12c9550ece103700c4412b37f0ad971f5ee5a7571df1ac1b561e",
    "expected_updated_at": "2026-10-14T10:47:22.566754+00:00",
    "steps": [
      "Adjust weight for assistance. Grip the inner handles overhead and place your knees on the support pad.",
      "Slowly pull up until your chin reaches the height of the handles. Keep elbows close, core engaged.",
      "Lower back with control. Pause at bottom. Repeat for reps."
    ]
  },
  {
    "exercise_id": "83756c9a-15f9-4036-a6b1-790b20de9ded",
    "source_id": 280991309624358,
    "before_hash": "e0f96daf59f9802efc5e8c4a8d971f9d92e7735b537da2d2e241ee7cc087785d",
    "after_hash": "9e91f5ce14affca48214f7fb8bbd344ee2f611dd02de5245d6092f2c2dd7e982",
    "expected_updated_at": "2026-10-14T10:47:42.163313+00:00",
    "steps": [
      "Take a large step forward with one leg until your shoulders are under the Smith machine.",
      "Lower your body until your back knee nearly touches the ground. Your front knee should be bent at a 90-degree angle, and your back knee should also be bent.",
      "Push through the heel of your front foot to raise your body back to the starting position."
    ]
  },
  {
    "exercise_id": "9f8bbde9-ad37-4d68-a831-e1d941ca3fd9",
    "source_id": 216400547413798,
    "before_hash": "f57dd048803168507633114dc57bb55fa87a97671c74f9ef7c2a72991be67808",
    "after_hash": "f7b585cb36069d7899219150bef751ef33f1422a6fae431cfb80374e0b937bbf",
    "expected_updated_at": "2026-10-14T10:47:28.769804+00:00",
    "steps": [
      "Stand in front of a step or bench with your feet shoulder-width apart and hold one dumbbell on your side with a neutral grip.",
      "Step up onto the bench with your right foot, pushing off your foot to raise your body up onto the bench.",
      "Bring your left foot up onto the bench and stand up straight, keeping the dumbbell at your side.",
      "Step back down with your left foot, followed by your right foot, to return to the starting position."
    ]
  },
  {
    "exercise_id": "ad686dec-9b32-42ad-9070-fd5f89ca27b1",
    "source_id": 12375574755244,
    "before_hash": "f63bd2e2b6cc56a0422578049ce0997e410a2ba08b5506879c3f295798eb0ef8",
    "after_hash": "b7c797a66feb42d7d9c0837bd7d4ff1024c5970bcac98acdcbf3d2df8898032c",
    "expected_updated_at": "2026-10-14T10:46:46.112923+00:00",
    "steps": [
      "Start by standing with your feet wider than shoulder-width apart and holding one dumbbell with both hands.",
      "Hold the dumbbell between your legs with your arms extended.",
      "Bend your knees and lower your body into a squat, then stand back up while holding the dumbbell.",
      "Make sure to keep your core engaged and your back straight throughout the movement."
    ]
  },
  {
    "exercise_id": "b5f459f1-4963-4ac9-a961-9a93cd97f03b",
    "source_id": 201168997459972,
    "before_hash": "e974e39f75ddc8486c87dd41273b2aec24c719d76e734ef88a62e0437122bd63",
    "after_hash": "21f6c12750bb7133911c51418b805302b60fd2cf03c932ccef3b89886e019ca8",
    "expected_updated_at": "2026-10-14T10:47:26.065341+00:00",
    "steps": [
      "Lie back on an incline bench with your feet on the floor, holding one dumbbell above your chest with your arm extended.",
      "Lower the dumbbell beside your chest by bending your elbow.",
      "Press the dumbbell back up above your chest until your arm is extended."
    ]
  },
  {
    "exercise_id": "dbcdd64b-af9b-447f-b210-7f7e9ca1cab5",
    "source_id": 3625048572176,
    "before_hash": "edb3bd34949d081a845ecf036dce76dd7ba849d4116b043083129cd4287f859d",
    "after_hash": "077a9e615ca2324fe51da95eacd79dabd4bea1aa5a362bbf152522f2199050e2",
    "expected_updated_at": "2026-10-14T10:46:44.170761+00:00",
    "steps": [
      "Set a barbell at about the middle of your thighs and press your thighs against it. Hold one dumbbell in each hand with your arms hanging in front of you.",
      "Push your hips back while leaving your knees mostly extended. Look for a stretch in your hamstrings.",
      "When you feel the stretch, push your hips forward until you're back in a standing position."
    ]
  },
  {
    "exercise_id": "f44808ef-bea8-4a78-9f72-58ffa86cbae8",
    "source_id": 83844196349536,
    "before_hash": "9aacb3a61da4c773545f3e868853bca0062e67c707aab19638df4f51bbf67fd8",
    "after_hash": "794fdeef5506a68e6c7474a61eedd72aaa18691f4214f3c312a40dd7f393696c",
    "expected_updated_at": "2026-10-14T10:47:02.197+00:00",
    "steps": [
      "Begin by standing in front of a barbell with your feet about hip-width apart.",
      "Bend at the hips and knees to grab the barbell with a supinated (underhand) grip, positioning the barbell about an inch away from your shins.",
      "Keeping your back straight and your core engaged, use your back muscles to lift the barbell straight up towards your chest.",
      "Keep the same underhand grip and lower the barbell back to the floor before the next repetition."
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
    "exercise_id": "23e433fe-9617-41bc-a5c5-917acea34538",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "cdf2dc0de0a478c4efeb2d1a5ad5601cd6deed672420b27ed2fa686b49f35977",
    "name": "Giậm chân tại chỗ xách tạ ấm hai bên",
    "description": "",
    "steps": [
      "Đứng thẳng, mỗi tay cầm một tạ ấm.",
      "Giậm chân tại chỗ theo số lần hoặc thời gian mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "2d178d61-0642-4b3f-9d32-7f611fd14a0e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "5fab97d3592a548914e1233289a416d591d69ac6b878e457bd9e183cc2517eeb",
    "name": "Giậm chân tại chỗ xách tạ ấm một bên",
    "description": "",
    "steps": [
      "Đứng thẳng, một tay cầm tạ ấm và nâng một đầu gối lên gần ngang hông.",
      "Đặt chân xuống trở lại tư thế đứng rồi lặp lại với chân kia, vẫn giữ tạ ấm ở cùng bên.",
      "Lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "2e056973-3976-46a0-b752-ae58fd0a218b",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "344fc5839acffd05154b167da241256b6093976b2f920a67f4def0c3455e8437",
    "name": "Chùng chân lùi luân phiên với tạ đơn",
    "description": "",
    "steps": [
      "Cầm hai tạ đơn ở hai bên người.",
      "Bước chân trái một bước dài ra sau, hạ người đến khi đùi phải song song với sàn và đầu gối phải gập thành góc 90 độ.",
      "Đẩy người lên rồi đổi chân, luân phiên mỗi lần lặp."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "379849bc-ad8a-48d3-8946-d74537ef15f2",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "8db71994a6dfd0dd25cf3b1932b313f05b55197b136d97d0a6fe2f82de589c82",
    "name": "Ép ngực cáp từ thấp lên cao khi đứng",
    "description": "",
    "steps": [
      "Đứng giữa hai trụ cáp, đặt ròng rọc thấp hơn vai. Mỗi tay cầm một tay nắm, bước một chân lên trước và mở hai tay sang hai bên, khuỷu tay hơi gập.",
      "Đưa hai tay nắm lên trên và vào trong phía trước người, giữ khuỷu tay hơi gập.",
      "Mở hai tay trở lại sang hai bên có kiểm soát rồi lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "5002aef8-c257-4252-aab7-2dde4b24ddea",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "7af8d594f33d7a5dfb71426c5ce54474548a13cd256c80fc8f697f8ab24971cc",
    "name": "Đi bộ xách tạ ấm hai bên",
    "description": "",
    "steps": [
      "Mỗi tay cầm một tạ ấm.",
      "Giữ hai bả vai kéo ra sau và đi bộ trong khoảng thời gian quy định."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "82cbb629-f8ff-451e-8624-6fb554ea948e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "cdf8e4283d5a12c9550ece103700c4412b37f0ad971f5ee5a7571df1ac1b561e",
    "name": "Hít xà tay hẹp có máy hỗ trợ",
    "description": "",
    "steps": [
      "Điều chỉnh mức tạ hỗ trợ. Nắm các tay nắm phía trong ở trên đầu và đặt hai đầu gối lên đệm hỗ trợ.",
      "Từ từ kéo người lên đến khi cằm ngang với tay nắm. Giữ khuỷu tay gần người và siết cơ trung tâm.",
      "Hạ người có kiểm soát. Dừng một chút ở vị trí thấp nhất rồi lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "83756c9a-15f9-4036-a6b1-790b20de9ded",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "9e91f5ce14affca48214f7fb8bbd344ee2f611dd02de5245d6092f2c2dd7e982",
    "name": "Squat tách chân với máy Smith",
    "description": "",
    "steps": [
      "Bước một chân lên trước một bước dài đến khi vai nằm dưới thanh đòn của máy Smith.",
      "Hạ người đến khi đầu gối sau gần chạm sàn. Đầu gối trước gập thành góc 90 độ và đầu gối sau cũng gập.",
      "Đẩy qua gót chân trước để nâng người về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "9f8bbde9-ad37-4d68-a831-e1d941ca3fd9",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "f7b585cb36069d7899219150bef751ef33f1422a6fae431cfb80374e0b937bbf",
    "name": "Bước lên bục cầm tạ đơn một bên",
    "description": "",
    "steps": [
      "Đứng trước bục hoặc ghế, hai chân rộng bằng vai, một tay cầm tạ đơn bên người với kiểu nắm trung tính.",
      "Bước chân phải lên ghế, đạp qua bàn chân để nâng người lên ghế.",
      "Đưa chân trái lên ghế và đứng thẳng, vẫn giữ tạ đơn ở bên người.",
      "Bước chân trái xuống trước, sau đó đến chân phải để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "ad686dec-9b32-42ad-9070-fd5f89ca27b1",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "b7c797a66feb42d7d9c0837bd7d4ff1024c5970bcac98acdcbf3d2df8898032c",
    "name": "Squat sumo với tạ đơn",
    "description": "",
    "steps": [
      "Đứng hai chân rộng hơn vai, dùng cả hai tay cầm một tạ đơn.",
      "Giữ tạ đơn ở giữa hai chân, hai tay duỗi.",
      "Gập đầu gối và hạ người vào tư thế squat, sau đó đứng lên lại trong khi vẫn cầm tạ đơn.",
      "Giữ cơ trung tâm siết và lưng thẳng trong suốt động tác."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "b5f459f1-4963-4ac9-a961-9a93cd97f03b",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "21f6c12750bb7133911c51418b805302b60fd2cf03c932ccef3b89886e019ca8",
    "name": "Đẩy ngực một tay với tạ đơn trên ghế dốc lên",
    "description": "",
    "steps": [
      "Nằm tựa lưng trên ghế dốc lên, hai bàn chân đặt trên sàn, một tay cầm tạ đơn phía trên ngực với cánh tay duỗi.",
      "Gập khuỷu tay để hạ tạ đơn xuống bên ngực.",
      "Đẩy tạ đơn lên lại phía trên ngực đến khi cánh tay duỗi."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "dbcdd64b-af9b-447f-b210-7f7e9ca1cab5",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "077a9e615ca2324fe51da95eacd79dabd4bea1aa5a362bbf152522f2199050e2",
    "name": "Cúi chào với tạ đơn",
    "description": "",
    "steps": [
      "Đặt thanh tạ đòn ngang khoảng giữa đùi và tì đùi vào thanh. Mỗi tay cầm một tạ đơn, thả hai tay phía trước người.",
      "Đẩy hông ra sau trong khi giữ đầu gối gần như duỗi. Cảm nhận cơ đùi sau được kéo giãn.",
      "Khi cảm thấy cơ được kéo giãn, đẩy hông về trước đến khi đứng thẳng trở lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
  },
  {
    "exercise_id": "f44808ef-bea8-4a78-9f72-58ffa86cbae8",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "794fdeef5506a68e6c7474a61eedd72aaa18691f4214f3c312a40dd7f393696c",
    "name": "Kéo tạ đòn kiểu Pendlay với tay nắm ngửa",
    "description": "",
    "steps": [
      "Đứng trước thanh tạ đòn, hai chân rộng khoảng bằng hông.",
      "Gập hông và đầu gối để nắm thanh tạ bằng kiểu nắm ngửa, đặt thanh cách ống chân khoảng một inch.",
      "Giữ lưng thẳng và siết cơ trung tâm, dùng cơ lưng kéo thanh tạ thẳng lên về phía ngực.",
      "Giữ nguyên kiểu nắm ngửa và hạ thanh tạ trở lại sàn trước lần lặp tiếp theo."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T03:42:31.435Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 12
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 12
    or (select count(*) from _noi_gym_restore_translations) <> 12
    or (select count(*) from _noi_gym_restore_before) <> 12 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 12 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1784, VI 1783, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
