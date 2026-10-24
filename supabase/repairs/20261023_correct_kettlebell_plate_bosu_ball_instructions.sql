-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 22 reviewed instruction corrections and insert 22 reviewed VI translations.
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
    "exercise_id": "1fa90b16-7f60-484d-939b-3b1fa11c7838",
    "source_id": 267873044306374,
    "before_hash": "97f4dfa7c422d339f1659a2805942410445c3ee2106aa34d6b921b4f18fc3846",
    "after_hash": "4ea4b891ca7a3023f9630324761893eb42593e478dcf0310bcc22b7fa77f4660",
    "expected_updated_at": "2026-10-14T10:47:39.480888+00:00",
    "steps": [
      "Set a fixed bar at about mid-thigh height and stand with your thighs against it. Hold a kettlebell in each hand with your arms hanging down.",
      "Push your hips back while keeping your knees mostly extended and your back straight. Look for a stretch in your hamstrings.",
      "When you feel the stretch, push your hips forward until you are back in a standing position, keeping the kettlebells in your hands."
    ]
  },
  {
    "exercise_id": "228cb264-339b-452f-b857-0fa6829f7b22",
    "source_id": 31196575630128,
    "before_hash": "3a97e4d3e507253419feff10d3c642f6ff4e3b05ef32e83e2ac96875a01cf09c",
    "after_hash": "0c916fbaf3bede2c523832340443bb5ed1320a5cd6bf0c13082d6f382c5be786",
    "expected_updated_at": "2026-10-14T10:46:49.930548+00:00",
    "steps": [
      "Stand with your feet shoulder-width apart, holding one kettlebell with both hands in front of your thighs.",
      "Keep your torso upright and bend your elbows, leading them up and out to draw the kettlebell toward your chest.",
      "Lower the kettlebell under control to the front of your thighs, then repeat."
    ]
  },
  {
    "exercise_id": "3282f40b-df10-48c1-b38c-c5342300b511",
    "source_id": 251803075401480,
    "before_hash": "11c224ded5eb5e767af5146c8902f5464183277070c3c116585a21cda671ffaf",
    "after_hash": "8ab5aab394e7b9434395cf5b6561a53c84e5fc3850404ac84fb9b11e7c85ca73",
    "expected_updated_at": "2026-10-14T10:47:36.609918+00:00",
    "steps": [
      "Stand with your feet together and hold the medicine ball at your chest with both hands.",
      "Jump your feet apart as you press the ball overhead.",
      "Jump your feet back together as you lower the ball to your chest. Repeat for the desired repetitions."
    ]
  },
  {
    "exercise_id": "365a565e-071e-4c31-866d-11c356dcd915",
    "source_id": 225968949527306,
    "before_hash": "77d0fb58879413b1f237c5546a872cd3ec2c248922e357887c53908990f4c088",
    "after_hash": "3faaa2ab5bfd206aa91202e268391380ba91c8d4f96d34655917f5b220c2562e",
    "expected_updated_at": "2026-10-14T10:47:30.798384+00:00",
    "steps": [
      "Hold a weight plate by its rim in each hand at your sides with your arms straight, and balance on one foot.",
      "Hinge forward at your hips to lower the plates, keeping your back straight as your free leg extends behind you in line with your back.",
      "Drive your hips forward to stand back up, bringing the free foot back toward the ground while keeping the plates in your hands."
    ]
  },
  {
    "exercise_id": "376acc8c-ec4f-4430-9f5d-283edba5d446",
    "source_id": 146325705239106,
    "before_hash": "fdf54e8338efd9ab9457e6c20c5b3ce7586e19dd66276834790f1fab5aa85a64",
    "after_hash": "f14273315d3b9300d57e890c9da4c27ee3fc042bdf19b47b9232db23fc5e42ab",
    "expected_updated_at": "2026-10-14T10:47:14.664376+00:00",
    "steps": [
      "Lie on a flat bench with your feet on the floor, holding a kettlebell in each hand above your chest.",
      "Bend your elbows and lower the kettlebells toward your upper chest, with your elbows opening out to the sides.",
      "Press both kettlebells upward until your arms are extended, then repeat."
    ]
  },
  {
    "exercise_id": "38081e8c-4479-422c-af21-70711e37f2cf",
    "source_id": 234001652818758,
    "before_hash": "c1475ce84de89e2b35aae878e11d87f9e9b3be8afb40b259d5ae6497a510ba97",
    "after_hash": "b0e553f4234e574b617e72dd766db3b9b40e6a28b22784acb5dc966b4047aba3",
    "expected_updated_at": "2026-10-14T10:47:32.725385+00:00",
    "steps": [
      "Set a fixed bar at mid-thigh height and place your working thigh against it. Hold a kettlebell in each hand with your arms hanging down.",
      "Place one foot behind you, resting only on the toes of that back foot. Keep your front foot flat on the floor throughout the movement.",
      "Bend your back knee and push your hips back with a straight back, looking for a stretch in your front hamstring.",
      "When you feel the stretch, push your hips forward until you are back in a standing position."
    ]
  },
  {
    "exercise_id": "3dd7655e-fe50-4bc0-8a9c-4dfe97492ff2",
    "source_id": 198756983943169,
    "before_hash": "f10dc38d8d0be49d23f9e23643933a568415151ff100b6254ce1feb009064db5",
    "after_hash": "c3cca4446efb7bdf9b5d05929fa9680981848d68c74abb7315d968651a313b9c",
    "expected_updated_at": "2026-10-14T10:47:25.647112+00:00",
    "steps": [
      "Stand with one foot slightly behind the other and hold a kettlebell with both hands. Hinge at your hips to bring the kettlebell back between your legs.",
      "Drive your hips forward to swing the kettlebell up to chest height.",
      "Let the kettlebell swing back between your legs as you hinge again, keeping your core engaged and your staggered stance. Repeat for the desired repetitions."
    ]
  },
  {
    "exercise_id": "44233008-622d-462c-9e7e-13dc6de91e78",
    "source_id": 221426605298028,
    "before_hash": "8af09369a0457460d92cfcb6d11b2a0cf5950f338112cb201b83bb385969d41b",
    "after_hash": "e61107715a0085601ef3e5778af54896d6b29bc8958262e3d4b1905ad3e7c37d",
    "expected_updated_at": "2026-10-14T10:47:30.016351+00:00",
    "steps": [
      "Begin supported on your hands and knees, with a weight plate resting flat across your upper back and your arms extended.",
      "Bend your elbows to lower your chest toward the floor, keeping your body aligned from your shoulders to your knees and the plate stable.",
      "Press through your hands to return to the starting position."
    ]
  },
  {
    "exercise_id": "5e581341-2be4-4dd5-91bc-4ce6a3890a74",
    "source_id": 34583837236799,
    "before_hash": "03b1267b69502feaecc7faad4a617e3bce81eb683cea725b82911abe595b11ee",
    "after_hash": "395fdc1fbb3dc6b6ddb1a713504e925dfeb56a2d7813709631cecd4eeede6ceb",
    "expected_updated_at": "2026-10-14T10:46:50.751093+00:00",
    "steps": [
      "Stand with your feet shoulder-width apart, holding one plate in each hand at your sides.",
      "Keeping your arms nearly straight, raise the plates out to the sides until they are in line with your shoulders.",
      "Lower the plates back to your sides under control. Repeat for the desired repetitions."
    ]
  },
  {
    "exercise_id": "6fc94c3a-eada-4f02-9128-13d0003aaf02",
    "source_id": 67516238246190,
    "before_hash": "88a50c7f7246b3e0644f6d7634739ff3bb9af9237092344b93c12541129e4208",
    "after_hash": "0312f4f79b79a9101007d7cfbba402378a97865efa18a4f1379f54cd903ca254",
    "expected_updated_at": "2026-10-14T10:46:58.840888+00:00",
    "steps": [
      "Stand on one leg beside a stable support, holding a plate against the outside of your working thigh and using your free hand for balance.",
      "Lift the working leg outward to the side, keeping the plate against your thigh, your torso steady and your toes pointing forward.",
      "Lower the leg slowly under control, maintaining tension in the outer hip."
    ]
  },
  {
    "exercise_id": "75fced1a-7bea-421b-a6a2-acb55fbca87a",
    "source_id": 231403310764579,
    "before_hash": "4fed2c801b69e98584edf1840fcd9541c1311f65c3d3718966d3aa7b76460b7b",
    "after_hash": "7139bc1299d828a934f8c2f9b25ccc0a1b300296b3094b0ca03f8a25f4d516a0",
    "expected_updated_at": "2026-10-14T10:47:32.136605+00:00",
    "steps": [
      "Stand with your feet shoulder-width apart, holding a kettlebell in each hand in front of your thighs.",
      "Keep your torso upright and bend your elbows, leading them up and out to draw the kettlebells toward your chest.",
      "Lower both kettlebells under control to the front of your thighs, then repeat."
    ]
  },
  {
    "exercise_id": "826bbbe8-65f9-4101-b9ab-aaa8fb2160cc",
    "source_id": 35818252192969,
    "before_hash": "8126ed4ec2c471b8b79d9765d4af4d1783740695a1c90b1edbc548ceb8ba0690",
    "after_hash": "0957b072e75135e86f8d2e82b302a89811488ebcff05ab7c59b7e0015e9efc38",
    "expected_updated_at": "2026-10-14T10:46:51.027929+00:00",
    "steps": [
      "Rest your upper back on the dome of the BOSU, with its flat base on the floor. Bend one knee and plant that foot on the floor, lifting your other foot.",
      "Drive through the planted foot to raise your hips, squeezing your glutes and extending the lifted leg forward.",
      "Lower your hips under control, then switch legs."
    ]
  },
  {
    "exercise_id": "84c30e4f-4771-46b0-a5b4-4ca175293212",
    "source_id": 237501859855935,
    "before_hash": "66a5d985af9cecc40f3ba5f6214bb3900f8c343849e7e540dc6c6f2f2a3b502e",
    "after_hash": "84ad717f074c29e9fd7921e8cfd78f8a3810c276d6bc04353eb9582bdfdaadf6",
    "expected_updated_at": "2026-10-14T10:47:33.521474+00:00",
    "steps": [
      "Lie back on an incline bench with your feet on the floor, holding a kettlebell in each hand above your upper chest.",
      "Bend your elbows and lower the kettlebells toward your upper chest, with your elbows opening out to the sides.",
      "Press both kettlebells upward until your arms are extended, then repeat."
    ]
  },
  {
    "exercise_id": "91ab5fac-a2ad-4741-bfeb-097ae061fad8",
    "source_id": 99002510042454,
    "before_hash": "650773c134bc0a351bf20dd7ea282ee2591303100c34aa3a18cd1581272b6871",
    "after_hash": "19bd4242151df60e0a6edcd16de0649e5d7a0e993b2a45d3c80063b423d299cd",
    "expected_updated_at": "2026-10-14T10:47:05.37533+00:00",
    "steps": [
      "Hold a kettlebell in each hand just above your knees, with a slight bend in your hips and knees.",
      "Drive through your hips and knees to bring the kettlebells up to your shoulders, receiving them in front of your shoulders with your elbows bent.",
      "Dip your knees, then extend your legs to drive the kettlebells overhead, finishing with your arms and legs extended. Lower the kettlebells to your shoulders and then back to the hanging position under control."
    ]
  },
  {
    "exercise_id": "9d621ff9-86fa-4c12-a454-a57bb829b92c",
    "source_id": 210307780838743,
    "before_hash": "63727c55dbb5c08be321d39a3d0f01ecbd8e7471b8d3cc7f140409b287607eaa",
    "after_hash": "d3c3adf6414b91b1b67af47b58dcaf3d33c397864670e692d7ea905b598f3c8b",
    "expected_updated_at": "2026-10-14T10:47:27.668805+00:00",
    "steps": [
      "Sit on the floor with your knees bent, lean your torso slightly back and hold a plate in both hands in front of you.",
      "Engage your core by drawing your belly button toward your spine and keep your legs steady.",
      "Twist your upper body to the right, bringing the plate with you while keeping your back straight.",
      "Hold for a second, then twist to the left and hold for another second."
    ]
  },
  {
    "exercise_id": "d4611a2c-35b8-4aca-87e1-1d22785b0135",
    "source_id": 209123920056357,
    "before_hash": "9b16bdf88782d68cc533af54d2ed9b5a66d3b6b29f540da28de491f1ddcbae0d",
    "after_hash": "282ab2fb8a8aba68e262bcbb322fcc8a12419e5024d4cc40baa0765f4785b9ff",
    "expected_updated_at": "2026-10-14T10:47:27.398533+00:00",
    "steps": [
      "Hold a kettlebell in each hand at shoulder height, with your palms facing inward.",
      "Squat down, then drive upward and press one kettlebell overhead while keeping the other at your shoulder.",
      "Lower the raised kettlebell back to your shoulder as you descend into the next squat, then press with the other arm. Continue alternating arms each repetition."
    ]
  },
  {
    "exercise_id": "e03cd0c4-0f3d-4a92-8dec-440025ac5704",
    "source_id": 262635116485959,
    "before_hash": "afd95a52230dd3bdd043c711399f00c3aae604ce1dcbad45ee1ad51daa0a39c2",
    "after_hash": "52b50dc3648162d5af0104216a24418bd1a95f3433390db74861c53af5d8e6e2",
    "expected_updated_at": "2026-10-14T10:47:38.58135+00:00",
    "steps": [
      "Stand with your feet shoulder-width apart, holding a kettlebell in each hand.",
      "Bring the kettlebells to your shoulders, with your palms facing inward and your elbows bent.",
      "Keeping the kettlebells at your shoulders, bend your hips and knees to lower into a squat.",
      "Drive upward by extending your hips and knees, using that momentum to press both kettlebells overhead.",
      "Lower the kettlebells back to your shoulders under control and repeat for the desired repetitions."
    ]
  },
  {
    "exercise_id": "ec7aad3e-6eed-46db-ae51-54886881851e",
    "source_id": 159926288014448,
    "before_hash": "f5ab4a89ca04fb40bfae8516e09c9804c9ca0edba24f81cf24deaea01b90a79e",
    "after_hash": "bcf968045f2e5fbac698799e6bc7efb266bbcbaf4339dc2c0f9bcfdd539274f0",
    "expected_updated_at": "2026-10-14T10:47:17.545055+00:00",
    "steps": [
      "Rest your upper back on the dome of the BOSU, with its flat base on the floor. Bend both knees and plant both feet on the floor.",
      "Drive through your feet to raise your hips, squeezing your glutes and keeping your upper back supported on the BOSU.",
      "Lower your hips under control to complete one repetition."
    ]
  },
  {
    "exercise_id": "ee2d4de5-6715-4579-9d77-1c6bd3e6dcc0",
    "source_id": 190001472014913,
    "before_hash": "353071e6778d1c1767fd42ea1e074b3de3df08974e05ad9cbda72416f80bc038",
    "after_hash": "afbd8898385d5de52c1c0d7382dc6f8060cbd6b823ece3fc16c9a3f9335ea242",
    "expected_updated_at": "2026-10-14T10:47:24.354828+00:00",
    "steps": [
      "Lie on your back on the floor with your legs extended, holding the BOSU by its rim with both hands above your chest.",
      "Engage your core and sit up, keeping your arms extended and the BOSU raised above you.",
      "Lower your torso back to the floor under control while continuing to hold the BOSU."
    ]
  },
  {
    "exercise_id": "eeea366a-c885-4a83-b819-46e04daa94d6",
    "source_id": 169984965244344,
    "before_hash": "208be4216c77887d6ed7e72e29e435fec011aa0a08426adad1a68c04bf34d468",
    "after_hash": "295b2f19573f3b4fe98915f49319ce32c35d25597f05df1ed4de992ef2666d93",
    "expected_updated_at": "2026-10-14T10:47:19.907303+00:00",
    "steps": [
      "Set a fixed bar at mid-thigh height and place your working thigh against it. Hold a weight plate against your chest with both hands.",
      "Place one foot behind you, resting only on the toes of that back foot. Keep your front foot flat on the floor throughout the movement.",
      "Bend your back knee and push your hips back with a straight back, looking for a stretch in your front hamstring.",
      "When you feel the stretch, push your hips forward until you are back in a standing position."
    ]
  },
  {
    "exercise_id": "f0f0397a-da6c-466d-9dd7-f28db52fe91a",
    "source_id": 257914065321639,
    "before_hash": "c8ec9aeccb8d7ef3ab1d8979c5da4678ccbcf61504588b004a2b6e10a25ea98d",
    "after_hash": "ff8b959332acfcede0293c1696fd44ad079f2b499712f0830a6cb1cbe2cf614c",
    "expected_updated_at": "2026-10-14T10:47:37.574276+00:00",
    "steps": [
      "Stand side by side with your partner, both facing forward, and hold the medicine ball in both hands.",
      "Rotate your torso toward your partner and toss the ball sideways to them.",
      "Catch the return pass, bring the ball toward your outside hip, then rotate toward your partner and toss it back."
    ]
  },
  {
    "exercise_id": "f5b86cc6-a245-497d-ac5c-edacddb14500",
    "source_id": 88435544564972,
    "before_hash": "2734bf47e302362f6f694bcf0bd3f45ec60997ea0641457a32dcf4dfb079db37",
    "after_hash": "86d65b3e4fda79ce218a1d5d818907427af08d51ad0712cbae1875a67f9cf3be",
    "expected_updated_at": "2026-10-14T10:47:03.107276+00:00",
    "steps": [
      "Place two plates flat on the floor, spaced so that you can put one hand on each with a gap between them. Begin in a pushup position with your toes on the floor and your body straight.",
      "Bend your elbows and shoulders to lower your chest into the gap until your upper arms travel slightly behind your body.",
      "Press through your hands to return to the starting position."
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
    "exercise_id": "1fa90b16-7f60-484d-939b-3b1fa11c7838",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "4ea4b891ca7a3023f9630324761893eb42593e478dcf0310bcc22b7fa77f4660",
    "name": "Gập hông tựa thanh với tạ ấm",
    "description": "",
    "steps": [
      "Đặt một thanh cố định ở khoảng giữa đùi và đứng tựa hai đùi vào thanh. Mỗi tay cầm một tạ ấm, để hai tay buông xuống.",
      "Đẩy hông ra sau, giữ gối gần thẳng và lưng thẳng. Cảm nhận độ căng ở cơ đùi sau.",
      "Khi cảm thấy căng, đẩy hông ra trước để trở lại tư thế đứng, vẫn giữ hai tạ ấm trong tay."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "228cb264-339b-452f-b857-0fa6829f7b22",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0c916fbaf3bede2c523832340443bb5ed1320a5cd6bf0c13082d6f382c5be786",
    "name": "Đứng kéo một tạ ấm lên ngực bằng hai tay",
    "description": "",
    "steps": [
      "Đứng hai chân rộng bằng vai, hai tay cầm một tạ ấm trước đùi.",
      "Giữ thân người thẳng đứng và gập khuỷu, dẫn hai khuỷu tay lên trên và ra ngoài để kéo tạ về phía ngực.",
      "Hạ tạ về trước đùi có kiểm soát rồi lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "3282f40b-df10-48c1-b38c-c5342300b511",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "8ab5aab394e7b9434395cf5b6561a53c84e5fc3850404ac84fb9b11e7c85ca73",
    "name": "Bật tách chân kết hợp đẩy bóng tạ qua đầu",
    "description": "",
    "steps": [
      "Đứng hai chân khép lại, hai tay giữ bóng tạ trước ngực.",
      "Bật hai chân tách sang hai bên đồng thời đẩy bóng qua đầu.",
      "Bật hai chân khép lại đồng thời hạ bóng về ngực. Lặp lại đủ số lần mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "365a565e-071e-4c31-866d-11c356dcd915",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3faaa2ab5bfd206aa91202e268391380ba91c8d4f96d34655917f5b220c2562e",
    "name": "Deadlift một chân cầm kẹp bánh tạ",
    "description": "",
    "steps": [
      "Mỗi tay cầm kẹp mép một bánh tạ ở hai bên người, giữ tay thẳng và đứng thăng bằng trên một chân.",
      "Gập người ra trước từ hông để hạ bánh tạ, giữ lưng thẳng và duỗi chân không trụ ra sau theo đường thẳng của lưng.",
      "Đẩy hông ra trước để đứng thẳng trở lại, đưa bàn chân không trụ về gần sàn và vẫn giữ bánh tạ trong tay."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "376acc8c-ec4f-4430-9f5d-283edba5d446",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "f14273315d3b9300d57e890c9da4c27ee3fc042bdf19b47b9232db23fc5e42ab",
    "name": "Đẩy tạ ấm kiểu guillotine trên ghế phẳng",
    "description": "",
    "steps": [
      "Nằm trên ghế phẳng, hai bàn chân đặt trên sàn, mỗi tay giữ một tạ ấm phía trên ngực.",
      "Gập khuỷu và hạ hai tạ về phía ngực trên, mở khuỷu tay sang hai bên.",
      "Đẩy cả hai tạ lên đến khi tay duỗi rồi lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "38081e8c-4479-422c-af21-70711e37f2cf",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "b0e553f4234e574b617e72dd766db3b9b40e6a28b22784acb5dc966b4047aba3",
    "name": "Gập hông tựa thanh với tạ ấm và chân trước chân sau",
    "description": "",
    "steps": [
      "Đặt một thanh cố định ở giữa đùi và tựa đùi chân tập vào thanh. Mỗi tay cầm một tạ ấm, để hai tay buông xuống.",
      "Đặt một chân ra sau, chỉ tì các ngón chân sau trên sàn. Giữ toàn bộ bàn chân trước trên sàn trong suốt động tác.",
      "Gập gối chân sau và đẩy hông ra sau với lưng thẳng, cảm nhận độ căng ở cơ đùi sau của chân trước.",
      "Khi cảm thấy căng, đẩy hông ra trước để trở lại tư thế đứng."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "3dd7655e-fe50-4bc0-8a9c-4dfe97492ff2",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "c3cca4446efb7bdf9b5d05929fa9680981848d68c74abb7315d968651a313b9c",
    "name": "Vung tạ ấm với chân trước chân sau",
    "description": "",
    "steps": [
      "Đứng một chân lùi nhẹ sau chân kia và hai tay cầm một tạ ấm. Gập hông để đưa tạ ra sau vào giữa hai chân.",
      "Đẩy hông mạnh ra trước để vung tạ lên ngang ngực.",
      "Để tạ vung trở lại giữa hai chân khi gập hông, giữ cơ trung tâm siết chặt và tư thế chân trước chân sau. Lặp lại đủ số lần mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "44233008-622d-462c-9e7e-13dc6de91e78",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e61107715a0085601ef3e5778af54896d6b29bc8958262e3d4b1905ad3e7c37d",
    "name": "Chống đẩy trên gối có bánh tạ trên lưng",
    "description": "",
    "steps": [
      "Bắt đầu với hai tay và hai gối làm điểm tựa, đặt một bánh tạ nằm phẳng trên lưng trên và duỗi hai tay.",
      "Gập khuỷu để hạ ngực về phía sàn, giữ cơ thể thẳng hàng từ vai đến gối và bánh tạ ổn định.",
      "Đẩy qua hai tay để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "5e581341-2be4-4dd5-91bc-4ce6a3890a74",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "395fdc1fbb3dc6b6ddb1a713504e925dfeb56a2d7813709631cecd4eeede6ceb",
    "name": "Nâng bánh tạ sang ngang",
    "description": "",
    "steps": [
      "Đứng hai chân rộng bằng vai, mỗi tay cầm một bánh tạ ở hai bên người.",
      "Giữ tay gần thẳng, nâng bánh tạ sang hai bên đến ngang vai.",
      "Hạ bánh tạ về hai bên người có kiểm soát. Lặp lại đủ số lần mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "6fc94c3a-eada-4f02-9128-13d0003aaf02",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0312f4f79b79a9101007d7cfbba402378a97865efa18a4f1379f54cd903ca254",
    "name": "Đứng dang chân với bánh tạ",
    "description": "",
    "steps": [
      "Đứng trên một chân bên cạnh điểm tựa chắc chắn, giữ bánh tạ áp vào mặt ngoài đùi chân tập và dùng tay còn lại để giữ thăng bằng.",
      "Nâng chân tập sang bên, giữ bánh tạ áp vào đùi, thân người ổn định và ngón chân hướng về trước.",
      "Từ từ hạ chân có kiểm soát, duy trì độ căng ở phía ngoài hông."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "75fced1a-7bea-421b-a6a2-acb55fbca87a",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "7139bc1299d828a934f8c2f9b25ccc0a1b300296b3094b0ca03f8a25f4d516a0",
    "name": "Đứng kéo hai tạ ấm lên ngực",
    "description": "",
    "steps": [
      "Đứng hai chân rộng bằng vai, mỗi tay cầm một tạ ấm trước đùi.",
      "Giữ thân người thẳng đứng và gập khuỷu, dẫn hai khuỷu tay lên trên và ra ngoài để kéo tạ về phía ngực.",
      "Hạ cả hai tạ về trước đùi có kiểm soát rồi lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "826bbbe8-65f9-4101-b9ab-aaa8fb2160cc",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0957b072e75135e86f8d2e82b302a89811488ebcff05ab7c59b7e0015e9efc38",
    "name": "Nâng hông một chân tựa bóng BOSU",
    "description": "",
    "steps": [
      "Tựa lưng trên lên mặt vòm của bóng BOSU, đặt đế phẳng của bóng trên sàn. Gập một gối và đặt bàn chân đó trên sàn, nhấc bàn chân còn lại lên.",
      "Đẩy qua bàn chân trụ để nâng hông, siết cơ mông và duỗi chân đang nhấc về trước.",
      "Hạ hông có kiểm soát rồi đổi chân."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "84c30e4f-4771-46b0-a5b4-4ca175293212",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "84ad717f074c29e9fd7921e8cfd78f8a3810c276d6bc04353eb9582bdfdaadf6",
    "name": "Đẩy tạ ấm kiểu guillotine trên ghế dốc lên",
    "description": "",
    "steps": [
      "Nằm tựa trên ghế dốc lên, hai bàn chân đặt trên sàn, mỗi tay giữ một tạ ấm phía trên ngực trên.",
      "Gập khuỷu và hạ hai tạ về phía ngực trên, mở khuỷu tay sang hai bên.",
      "Đẩy cả hai tạ lên đến khi tay duỗi rồi lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "91ab5fac-a2ad-4741-bfeb-097ae061fad8",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "19bd4242151df60e0a6edcd16de0649e5d7a0e993b2a45d3c80063b423d299cd",
    "name": "Đưa tạ ấm từ vị trí treo lên vai và đẩy có trợ lực chân",
    "description": "",
    "steps": [
      "Mỗi tay cầm một tạ ấm ngay phía trên gối, gập nhẹ hông và gối.",
      "Tạo lực từ hông và gối để đưa tạ lên vai, đón tạ ở trước vai với khuỷu tay gập.",
      "Nhún gối rồi duỗi chân để đưa tạ qua đầu, kết thúc với tay và chân duỗi. Hạ tạ về vai rồi về vị trí treo có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "9d621ff9-86fa-4c12-a454-a57bb829b92c",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "d3c3adf6414b91b1b67af47b58dcaf3d33c397864670e692d7ea905b598f3c8b",
    "name": "Ngồi xoay thân kiểu Nga với bánh tạ",
    "description": "",
    "steps": [
      "Ngồi trên sàn với gối gập, thân người hơi ngả ra sau và hai tay cầm một bánh tạ ở phía trước.",
      "Siết cơ trung tâm bằng cách kéo rốn về phía cột sống và giữ hai chân ổn định.",
      "Xoay thân trên sang phải, đưa bánh tạ theo và giữ lưng thẳng.",
      "Giữ một giây rồi xoay sang trái và giữ thêm một giây."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "d4611a2c-35b8-4aca-87e1-1d22785b0135",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "282ab2fb8a8aba68e262bcbb322fcc8a12419e5024d4cc40baa0765f4785b9ff",
    "name": "Squat kết hợp đẩy tạ ấm qua đầu luân phiên từng tay",
    "description": "",
    "steps": [
      "Mỗi tay giữ một tạ ấm ngang vai, lòng bàn tay hướng vào trong.",
      "Squat xuống rồi đẩy người lên và đưa một tạ qua đầu, giữ tạ còn lại ở vai.",
      "Hạ tạ đang nâng về vai khi hạ vào lần squat tiếp theo, sau đó đẩy bằng tay kia. Tiếp tục đổi tay sau mỗi lần."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "e03cd0c4-0f3d-4a92-8dec-440025ac5704",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "52b50dc3648162d5af0104216a24418bd1a95f3433390db74861c53af5d8e6e2",
    "name": "Squat kết hợp đẩy hai tạ ấm qua đầu",
    "description": "",
    "steps": [
      "Đứng hai chân rộng bằng vai, mỗi tay cầm một tạ ấm.",
      "Đưa tạ lên vai, lòng bàn tay hướng vào trong và khuỷu tay gập.",
      "Giữ tạ ở vai, gập hông và gối để hạ vào tư thế squat.",
      "Duỗi hông và gối để đẩy người lên, dùng đà đó đưa cả hai tạ qua đầu.",
      "Hạ tạ về vai có kiểm soát và lặp lại đủ số lần mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "ec7aad3e-6eed-46db-ae51-54886881851e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "bcf968045f2e5fbac698799e6bc7efb266bbcbaf4339dc2c0f9bcfdd539274f0",
    "name": "Nâng hông tựa bóng BOSU",
    "description": "",
    "steps": [
      "Tựa lưng trên lên mặt vòm của bóng BOSU, đặt đế phẳng của bóng trên sàn. Gập cả hai gối và đặt hai bàn chân trên sàn.",
      "Đẩy qua hai bàn chân để nâng hông, siết cơ mông và giữ lưng trên tựa vào bóng BOSU.",
      "Hạ hông có kiểm soát để hoàn thành một lần."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "ee2d4de5-6715-4579-9d77-1c6bd3e6dcc0",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "afbd8898385d5de52c1c0d7382dc6f8060cbd6b823ece3fc16c9a3f9335ea242",
    "name": "Gập bụng ngồi dậy cầm bóng BOSU",
    "description": "",
    "steps": [
      "Nằm ngửa trên sàn, hai chân duỗi, hai tay cầm mép bóng BOSU phía trên ngực.",
      "Siết cơ trung tâm và ngồi dậy, giữ tay duỗi và bóng BOSU nâng phía trên người.",
      "Hạ thân người về sàn có kiểm soát, vẫn giữ bóng BOSU trong tay."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "eeea366a-c885-4a83-b819-46e04daa94d6",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "295b2f19573f3b4fe98915f49319ce32c35d25597f05df1ed4de992ef2666d93",
    "name": "Gập hông tựa thanh với bánh tạ và chân trước chân sau",
    "description": "",
    "steps": [
      "Đặt một thanh cố định ở giữa đùi và tựa đùi chân tập vào thanh. Hai tay giữ một bánh tạ áp vào ngực.",
      "Đặt một chân ra sau, chỉ tì các ngón chân sau trên sàn. Giữ toàn bộ bàn chân trước trên sàn trong suốt động tác.",
      "Gập gối chân sau và đẩy hông ra sau với lưng thẳng, cảm nhận độ căng ở cơ đùi sau của chân trước.",
      "Khi cảm thấy căng, đẩy hông ra trước để trở lại tư thế đứng."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "f0f0397a-da6c-466d-9dd7-f28db52fe91a",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ff8b959332acfcede0293c1696fd44ad079f2b499712f0830a6cb1cbe2cf614c",
    "name": "Ném bóng tạ sang bên với bạn tập",
    "description": "",
    "steps": [
      "Đứng cạnh bạn tập, cả hai cùng hướng về trước, hai tay cầm bóng tạ.",
      "Xoay thân người về phía bạn tập và ném bóng sang bên cho họ.",
      "Bắt bóng được chuyền lại, đưa bóng về phía hông ngoài rồi xoay về phía bạn tập và ném trả."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
  },
  {
    "exercise_id": "f5b86cc6-a245-497d-ac5c-edacddb14500",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "86d65b3e4fda79ce218a1d5d818907427af08d51ad0712cbae1875a67f9cf3be",
    "name": "Chống đẩy tăng biên độ trên hai bánh tạ",
    "description": "",
    "steps": [
      "Đặt hai bánh tạ nằm phẳng trên sàn, cách nhau để mỗi tay đặt trên một bánh và có khoảng trống ở giữa. Bắt đầu trong tư thế chống đẩy, các ngón chân trên sàn và thân người thẳng.",
      "Gập khuỷu và vai để hạ ngực vào khoảng trống đến khi cánh tay trên đi hơi ra sau thân người.",
      "Đẩy qua hai tay để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:51:18.770Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 22
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 22
    or (select count(*) from _noi_gym_restore_translations) <> 22
    or (select count(*) from _noi_gym_restore_before) <> 22 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 22 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1859, VI 1858, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
