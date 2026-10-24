-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 16 reviewed instruction corrections and insert 16 reviewed VI translations.
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
    "exercise_id": "047cffd7-9605-4321-b2c9-8fda59ecc2b0",
    "source_id": 219067947930029,
    "before_hash": "e2b871ec1be6080419ae47e560a63f5f0d58d51c79aff1bbdc596318fd6f7ec7",
    "after_hash": "ecec75ed8e87dbf4bdd99a6682917e3a7393dfd2de4f95cf699028024c0c184c",
    "expected_updated_at": "2026-10-14T10:47:29.556655+00:00",
    "steps": [
      "Stand on one leg, holding one dumbbell in each hand, and lift your other foot off the floor.",
      "Hinge at the hips to lower the dumbbells towards the ground as your lifted leg extends behind you, keeping your back straight and your core engaged.",
      "Once you feel a stretch in your hamstring, slowly return to the starting position.",
      "Make sure to keep your standing leg slightly bent and avoid rounding your back as you lower the dumbbells."
    ]
  },
  {
    "exercise_id": "28e888f8-2dba-4bf2-91e5-ad4fcbb9a2b6",
    "source_id": 5260046214147,
    "before_hash": "114d978e1ff84f0163fb1444de90c42ac5d80c973c2418afce26d410c20c26c8",
    "after_hash": "410f8332fdbb5104d6f07ceccb6fef12118b375423865e0bc15df6ab4e332d01",
    "expected_updated_at": "2026-10-14T10:46:44.6753+00:00",
    "steps": [
      "Hold the plate at chest height close to your body",
      "Take a big step backwards with your left leg, lowering your body until your right thigh is parallel to the ground and your right knee is bent at a 90-degree angle.",
      "Push through your right heel to return to standing, bringing your left leg back to starting position.",
      "Repeat the movement on the other side, stepping backwards with your right leg and lowering your body until your left thigh is parallel to the ground and your left knee is bent at a 90-degree angle."
    ]
  },
  {
    "exercise_id": "45d19ab5-5287-4ec9-808b-16a31a4a3ab4",
    "source_id": 157480300931742,
    "before_hash": "130cb3a9764556ddb0cb2ad99c1f7e29ffa08e6f8b0f65ca1f99f23134a4c26b",
    "after_hash": "0d5cffe8489c96345003d74a1c37e972e22359b262fa69fdd5c1cd9401a04765",
    "expected_updated_at": "2026-10-14T10:47:16.926843+00:00",
    "steps": [
      "Stand in front of a step or bench with your feet shoulder-width apart and hold two dumbbells on your side with a neutral grip.",
      "Step up onto the bench with your right foot, pushing off your foot to raise your body up onto the bench.",
      "Bring your left foot up onto the bench and stand up straight, keeping the dumbbells at your sides.",
      "Step back down with your left foot, followed by your right foot, to return to the starting position."
    ]
  },
  {
    "exercise_id": "4a566f1f-139f-46fe-996b-3ac6f638db39",
    "source_id": 31791319916565,
    "before_hash": "200f58c679a8da72d70f58247f6900c1b4f6179aa9a5508de7d96893a4eb2c92",
    "after_hash": "9494d21ea319596ba2aad93d82104d6ab136201b8b5be9b66c72ca763fa30eb7",
    "expected_updated_at": "2026-10-14T10:46:50.454988+00:00",
    "steps": [
      "Hold one kettlebell in each hand at the front of your shoulders in a front rack position.",
      "From a wide stance, bend one knee and shift your hips toward that side into a lateral lunge, keeping the other leg extended.",
      "Return to start position. Repeat."
    ]
  },
  {
    "exercise_id": "4ef9719e-0d46-4e1c-90b7-b7e83aadb7f5",
    "source_id": 159649908237438,
    "before_hash": "7c3b1c0bae8d556cea49d81f79cbf3958db51e71dfec7c0cb48da7a0d9b888c5",
    "after_hash": "140ea68fb31728c18290316e54d99a17b9fc08cea796a5f1e3e0ecde25a2692b",
    "expected_updated_at": "2026-10-14T10:47:17.540562+00:00",
    "steps": [
      "With a barbell resting across your upper back, take a large step forward with one leg and lower your body until your back knee nearly touches the ground. Your front knee should be bent at a 90-degree angle, and your back knee should also be bent.",
      "Push through the heel of your front foot to raise your body back to the starting position."
    ]
  },
  {
    "exercise_id": "5c502938-784a-49bf-ad97-eb1a5645bc4f",
    "source_id": 261640549166702,
    "before_hash": "8629a289b54f06bd6359fe91f835b80d4b033a7e479a23cfb227c594a0b3b212",
    "after_hash": "072e7989c7f5511dc82b3127b3048f093c7a51310f3f4605934dc6c4a66031ae",
    "expected_updated_at": "2026-10-14T10:47:38.353281+00:00",
    "steps": [
      "Hold two dumbbells by your side.",
      "Take a big step backwards with your left leg, lowering your body until your right thigh is parallel to the ground and your right knee is bent at a 90-degree angle.",
      "Push through your right heel to return to standing, bringing your left leg back to starting position.",
      "Repeat the movement on the other side, stepping backwards with your right leg and lowering your body until your left thigh is parallel to the ground and your left knee is bent at a 90-degree angle."
    ]
  },
  {
    "exercise_id": "69cbf422-16b3-488a-8b7e-45fd60765289",
    "source_id": 231458534962487,
    "before_hash": "191d4230775b72b0a26e66c6b91836343ae6483fc9de7992b826b069ceef00c8",
    "after_hash": "da8b974a1266e4e0c77da466b634e7825a6a37ced0fcb1d3a9c5fb65f9a17332",
    "expected_updated_at": "2026-10-14T10:47:32.155049+00:00",
    "steps": [
      "Start with one kettlebell in each hand at the front of your shoulders in a front rack position.",
      "Step back into lunge.",
      "Return to start position."
    ]
  },
  {
    "exercise_id": "808d6754-42ba-4127-b1e1-01128b341408",
    "source_id": 1321326660325,
    "before_hash": "cf98b64aa7aa91b5b4d29544b110b9665bea4dab18f5744b08ff5bfa657f1488",
    "after_hash": "77262a3e3a954b63dcb3797fb2d48ee8578b7fdd7ce5b87acd970119fb525cce",
    "expected_updated_at": "2026-10-14T10:42:23.235522+00:00",
    "steps": [
      "Take a big step backwards with your left leg, lowering your body until your right thigh is parallel to the ground and your right knee is bent at a 90-degree angle.",
      "Push through your right heel to return to standing, bringing your left leg back to starting position.",
      "Repeat the movement on the other side, stepping backwards with your right leg and lowering your body until your left thigh is parallel to the ground and your left knee is bent at a 90-degree angle."
    ]
  },
  {
    "exercise_id": "b81f705b-f24b-402e-abc4-624a6644aaf4",
    "source_id": 89882063712060,
    "before_hash": "f173fd2ae3aecd6ede34697b0a6db2f7de660715954b04d6f8f2cfe3dd941b7a",
    "after_hash": "c35488d1f00d035cee093b76eb78995ce9ee29af41a1a083d5dbe132e117d94a",
    "expected_updated_at": "2026-10-14T10:47:03.510448+00:00",
    "steps": [
      "Hold the trap bar handles at your sides, take a large step forward with one leg, and lower your body until your back knee nearly touches the ground. Your front knee should be bent at a 90-degree angle, and your back knee should also be bent.",
      "Push through the heel of your front foot to raise your body back to the starting position."
    ]
  },
  {
    "exercise_id": "b9140f5f-4d1d-4aef-b1e5-7f5e568dd053",
    "source_id": 238572344966644,
    "before_hash": "828edbc2e2d212092a422c217d0997eb3486512107f2a3001ad25af950fd9ad6",
    "after_hash": "c49ac9979adfd1a7a1cee446522747ae62e8a3d5b8fb7a3bb313db89a8921500",
    "expected_updated_at": "2026-10-14T10:47:33.761896+00:00",
    "steps": [
      "Hold a dumbbell in a goblet position.",
      "Take a big step backwards with your left leg, lowering your body until your right thigh is parallel to the ground and your right knee is bent at a 90-degree angle.",
      "Push through your right heel to return to standing, bringing your left leg back to starting position.",
      "Repeat the movement on the other side, stepping backwards with your right leg and lowering your body until your left thigh is parallel to the ground and your left knee is bent at a 90-degree angle."
    ]
  },
  {
    "exercise_id": "c125fd45-3152-4288-bf78-10d17dbe52d1",
    "source_id": 17959487835682,
    "before_hash": "2451e095276b16ec91921979b771680864fe9f143ce8a7fc63d4c753aacb736a",
    "after_hash": "3e2e15933a0db334605f9270ccf874c8c3b7f92bb1706834b2bbbbd013e811ad",
    "expected_updated_at": "2026-10-14T10:46:47.302386+00:00",
    "steps": [
      "Hold two kettlebells by your side.",
      "Take a big step backwards with your left leg, lowering your body until your right thigh is parallel to the ground and your right knee is bent at a 90-degree angle.",
      "Push back up and switch legs, alternating each rep."
    ]
  },
  {
    "exercise_id": "d83ffcc8-889f-4f39-adb3-440e6b32b201",
    "source_id": 238170145846523,
    "before_hash": "0a3dd4490184a049e135ccfb93c02df07bbaba8d291c996e07939eef754cb54b",
    "after_hash": "bb37cbd7a8203baeab801b05726324028e6984609a0fd82f85e2de03e1c09d4b",
    "expected_updated_at": "2026-10-14T10:47:33.553887+00:00",
    "steps": [
      "Hold one dumbbell in each hand at your sides.",
      "Take a large step forward with one leg, and lower your body until your back knee nearly touches the ground. Your front knee should be bent at a 90-degree angle, and your back knee should also be bent.",
      "Push through the heel of your front foot to raise your body back to the starting position."
    ]
  },
  {
    "exercise_id": "d9178084-b721-4759-8a1a-fcf2d29b8036",
    "source_id": 199040352181416,
    "before_hash": "5a834dd7647f79952e823e8be2f9dacadcefa5640a96e81f1aba7896d6aa7e12",
    "after_hash": "039a330f3d60f70a53bfc7f175183bf68d7dacb5065e74a8239bbb72e73622bc",
    "expected_updated_at": "2026-10-14T10:47:25.767639+00:00",
    "steps": [
      "Stand tall in front of a bench with one kettlebell in each hand at your sides, then place one foot onto the bench.",
      "Stand and bring both feet onto the bench. Slowly lower your leg back down to the starting position.",
      "Repeat."
    ]
  },
  {
    "exercise_id": "da3e9114-11c7-415c-9202-2f8debf8d0f3",
    "source_id": 100587391932582,
    "before_hash": "3f84a7a2e92aa0449f6598354935a3f04385b87330ce10060fa86d46df498b9b",
    "after_hash": "0ac2b0f569a8ea18b7a02a3b64d9e6fc4dc410d9b199c64303ac301135c7040b",
    "expected_updated_at": "2026-10-14T10:47:05.531288+00:00",
    "steps": [
      "Stand on a platform, dumbbells in both hands, feet hip-width apart.",
      "Step back, lowering knee toward floor, keeping chest upright and core engaged.",
      "Push through front foot, return to start, keeping the dumbbells stable at your sides throughout."
    ]
  },
  {
    "exercise_id": "df85c495-a531-4231-b477-5b0ee40c3cf3",
    "source_id": 197502564681985,
    "before_hash": "2d32c99a2aefa5e70d96980ac9ff85164542dc26b44585f2f7720d0d5e57a9f2",
    "after_hash": "0661195b2e06ab8c3666875a6ba368970976164f438443393b88e82dd6401777",
    "expected_updated_at": "2026-10-14T10:47:25.536068+00:00",
    "steps": [
      "Hold one kettlebell in each hand at your sides.",
      "Step forward, lunge, and return.",
      "Repeat with opposite leg."
    ]
  },
  {
    "exercise_id": "e725041c-90a9-4dea-a3be-a9aa42c5abd4",
    "source_id": 894471845890,
    "before_hash": "4ab1149f8b9dcd519c92f4e1a234a4e2f9e63798e2ae343c40b32fa84d815244",
    "after_hash": "6814093d6c048f2dee2ef7e618d01f188da0cc6e6616c276bdbe4a0023ec4467",
    "expected_updated_at": "2026-10-14T10:42:22.42322+00:00",
    "steps": [
      "Hold a dumbbell in a goblet position.",
      "Take a large step forward with one leg, and lower your body until your back knee nearly touches the ground. Your front knee should be bent at a 90-degree angle, and your back knee should also be bent.",
      "Push through the heel of your front foot to raise your body back to the starting position."
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
    "exercise_id": "047cffd7-9605-4321-b2c9-8fda59ecc2b0",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ecec75ed8e87dbf4bdd99a6682917e3a7393dfd2de4f95cf699028024c0c184c",
    "name": "Deadlift một chân với tạ đơn và gối gần thẳng",
    "description": "",
    "steps": [
      "Đứng trên một chân, mỗi tay cầm một tạ đơn và nhấc bàn chân còn lại khỏi sàn.",
      "Gập tại hông để hạ hai tạ đơn về phía sàn, đồng thời duỗi chân đang nhấc ra sau, giữ lưng thẳng và siết cơ trung tâm.",
      "Khi cảm thấy cơ đùi sau được kéo giãn, từ từ trở về tư thế ban đầu.",
      "Giữ chân trụ hơi gập gối và tránh cong tròn lưng khi hạ hai tạ đơn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "28e888f8-2dba-4bf2-91e5-ad4fcbb9a2b6",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "410f8332fdbb5104d6f07ceccb6fef12118b375423865e0bc15df6ab4e332d01",
    "name": "Chùng chân lùi với bánh tạ",
    "description": "",
    "steps": [
      "Giữ bánh tạ ngang ngực, sát người.",
      "Bước chân trái một bước dài ra sau, hạ người đến khi đùi phải song song với sàn và đầu gối phải gập thành góc 90 độ.",
      "Đẩy qua gót chân phải để đứng lên, đưa chân trái về tư thế ban đầu.",
      "Lặp lại với bên kia: bước chân phải ra sau, hạ người đến khi đùi trái song song với sàn và đầu gối trái gập thành góc 90 độ."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "45d19ab5-5287-4ec9-808b-16a31a4a3ab4",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0d5cffe8489c96345003d74a1c37e972e22359b262fa69fdd5c1cd9401a04765",
    "name": "Bước lên bục với tạ đơn hai bên",
    "description": "",
    "steps": [
      "Đứng trước bục hoặc ghế, hai chân rộng bằng vai, cầm hai tạ đơn ở hai bên người với lòng bàn tay hướng vào nhau.",
      "Bước chân phải lên ghế, đẩy qua bàn chân để nâng người lên ghế.",
      "Đưa chân trái lên ghế và đứng thẳng, vẫn giữ hai tạ đơn ở hai bên người.",
      "Bước chân trái xuống trước, sau đó đến chân phải để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "4a566f1f-139f-46fe-996b-3ac6f638db39",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "9494d21ea319596ba2aad93d82104d6ab136201b8b5be9b66c72ca763fa30eb7",
    "name": "Chùng chân ngang với hai tạ ấm giữ trước vai",
    "description": "",
    "steps": [
      "Mỗi tay cầm một tạ ấm, giữ ở phía trước vai theo tư thế front rack.",
      "Từ tư thế đứng rộng chân, gập một gối và chuyển hông về bên đó để chùng chân ngang, giữ chân kia duỗi.",
      "Trở về tư thế ban đầu. Lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "4ef9719e-0d46-4e1c-90b7-b7e83aadb7f5",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "140ea68fb31728c18290316e54d99a17b9fc08cea796a5f1e3e0ecde25a2692b",
    "name": "Squat tách chân với tạ đòn",
    "description": "",
    "steps": [
      "Đặt tạ đòn ngang phần lưng trên, bước một chân dài ra trước rồi hạ người đến khi gối sau gần chạm sàn. Gối trước gập thành góc 90 độ và gối sau cũng gập.",
      "Đẩy qua gót chân trước để nâng người về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "5c502938-784a-49bf-ad97-eb1a5645bc4f",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "072e7989c7f5511dc82b3127b3048f093c7a51310f3f4605934dc6c4a66031ae",
    "name": "Chùng chân lùi với tạ đơn hai bên",
    "description": "",
    "steps": [
      "Cầm hai tạ đơn ở hai bên người.",
      "Bước chân trái một bước dài ra sau, hạ người đến khi đùi phải song song với sàn và đầu gối phải gập thành góc 90 độ.",
      "Đẩy qua gót chân phải để đứng lên, đưa chân trái về tư thế ban đầu.",
      "Lặp lại với bên kia: bước chân phải ra sau, hạ người đến khi đùi trái song song với sàn và đầu gối trái gập thành góc 90 độ."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "69cbf422-16b3-488a-8b7e-45fd60765289",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "da8b974a1266e4e0c77da466b634e7825a6a37ced0fcb1d3a9c5fb65f9a17332",
    "name": "Chùng chân lùi với hai tạ ấm giữ trước vai",
    "description": "",
    "steps": [
      "Bắt đầu với mỗi tay cầm một tạ ấm, giữ ở phía trước vai theo tư thế front rack.",
      "Bước chân ra sau để chùng chân.",
      "Trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "808d6754-42ba-4127-b1e1-01128b341408",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "77262a3e3a954b63dcb3797fb2d48ee8578b7fdd7ce5b87acd970119fb525cce",
    "name": "Chùng chân lùi không tạ",
    "description": "",
    "steps": [
      "Bước chân trái một bước dài ra sau, hạ người đến khi đùi phải song song với sàn và đầu gối phải gập thành góc 90 độ.",
      "Đẩy qua gót chân phải để đứng lên, đưa chân trái về tư thế ban đầu.",
      "Lặp lại với bên kia: bước chân phải ra sau, hạ người đến khi đùi trái song song với sàn và đầu gối trái gập thành góc 90 độ."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "b81f705b-f24b-402e-abc4-624a6644aaf4",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "c35488d1f00d035cee093b76eb78995ce9ee29af41a1a083d5dbe132e117d94a",
    "name": "Squat tách chân với thanh trap bar",
    "description": "",
    "steps": [
      "Nắm tay cầm thanh trap bar ở hai bên người, bước một chân dài ra trước rồi hạ người đến khi gối sau gần chạm sàn. Gối trước gập thành góc 90 độ và gối sau cũng gập.",
      "Đẩy qua gót chân trước để nâng người về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "b9140f5f-4d1d-4aef-b1e5-7f5e568dd053",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "c49ac9979adfd1a7a1cee446522747ae62e8a3d5b8fb7a3bb313db89a8921500",
    "name": "Chùng chân lùi với tạ đơn ôm trước ngực",
    "description": "",
    "steps": [
      "Giữ một tạ đơn ở tư thế goblet trước ngực.",
      "Bước chân trái một bước dài ra sau, hạ người đến khi đùi phải song song với sàn và đầu gối phải gập thành góc 90 độ.",
      "Đẩy qua gót chân phải để đứng lên, đưa chân trái về tư thế ban đầu.",
      "Lặp lại với bên kia: bước chân phải ra sau, hạ người đến khi đùi trái song song với sàn và đầu gối trái gập thành góc 90 độ."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "c125fd45-3152-4288-bf78-10d17dbe52d1",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3e2e15933a0db334605f9270ccf874c8c3b7f92bb1706834b2bbbbd013e811ad",
    "name": "Chùng chân lùi luân phiên với tạ ấm hai bên",
    "description": "",
    "steps": [
      "Cầm hai tạ ấm ở hai bên người.",
      "Bước chân trái một bước dài ra sau, hạ người đến khi đùi phải song song với sàn và đầu gối phải gập thành góc 90 độ.",
      "Đẩy người lên rồi đổi chân, luân phiên mỗi lần lặp."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "d83ffcc8-889f-4f39-adb3-440e6b32b201",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "bb37cbd7a8203baeab801b05726324028e6984609a0fd82f85e2de03e1c09d4b",
    "name": "Squat tách chân với tạ đơn hai bên",
    "description": "",
    "steps": [
      "Mỗi tay cầm một tạ đơn ở hai bên người.",
      "Bước một chân dài ra trước rồi hạ người đến khi gối sau gần chạm sàn. Gối trước gập thành góc 90 độ và gối sau cũng gập.",
      "Đẩy qua gót chân trước để nâng người về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "d9178084-b721-4759-8a1a-fcf2d29b8036",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "039a330f3d60f70a53bfc7f175183bf68d7dacb5065e74a8239bbb72e73622bc",
    "name": "Bước lên bục với hai tạ ấm",
    "description": "",
    "steps": [
      "Đứng thẳng trước ghế, mỗi tay cầm một tạ ấm ở hai bên người, sau đó đặt một bàn chân lên ghế.",
      "Đứng lên và đưa cả hai bàn chân lên ghế. Từ từ hạ chân xuống trở lại tư thế ban đầu.",
      "Lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "da3e9114-11c7-415c-9202-2f8debf8d0f3",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0ac2b0f569a8ea18b7a02a3b64d9e6fc4dc410d9b199c64303ac301135c7040b",
    "name": "Chùng chân lùi từ bục với tạ đơn hai bên",
    "description": "",
    "steps": [
      "Đứng trên bục, hai tay cầm tạ đơn, hai chân rộng bằng hông.",
      "Bước ra sau, hạ gối về phía sàn, giữ ngực thẳng và siết cơ trung tâm.",
      "Đẩy qua chân trước để trở về tư thế ban đầu, giữ hai tạ đơn ổn định ở hai bên người suốt động tác."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "df85c495-a531-4231-b477-5b0ee40c3cf3",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0661195b2e06ab8c3666875a6ba368970976164f438443393b88e82dd6401777",
    "name": "Chùng chân tiến với hai tạ ấm",
    "description": "",
    "steps": [
      "Mỗi tay cầm một tạ ấm ở hai bên người.",
      "Bước ra trước, chùng chân rồi trở về.",
      "Lặp lại với chân kia."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
  },
  {
    "exercise_id": "e725041c-90a9-4dea-a3be-a9aa42c5abd4",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "6814093d6c048f2dee2ef7e618d01f188da0cc6e6616c276bdbe4a0023ec4467",
    "name": "Squat tách chân với tạ đơn ôm trước ngực",
    "description": "",
    "steps": [
      "Giữ một tạ đơn ở tư thế goblet trước ngực.",
      "Bước một chân dài ra trước rồi hạ người đến khi gối sau gần chạm sàn. Gối trước gập thành góc 90 độ và gối sau cũng gập.",
      "Đẩy qua gót chân trước để nâng người về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T05:13:40.691Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 16
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 16
    or (select count(*) from _noi_gym_restore_translations) <> 16
    or (select count(*) from _noi_gym_restore_before) <> 16 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 16 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1808, VI 1807, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
