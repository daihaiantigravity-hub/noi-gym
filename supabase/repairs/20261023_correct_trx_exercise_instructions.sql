-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 11 reviewed instruction corrections and insert 11 reviewed VI translations.
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
    "exercise_id": "251b06f4-d14b-4124-85da-1f222a90993e",
    "source_id": 223070525891195,
    "before_hash": "368643c568a2766c1687342ff4ac13e94e810665ce53ff89d2f5386710702c60",
    "after_hash": "9ff415871bd893f074542f10db53d94a9ec6de94550206bc494c29f763e53dbd",
    "expected_updated_at": "2026-10-14T10:47:30.445119+00:00",
    "steps": [
      "Stand facing the anchor point and grasp the TRX handles with both hands in front of you.",
      "Step laterally to one side, keeping your core engaged.",
      "Lower into a side lunge, bending the knee on that side to a 90-degree angle while keeping the opposite leg straight.",
      "Use the handles for support as you push through the foot of the bent leg to return to the starting position."
    ]
  },
  {
    "exercise_id": "2f8f2f47-7916-4691-b71c-26dfd8690dd1",
    "source_id": 149165760054213,
    "before_hash": "abf1c866515d2e000beea961598f896f1960cc1a76a8e934129f52a762229edd",
    "after_hash": "ac4bda9060295e9771887b09cd6a6f3b4cd7005500734063c185b0954e4517c7",
    "expected_updated_at": "2026-10-14T10:47:15.351346+00:00",
    "steps": [
      "Stand facing the anchor point, grasp both TRX handles, and place your feet shoulder-width apart.",
      "Begin by lowering into a squat position by bending at the knees and hips, keeping your back straight and chest up.",
      "Explosively jump up off the ground while maintaining your grip on the TRX handles.",
      "Land softly back in the squat position, making sure to absorb the impact with your legs."
    ]
  },
  {
    "exercise_id": "36a77a27-e15e-4f8b-9082-7157fad66aa3",
    "source_id": 203042324412172,
    "before_hash": "b8b2eedaa892f12bfbe4135fc8508d49154bcc83e68367523bb4659f8c34b9c5",
    "after_hash": "34dfd22baa943093955493f1cfb17758faeba16d02be6e585a9ec45f2b8ec5a6",
    "expected_updated_at": "2026-10-14T10:47:26.487009+00:00",
    "steps": [
      "Kneel on the floor facing the TRX anchor point.",
      "Grasp the TRX handles with both hands, keeping your arms extended and your shoulders away from your ears.",
      "Keep your abs engaged and your knees on the floor as you lean forward and reach your arms forward and overhead, keeping your body aligned from your knees to your head.",
      "Bring the handles back toward the starting position and return to upright kneeling under control, keeping your knees supported on the floor."
    ]
  },
  {
    "exercise_id": "5557cf21-aa81-4b51-8fb0-6d29f766e1bb",
    "source_id": 176133449182835,
    "before_hash": "7e295c65a0fa8c06568d91b33767fdb167db0ff8b4d6eae73c8252cd4c1c38fa",
    "after_hash": "e5cbed828e9af231ad6875fe867a0ad39ffd7591f9b295f823baba8654b21c05",
    "expected_updated_at": "2026-10-14T10:47:21.344744+00:00",
    "steps": [
      "Start by setting up the TRX straps to a secure anchor point and adjust the straps so that they hang about waist height when you stand under them.",
      "Stand facing away from the anchor point, grab the handles with both hands, and lean forward into an inclined plank with your arms extended and your feet on the floor.",
      "Lower your body down by bending your elbows until your chest nearly touches the handles. Keep your core tight and your body in a straight line.",
      "Push your body back up to the starting position, straightening your arms as you do so. Make sure to engage your chest, triceps, and core throughout the movement."
    ]
  },
  {
    "exercise_id": "75f49f00-1deb-4145-aa48-56d4d39d4b5e",
    "source_id": 6097750908819,
    "before_hash": "ad7e1881cedad1a4e8afd298f4a561c62b6567829cfbece93bdd76f2152871c9",
    "after_hash": "e151e8e634b7ffb3f5553a46b9f7fbe4f7e43d965d720e41f6b722f97c779f64",
    "expected_updated_at": "2026-10-14T10:46:44.861106+00:00",
    "steps": [
      "Stand facing away from the TRX anchor point with both feet on the floor.",
      "Grasp the TRX handles with both hands and extend your arms in front of your chest, keeping your shoulders away from your ears.",
      "Lean forward and open your arms out to the sides with a slight bend in your elbows, keeping your core engaged and your body aligned from your ankles to your head.",
      "Bring the handles back together in front of your chest under control while keeping your body stable."
    ]
  },
  {
    "exercise_id": "9ea486c1-b081-4f96-9cc8-dae04dd6ac20",
    "source_id": 230494688164003,
    "before_hash": "7b83c66b829edd02b45d66aa048d918c669da8d783e19eeaa6c29e72b5cf5c85",
    "after_hash": "2291536f07fa304c4028b75ebaa55e4c5881041614fe71a7eae14f9e37733795",
    "expected_updated_at": "2026-10-14T10:47:31.855383+00:00",
    "steps": [
      "Place your feet in the TRX foot cradles and set your forearms on the floor with your elbows under your shoulders.",
      "Lift your hips and knees off the floor, keeping your feet suspended and your upper body supported on your forearms.",
      "Tighten your abs, glutes, and legs to form a straight line from your head to your feet."
    ]
  },
  {
    "exercise_id": "c073514c-61fd-420d-b879-9dcc3bfed0d4",
    "source_id": 16439941241109,
    "before_hash": "873726dbfcd87a187a71aebd846ae66fd7d09d396f5099c6a54f31dc5c9965a8",
    "after_hash": "eb9de8f9d27849523880705eeda7e785c1a5c9e2d3adcc6f8be02c857f70aaa1",
    "expected_updated_at": "2026-10-14T10:46:46.831115+00:00",
    "steps": [
      "Stand facing the TRX anchor point and grasp the handles with both hands.",
      "Lean backward with your arms extended in front of you, keeping your feet on the floor and your body aligned from your head to your heels.",
      "Open your arms out to the sides at shoulder height to raise your torso, then bring your hands back in front of you under control."
    ]
  },
  {
    "exercise_id": "c7bfb07c-6ef6-478d-bce0-2fe25de793c3",
    "source_id": 123461493930888,
    "before_hash": "b62a9445f3d604c9881d297603efe1510d702d923d4e5e90881fec9070c2a31c",
    "after_hash": "3d38487eb6e2828fca4e8300098b693a5271ed56943abb864edd5a4a3b6644ec",
    "expected_updated_at": "2026-10-14T10:47:10.564616+00:00",
    "steps": [
      "Stand facing the anchor point, holding onto the TRX handles with both hands.",
      "Step your left foot behind your right, crossing it behind your right leg, and lower yourself into a curtsy lunge.",
      "Push through your right foot to return to the starting position and repeat the movement with the other leg."
    ]
  },
  {
    "exercise_id": "cbb9fd87-e742-44f9-9a75-790fc56f35f7",
    "source_id": 63886398594194,
    "before_hash": "2914cc3553d3dd70be5cf1e0ed8a0853d0eff227ca8629ef0389dfe3eddc0e67",
    "after_hash": "cc6b88997ee4e5fa9b894f60f31c50a2f1f459b66970f29e465e9c920f844094",
    "expected_updated_at": "2026-10-14T10:46:58.169153+00:00",
    "steps": [
      "Stand facing the TRX anchor point and grasp the handles with an overhand grip, palms facing down.",
      "Lean backward until the straps are taut with your arms extended in front of you, keeping your feet on the floor and your body aligned from your head to your heels.",
      "Bend your elbows to curl the handles toward your forehead while keeping your upper arms in front of you, then extend your elbows under control to return."
    ]
  },
  {
    "exercise_id": "e61f6e13-b45f-4b9a-889e-09025a03626a",
    "source_id": 224523140561081,
    "before_hash": "26665207fa816086f77e18056a13b659eebbd1d468078cc422142e52a5295ca0",
    "after_hash": "9e1b79d341ca6cf101288f33cf83fb51139c3bf93e9c78f17fe05c14ea7be5f6",
    "expected_updated_at": "2026-10-14T10:47:30.695949+00:00",
    "steps": [
      "Lie on your back with your heels supported in the TRX foot cradles and your arms by your sides on the floor.",
      "Lift your hips and bend your knees to pull your heels toward your glutes, keeping your core engaged and your shoulders on the floor.",
      "Pause for a moment, then slowly extend your knees to move your feet away from your body and return to the starting position."
    ]
  },
  {
    "exercise_id": "f14ee018-ec29-4945-9533-c585d8511460",
    "source_id": 192234771243543,
    "before_hash": "eb93db09e2200c941ce95bccc88ec8658aabbc8e527311c754bf7a79eee2b219",
    "after_hash": "a78e6fe52dc4d0b03a1429f784f2c198340b5f3212d36e28cab19b278de18505",
    "expected_updated_at": "2026-10-14T10:47:24.656396+00:00",
    "steps": [
      "Stand facing the TRX anchor point and grasp the handles with both hands.",
      "Lean backward with your arms extended in front of you, keeping your feet on the floor and your body aligned from your head to your heels.",
      "Bend your elbows and pull them back to raise your torso toward the handles.",
      "Keep your elbows flared outward as you pull, then extend your arms under control to return to the starting position."
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
    "exercise_id": "251b06f4-d14b-4124-85da-1f222a90993e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "9ff415871bd893f074542f10db53d94a9ec6de94550206bc494c29f763e53dbd",
    "name": "Chùng chân ngang với dây TRX",
    "description": "",
    "steps": [
      "Đứng hướng về điểm neo dây, hai tay nắm tay cầm TRX ở phía trước người.",
      "Bước chân sang một bên, giữ cơ trung tâm siết chặt.",
      "Hạ người vào tư thế chùng chân ngang, gập gối bên đó thành góc 90 độ và giữ chân đối diện thẳng.",
      "Dùng tay cầm để hỗ trợ khi đẩy qua bàn chân của bên gối đang gập để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "2f8f2f47-7916-4691-b71c-26dfd8690dd1",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ac4bda9060295e9771887b09cd6a6f3b4cd7005500734063c185b0954e4517c7",
    "name": "Squat bật nhảy với dây TRX",
    "description": "",
    "steps": [
      "Đứng hướng về điểm neo dây, nắm cả hai tay cầm TRX và đặt hai chân rộng bằng vai.",
      "Gập gối và hông để hạ vào tư thế squat, giữ lưng thẳng và ngực nâng.",
      "Bật nhảy mạnh lên khỏi sàn, vẫn giữ chắc hai tay cầm TRX.",
      "Tiếp đất nhẹ nhàng trở lại tư thế squat, dùng hai chân để hấp thụ lực tiếp đất."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "36a77a27-e15e-4f8b-9082-7157fad66aa3",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "34dfd22baa943093955493f1cfb17758faeba16d02be6e585a9ec45f2b8ec5a6",
    "name": "Duỗi người từ tư thế quỳ với dây TRX",
    "description": "",
    "steps": [
      "Quỳ trên sàn, hướng về điểm neo dây TRX.",
      "Hai tay nắm tay cầm TRX, giữ tay duỗi và vai xa tai.",
      "Siết cơ bụng và giữ hai gối trên sàn khi nghiêng người ra trước, vươn hai tay ra trước và qua đầu, giữ thân thẳng hàng từ gối đến đầu.",
      "Đưa tay cầm về vị trí ban đầu và trở lại tư thế quỳ thẳng có kiểm soát, vẫn giữ hai gối làm điểm tựa trên sàn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "5557cf21-aa81-4b51-8fb0-6d29f766e1bb",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e5cbed828e9af231ad6875fe867a0ad39ffd7591f9b295f823baba8654b21c05",
    "name": "Chống đẩy với dây TRX",
    "description": "",
    "steps": [
      "Gắn dây TRX vào điểm neo chắc chắn, chỉnh dây để tay cầm ở khoảng ngang eo khi đứng bên dưới.",
      "Đứng quay lưng về điểm neo, hai tay nắm tay cầm rồi nghiêng người ra trước vào tư thế plank với hai tay duỗi và hai bàn chân trên sàn.",
      "Gập khuỷu tay để hạ người đến khi ngực gần chạm tay cầm. Giữ cơ trung tâm siết chặt và thân thẳng hàng.",
      "Đẩy người về tư thế ban đầu, duỗi hai tay. Giữ cơ ngực, cơ tay sau và cơ trung tâm hoạt động suốt động tác."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "75f49f00-1deb-4145-aa48-56d4d39d4b5e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e151e8e634b7ffb3f5553a46b9f7fbe4f7e43d965d720e41f6b722f97c779f64",
    "name": "Ép ngực với dây TRX",
    "description": "",
    "steps": [
      "Đứng quay lưng về điểm neo dây TRX, hai bàn chân trên sàn.",
      "Hai tay nắm tay cầm TRX và duỗi ra trước ngực, giữ vai xa tai.",
      "Nghiêng người ra trước và mở hai tay sang hai bên với khuỷu tay hơi gập, giữ cơ trung tâm siết chặt và thân thẳng hàng từ cổ chân đến đầu.",
      "Đưa hai tay cầm về sát nhau trước ngực có kiểm soát, giữ cơ thể ổn định."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "9ea486c1-b081-4f96-9cc8-dae04dd6ac20",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "2291536f07fa304c4028b75ebaa55e4c5881041614fe71a7eae14f9e37733795",
    "name": "Plank cẳng tay với chân treo trên dây TRX",
    "description": "",
    "steps": [
      "Đặt hai bàn chân vào quai đỡ chân TRX và chống cẳng tay trên sàn, khuỷu tay ở dưới vai.",
      "Nâng hông và gối khỏi sàn, giữ hai chân treo và thân trên tựa trên cẳng tay.",
      "Siết cơ bụng, cơ mông và hai chân để tạo đường thẳng từ đầu đến bàn chân."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "c073514c-61fd-420d-b879-9dcc3bfed0d4",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "eb9de8f9d27849523880705eeda7e785c1a5c9e2d3adcc6f8be02c857f70aaa1",
    "name": "Mở tay tập vai sau với dây TRX",
    "description": "",
    "steps": [
      "Đứng hướng về điểm neo dây TRX, hai tay nắm tay cầm.",
      "Ngả người ra sau, hai tay duỗi ở phía trước, giữ hai bàn chân trên sàn và thân thẳng hàng từ đầu đến gót chân.",
      "Mở hai tay sang hai bên ngang vai để nâng thân lên, sau đó đưa hai tay về phía trước có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "c7bfb07c-6ef6-478d-bce0-2fe25de793c3",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3d38487eb6e2828fca4e8300098b693a5271ed56943abb864edd5a4a3b6644ec",
    "name": "Chùng chân chéo sau với dây TRX",
    "description": "",
    "steps": [
      "Đứng hướng về điểm neo dây, hai tay giữ tay cầm TRX.",
      "Bước chân trái chéo ra sau chân phải rồi hạ người vào tư thế chùng chân chéo sau.",
      "Đẩy qua chân phải để trở về tư thế ban đầu rồi lặp lại với chân kia."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "cbb9fd87-e742-44f9-9a75-790fc56f35f7",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "cc6b88997ee4e5fa9b894f60f31c50a2f1f459b66970f29e465e9c920f844094",
    "name": "Cuốn tay trước nắm sấp với dây TRX",
    "description": "",
    "steps": [
      "Đứng hướng về điểm neo dây TRX, nắm tay cầm bằng kiểu nắm sấp, lòng bàn tay úp xuống.",
      "Ngả người ra sau đến khi dây căng, hai tay duỗi ở phía trước, giữ hai bàn chân trên sàn và thân thẳng hàng từ đầu đến gót chân.",
      "Gập khuỷu để cuốn tay cầm về phía trán, giữ bắp tay ở phía trước người, sau đó duỗi khuỷu có kiểm soát để trở về."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "e61f6e13-b45f-4b9a-889e-09025a03626a",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "9e1b79d341ca6cf101288f33cf83fb51139c3bf93e9c78f17fe05c14ea7be5f6",
    "name": "Gập gối tập đùi sau với dây TRX",
    "description": "",
    "steps": [
      "Nằm ngửa, đặt gót chân vào quai đỡ chân TRX, hai tay dọc hai bên người trên sàn.",
      "Nâng hông và gập gối để kéo gót chân về phía mông, giữ cơ trung tâm siết chặt và hai vai trên sàn.",
      "Dừng một chút rồi từ từ duỗi gối, đưa hai bàn chân ra xa người để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
  },
  {
    "exercise_id": "f14ee018-ec29-4945-9533-c585d8511460",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "a78e6fe52dc4d0b03a1429f784f2c198340b5f3212d36e28cab19b278de18505",
    "name": "Kéo tập vai sau với dây TRX",
    "description": "",
    "steps": [
      "Đứng hướng về điểm neo dây TRX, hai tay nắm tay cầm.",
      "Ngả người ra sau, hai tay duỗi ở phía trước, giữ hai bàn chân trên sàn và thân thẳng hàng từ đầu đến gót chân.",
      "Gập khuỷu tay và kéo khuỷu ra sau để nâng thân về phía tay cầm.",
      "Giữ khuỷu tay mở sang hai bên khi kéo, sau đó duỗi tay có kiểm soát để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:52:16.708Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 11
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 11
    or (select count(*) from _noi_gym_restore_translations) <> 11
    or (select count(*) from _noi_gym_restore_before) <> 11 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 11 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1819, VI 1818, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
