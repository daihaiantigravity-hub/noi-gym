-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 18 reviewed instruction corrections and insert 18 reviewed VI translations.
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
    "exercise_id": "29ad0a17-31c2-413e-b894-80901728c28e",
    "source_id": 159684877693999,
    "before_hash": "e8f211bf3e99514a20530db3425d893f9278c34e9fd5586cc7be5d8cf453c72c",
    "after_hash": "2ee0b880175879b195bdc3426838ec173ec77159aec11bb7ca31809b98ce3f0f",
    "expected_updated_at": "2026-10-14T10:47:17.52949+00:00",
    "steps": [
      "Anchor the band above head level, grasp it with both hands, and take a few steps back until it is taut.",
      "Push your hips back slightly, keeping your back straight. With your elbows slightly bent, pull your hands down toward your thighs, then return them forward and up under control."
    ]
  },
  {
    "exercise_id": "2a854fdd-57fa-4f00-822d-4d119cdd1919",
    "source_id": 206877899312911,
    "before_hash": "306898fd42ac3fdd19ce10b8142a327c93cff46a89d2a5516e986f49bdbd7856",
    "after_hash": "61749af2f0ee29b69c418ddd7e9d7d7a59ebc76b5c692a9bc6396e3b0327926d",
    "expected_updated_at": "2026-10-14T10:47:27.110135+00:00",
    "steps": [
      "Loop the band around your arms near the elbows, with your elbows bent 90 degrees at your sides.",
      "Raise both elbows outward to shoulder height.",
      "Lower both elbows slowly together, keeping tension on the band."
    ]
  },
  {
    "exercise_id": "480cf1bf-b9cf-4dd8-879a-b32a33b51164",
    "source_id": 51426087015402,
    "before_hash": "1dc83706c731ecce32d4f7debde976b1ad9f26ae6cca2a45f1fc4918a96e998c",
    "after_hash": "3a15927b42ffd64e76f00842c395f2783ba1e93f1f1545ed4b4f2312f8bcf376",
    "expected_updated_at": "2026-10-14T10:46:54.804766+00:00",
    "steps": [
      "Attach a handle to each cable and place a bench in the center of the cable crossover. Sit with your back supported and the pulleys above your seated shoulder height.",
      "Bring both handles to the sides of your chest, keeping your feet on the floor.",
      "Press the handles forward and down toward your thighs as you extend your elbows, then bend your elbows to return the handles to your chest under control."
    ]
  },
  {
    "exercise_id": "5513598d-250b-4e4a-b652-7f63d836354c",
    "source_id": 62380103012090,
    "before_hash": "aff1d4e668fdb8b39ff31d99de07c9461eab3418d1d63ad0757643ff0d6c8bfa",
    "after_hash": "c7bdbea039eed0df505342192ed962b6c7636a5cc83662e5296aaae3b242906d",
    "expected_updated_at": "2026-10-14T10:46:57.696503+00:00",
    "steps": [
      "Use the bar attachment with the cable set at the top of the machine. Grasp the bar with an underhand grip, palms facing up.",
      "Keep your upper arms at your sides and extend your elbows to press the bar down until you feel your triceps contract. Bend your elbows to return the bar under control."
    ]
  },
  {
    "exercise_id": "81857c43-9f25-4920-9a6a-c3bd2e085845",
    "source_id": 255880052505487,
    "before_hash": "5b47fa240ee495f6abcab3b60ecbf6e9fa714bf66cafd12cd27015232ad95dae",
    "after_hash": "78abfbb8979ffbbfbe9fb36c49e0135fa78bedc59a73f751c50c5fea9adbedfb",
    "expected_updated_at": "2026-10-14T10:47:37.1762+00:00",
    "steps": [
      "Stand with your feet shoulder-width apart on the band, holding its loop with both hands together in front of your chest.",
      "Push your hips back and bend your knees to lower into a squat, keeping your hands in front of your chest.",
      "Aim for your thighs to be parallel with the ground, then stand back up. If you cannot judge your depth, squat in front of a mirror to check your form."
    ]
  },
  {
    "exercise_id": "a07af0fa-0508-40f1-81a7-1f5103d4ec84",
    "source_id": 141734498064932,
    "before_hash": "5a6f28befb91963d0636ea78731119b61626226c6181804a9cd42fff1e738589",
    "after_hash": "1865beb2f7cefd3c8d8decde6b49cf01f10f8110c2c2d0e572f7dee937335b82",
    "expected_updated_at": "2026-10-14T10:47:13.652288+00:00",
    "steps": [
      "Sit with your back against the machine pad and grasp the handles with a neutral grip, palms facing each other.",
      "Adjust the machine so that you can move the handles through a comfortable range of motion while keeping your back supported.",
      "Press the handles forward until your elbows are extended without hyperextending them, then bend your elbows to return under control."
    ]
  },
  {
    "exercise_id": "aa60deef-61f5-467f-97dd-bfdc281f1b84",
    "source_id": 47229792719080,
    "before_hash": "085c5c970b040738e25c7fa08cfdb17633449b1fbc59d181a6ed174d5c7c48e0",
    "after_hash": "0fafe72ea56f11ddf6753a79d0c7c5e1a7c84cbb6d1313764721d091f9e23a34",
    "expected_updated_at": "2026-10-14T10:46:53.83898+00:00",
    "steps": [
      "Sit with your back against the machine pad and grasp the handles with an overhand grip.",
      "Adjust the machine so that you can move the handles through a comfortable range of motion while keeping your back supported.",
      "Press the handles forward until your elbows are extended without hyperextending them, then bend your elbows to return under control."
    ]
  },
  {
    "exercise_id": "b1e3970b-f516-4f25-b513-265d7a1ffd16",
    "source_id": 198600380293318,
    "before_hash": "2667fc92974c6ab46419849b5ae6c1570410a5440a66b132c10b72177ba85634",
    "after_hash": "15ae62aadc897afa49ba5af11e30b99fe1feb7f5db83092cb814d454d3255117",
    "expected_updated_at": "2026-10-14T10:47:25.557981+00:00",
    "steps": [
      "Anchor the band at shoulder height. Grasp it with both hands in front of you and take a few steps back until it is taut.",
      "Keeping your elbows straight, draw your shoulder blades back toward each other. Then let your shoulder blades move forward to return to the starting position."
    ]
  },
  {
    "exercise_id": "b571d4f6-5ab3-4966-9a77-3f94fb95294a",
    "source_id": 279243581254608,
    "before_hash": "75cc629833f94d16947fc06414564bef3902c4ba0ff2e61f03e9b05d2fe826a8",
    "after_hash": "428e64688d00feb5118376422da70ca9c49c0802a71b849cb3f786cd8b2269e7",
    "expected_updated_at": "2026-10-14T10:47:41.74565+00:00",
    "steps": [
      "Place one knee on the machine's support pad and lean your upper body onto the front pads. Position the working leg under the padded lever, with the roller below your calf.",
      "Hold the machine handles for support and bend the working knee to raise the lever, bringing your heel toward your glutes.",
      "Pause at the top, then slowly extend the working knee to return to the starting position."
    ]
  },
  {
    "exercise_id": "bda7dc7d-68fa-492d-afea-8cbe8bca7d23",
    "source_id": 217833031863459,
    "before_hash": "0c1ddf078f21f9fc55d3424dde9a48b8095ec68c6010f09d2418f2fd1f071d9f",
    "after_hash": "550240ddc755da29321030b073d233034ed3679738115a4459f0b3e3fd934314",
    "expected_updated_at": "2026-10-14T10:47:29.182016+00:00",
    "steps": [
      "Set the cable at the bottom of the machine and fasten the ankle attachment to your working leg.",
      "Support yourself on both hands and the opposite knee, extending the working leg behind you with the cable taut.",
      "Move the working leg outward from your hip, keeping your torso steady.",
      "Return the leg under control, keeping the working foot off the floor and maintaining tension on the cable."
    ]
  },
  {
    "exercise_id": "bf20011e-fd35-4fa5-8ebb-10d585dd13a5",
    "source_id": 231725204196654,
    "before_hash": "336f2660f42b79f2ef2581cb2745809be741386dbd1e0fee03cd3f8ad248fe65",
    "after_hash": "ea396144ffaf23b32e0416dd218ff581e2e41003b86d6285eee754abc4cce2a8",
    "expected_updated_at": "2026-10-14T10:47:32.272137+00:00",
    "steps": [
      "Stand with one foot forward on the mini band. Hinge forward with a flat back, hold the band in one hand, and support your free hand on your front thigh.",
      "Pull the band toward your waist by bending your elbow and drawing it back, then lower your hand under control while keeping your core engaged."
    ]
  },
  {
    "exercise_id": "c169df11-87fc-4350-8d79-dc759d11b549",
    "source_id": 22062669979052,
    "before_hash": "bbdeefdf842c7f8caf7a1a50ebd4f92a411e059ddad7b7ed0f99ac73519727e1",
    "after_hash": "9bb5fbc30a9f978df18208c52da5a71c20cbefc00f625e62d5ac75111897534b",
    "expected_updated_at": "2026-10-14T10:46:48.307077+00:00",
    "steps": [
      "Attach the band to a stable low anchor point.",
      "Stand side-on to the anchor and loop the band around the ankle nearest to it. Keep your other foot planted for support.",
      "Pull the banded leg inward toward the midline of your body, then return it outward under control. Repeat for the desired number of repetitions."
    ]
  },
  {
    "exercise_id": "d09ab5d4-11a7-470f-bdfb-ebde9e49b290",
    "source_id": 111854121327837,
    "before_hash": "fa5f7e66c8b9a8d1e78078041ee9e0370877609af680f9fb37ce0205c7680686",
    "after_hash": "e194177549097725480dfb704bba788169aa68effd439b9ad814e2f9a32dd1c6",
    "expected_updated_at": "2026-10-14T10:47:08.241443+00:00",
    "steps": [
      "Loop the band around your upper back and hold an end in each hand beside your chest, with your elbows bent.",
      "Press both hands forward until your arms are extended in front of your chest, then bend your elbows to return under control."
    ]
  },
  {
    "exercise_id": "dbb91c4a-21b8-4a68-b2ca-f7acb5b7fded",
    "source_id": 178672190129734,
    "before_hash": "e3d3a1dded5d8cba46211e0741dd44d148cb4860c9800fd9bf49aef07bbe7030",
    "after_hash": "988b01869a6c12fda6a7cc49bb145663f14b29402e5f3009046c82af7e95efb1",
    "expected_updated_at": "2026-10-14T10:47:22.02044+00:00",
    "steps": [
      "Anchor the band behind you at about shoulder height. Stand with one foot forward and hold an end in each hand with your palms facing down and your arms open to the sides.",
      "Keeping your elbows slightly bent, bring your hands together in front of your chest.",
      "Pause briefly, then slowly open your arms back out to the sides, maintaining the same grip and tension on the band."
    ]
  },
  {
    "exercise_id": "df80b49f-2768-4b16-adc6-f5a24f0ee221",
    "source_id": 53098298287738,
    "before_hash": "e0fd5acad70fc3918d98ace8bbfdea60fd1ea93ab47298bab7a07b836350e218",
    "after_hash": "633cfe88f1359c5aebf66000de5eb24363c926b2b5044c25cc5e0fbb02e06cc4",
    "expected_updated_at": "2026-10-14T10:46:55.264381+00:00",
    "steps": [
      "Stand with your feet shoulder-width apart on the band, holding an end in each hand at your sides.",
      "Push your hips back and bend your knees to lower into a squat, keeping your hands at your sides.",
      "Aim for your thighs to be parallel with the ground, then stand back up. If you cannot judge your depth, squat in front of a mirror to check your form."
    ]
  },
  {
    "exercise_id": "e702fe77-adf6-4cdb-9b92-037b0150abb3",
    "source_id": 42118543259676,
    "before_hash": "8ecedbedf6d50a6cbea3e0e33b3339de76f7ee1cc601ac2ce9aa289eca3bac7f",
    "after_hash": "505285344d58f44f469b0b4d981edc1694d6da7765ee855f572d1ee539d7672e",
    "expected_updated_at": "2026-10-14T10:46:52.670416+00:00",
    "steps": [
      "Set the cable at the bottom of the machine and attach the ankle cuff to the leg nearest the machine. Stand side-on, keeping your other foot planted and holding the frame for support.",
      "Pull the attached leg inward across the front of your supporting leg, then return it outward under control. Repeat for the desired number of repetitions."
    ]
  },
  {
    "exercise_id": "eb589db7-6217-4ecb-b087-7fab222e4942",
    "source_id": 67495986739964,
    "before_hash": "8c4a25ceb957723f3f6fc2e9c98412e9917c6fbd82a9dc03c0960dd601df4bc9",
    "after_hash": "66b42c5c45a92b34a10b4f5a646b1684ce4c14f5302ebd92baaca2c70b81fead",
    "expected_updated_at": "2026-10-14T10:46:58.82733+00:00",
    "steps": [
      "Stand facing the Ski Erg with your feet apart and grasp a handle in each hand, reaching your hands up to begin the stroke.",
      "Pull both handles down toward your thighs as you hinge at the hips and bend your knees, keeping your feet planted.",
      "Stand back up and let your hands travel forward and up to reset, then repeat the pulling motion."
    ]
  },
  {
    "exercise_id": "ff006eef-2a90-4966-bcac-84a7d65a0257",
    "source_id": 148413715317029,
    "before_hash": "c04b67aca9588902d8bfd10259a5b01e93c50014e1e0e06ec3b446ca8d5daedf",
    "after_hash": "158f0949d2989bab4b00d5bebe4bc2906c12dd5aace7c8890cce660688bc7157",
    "expected_updated_at": "2026-10-14T10:47:15.101384+00:00",
    "steps": [
      "Attach the band to an anchor at about shoulder height. Hold it in one hand with your arm open to the side and take a few steps away until the band is taut.",
      "Keeping a slight bend in your elbow, bring your arm across the front of your chest until you feel your pecs contract, then return it outward under control."
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
    "exercise_id": "29ad0a17-31c2-413e-b894-80901728c28e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "2ee0b880175879b195bdc3426838ec173ec77159aec11bb7ca31809b98ce3f0f",
    "name": "Kéo dây kháng lực từ trên xuống",
    "description": "",
    "steps": [
      "Neo dây kháng lực cao hơn đầu, hai tay nắm dây và lùi lại vài bước đến khi dây căng.",
      "Đẩy hông nhẹ ra sau, giữ lưng thẳng. Giữ khuỷu tay hơi gập, kéo hai tay xuống về phía đùi rồi đưa tay ra trước và lên trên có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "2a854fdd-57fa-4f00-822d-4d119cdd1919",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "61749af2f0ee29b69c418ddd7e9d7d7a59ebc76b5c692a9bc6396e3b0327926d",
    "name": "Nâng tay sang ngang gập khuỷu với dây kháng lực ngắn",
    "description": "",
    "steps": [
      "Vòng dây quanh hai tay gần khuỷu, giữ hai khuỷu tay gập 90 độ ở hai bên người.",
      "Nâng cả hai khuỷu tay sang hai bên đến ngang vai.",
      "Từ từ hạ đồng thời cả hai khuỷu tay, giữ dây căng."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "480cf1bf-b9cf-4dd8-879a-b32a33b51164",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3a15927b42ffd64e76f00842c395f2783ba1e93f1f1545ed4b4f2312f8bcf376",
    "name": "Đẩy ngực chéo xuống với cáp",
    "description": "",
    "steps": [
      "Gắn tay cầm vào mỗi bên cáp và đặt ghế ở giữa máy cáp đôi. Ngồi tựa lưng, điều chỉnh ròng rọc cao hơn vai khi ngồi.",
      "Đưa hai tay cầm về hai bên ngực, giữ hai bàn chân trên sàn.",
      "Đẩy hai tay cầm ra trước và chéo xuống về phía đùi khi duỗi khuỷu tay, sau đó gập khuỷu để đưa tay cầm về ngực có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "5513598d-250b-4e4a-b652-7f63d836354c",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "c7bdbea039eed0df505342192ed962b6c7636a5cc83662e5296aaae3b242906d",
    "name": "Duỗi tay sau với thanh cáp nắm ngửa",
    "description": "",
    "steps": [
      "Dùng thanh gắn cáp và đặt cáp ở vị trí cao nhất của máy. Nắm thanh bằng kiểu nắm ngửa, lòng bàn tay hướng lên.",
      "Giữ cánh tay trên sát hai bên người và duỗi khuỷu để đẩy thanh xuống đến khi cảm nhận cơ tay sau co lại. Gập khuỷu để đưa thanh trở về có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "81857c43-9f25-4920-9a6a-c3bd2e085845",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "78abfbb8979ffbbfbe9fb36c49e0135fa78bedc59a73f751c50c5fea9adbedfb",
    "name": "Squat giữ dây kháng lực trước ngực",
    "description": "",
    "steps": [
      "Đứng hai chân rộng bằng vai trên dây kháng lực, hai tay nắm cùng vòng dây trước ngực.",
      "Đẩy hông ra sau và gập gối để hạ vào tư thế squat, giữ hai tay trước ngực.",
      "Cố gắng hạ đến khi hai đùi song song với sàn rồi đứng lên trở lại. Nếu khó xác định độ sâu, hãy squat trước gương để kiểm tra tư thế."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "a07af0fa-0508-40f1-81a7-1f5103d4ec84",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "1865beb2f7cefd3c8d8decde6b49cf01f10f8110c2c2d0e572f7dee937335b82",
    "name": "Đẩy ngực trên máy nắm trung tính",
    "description": "",
    "steps": [
      "Ngồi tựa lưng vào đệm máy và nắm tay cầm bằng kiểu nắm trung tính, hai lòng bàn tay hướng vào nhau.",
      "Điều chỉnh máy để di chuyển tay cầm trong biên độ thoải mái mà lưng vẫn tựa vào đệm.",
      "Đẩy tay cầm ra trước đến khi khuỷu tay duỗi thẳng nhưng không quá duỗi, sau đó gập khuỷu để trở về có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "aa60deef-61f5-467f-97dd-bfdc281f1b84",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0fafe72ea56f11ddf6753a79d0c7c5e1a7c84cbb6d1313764721d091f9e23a34",
    "name": "Đẩy ngực trên máy",
    "description": "",
    "steps": [
      "Ngồi tựa lưng vào đệm máy và nắm tay cầm bằng kiểu nắm sấp.",
      "Điều chỉnh máy để di chuyển tay cầm trong biên độ thoải mái mà lưng vẫn tựa vào đệm.",
      "Đẩy tay cầm ra trước đến khi khuỷu tay duỗi thẳng nhưng không quá duỗi, sau đó gập khuỷu để trở về có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "b1e3970b-f516-4f25-b513-265d7a1ffd16",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "15ae62aadc897afa49ba5af11e30b99fe1feb7f5db83092cb814d454d3255117",
    "name": "Kéo bả vai ra sau với dây kháng lực ngang",
    "description": "",
    "steps": [
      "Neo dây kháng lực ngang vai. Hai tay nắm dây ở trước người và lùi lại vài bước đến khi dây căng.",
      "Giữ khuỷu tay thẳng, kéo hai bả vai ra sau và về phía nhau. Sau đó đưa bả vai ra trước để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "b571d4f6-5ab3-4966-9a77-3f94fb95294a",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "428e64688d00feb5118376422da70ca9c49c0802a71b849cb3f786cd8b2269e7",
    "name": "Quỳ gập gối tập đùi sau trên máy gắn bánh tạ",
    "description": "",
    "steps": [
      "Đặt một gối lên đệm đỡ của máy và tựa thân trên vào các đệm phía trước. Đặt chân tập dưới cần đệm sao cho con lăn nằm bên dưới bắp chân.",
      "Nắm tay cầm máy để giữ vững và gập gối chân tập để nâng cần, đưa gót chân về phía mông.",
      "Dừng ở vị trí trên cùng, sau đó từ từ duỗi gối chân tập để trở về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "bda7dc7d-68fa-492d-afea-8cbe8bca7d23",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "550240ddc755da29321030b073d233034ed3679738115a4459f0b3e3fd934314",
    "name": "Chống tay quỳ dang chân với cáp",
    "description": "",
    "steps": [
      "Đặt cáp ở vị trí thấp nhất của máy và gắn đai cổ chân vào chân tập.",
      "Chống cả hai tay và gối bên đối diện, duỗi chân tập ra sau sao cho cáp căng.",
      "Dang chân tập sang bên từ khớp hông, giữ thân người ổn định.",
      "Đưa chân trở về có kiểm soát, giữ bàn chân tập không chạm sàn và duy trì độ căng của cáp."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "bf20011e-fd35-4fa5-8ebb-10d585dd13a5",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ea396144ffaf23b32e0416dd218ff581e2e41003b86d6285eee754abc4cce2a8",
    "name": "Gập người kéo một tay với dây kháng lực ngắn",
    "description": "",
    "steps": [
      "Đứng một chân trước, đạp lên dây kháng lực ngắn. Gập người ra trước với lưng phẳng, một tay nắm dây và tay còn lại tựa lên đùi trước.",
      "Gập khuỷu và kéo ra sau để đưa dây về phía eo, sau đó hạ tay có kiểm soát, giữ cơ trung tâm siết chặt."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "c169df11-87fc-4350-8d79-dc759d11b549",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "9bb5fbc30a9f978df18208c52da5a71c20cbefc00f625e62d5ac75111897534b",
    "name": "Đứng khép chân với dây kháng lực",
    "description": "",
    "steps": [
      "Gắn dây kháng lực vào một điểm neo thấp, chắc chắn.",
      "Đứng nghiêng bên cạnh điểm neo và vòng dây quanh cổ chân gần điểm neo nhất. Giữ bàn chân còn lại trên sàn làm điểm tựa.",
      "Kéo chân có dây vào trong về phía đường giữa cơ thể, sau đó đưa chân ra ngoài trở lại có kiểm soát. Lặp lại đủ số lần mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "d09ab5d4-11a7-470f-bdfb-ebde9e49b290",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e194177549097725480dfb704bba788169aa68effd439b9ad814e2f9a32dd1c6",
    "name": "Đứng đẩy ngực với dây kháng lực",
    "description": "",
    "steps": [
      "Vòng dây kháng lực qua lưng trên và cầm mỗi đầu dây bằng một tay ở hai bên ngực, giữ khuỷu tay gập.",
      "Đẩy cả hai tay ra trước đến khi tay duỗi trước ngực, sau đó gập khuỷu để trở về có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "dbb91c4a-21b8-4a68-b2ca-f7acb5b7fded",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "988b01869a6c12fda6a7cc49bb145663f14b29402e5f3009046c82af7e95efb1",
    "name": "Ép ngực xoay trong vai với dây kháng lực",
    "description": "",
    "steps": [
      "Neo dây kháng lực ở phía sau ngang khoảng vai. Đứng một chân trước, mỗi tay nắm một đầu dây với lòng bàn tay hướng xuống và hai tay mở sang hai bên.",
      "Giữ khuỷu tay hơi gập, đưa hai tay khép lại trước ngực.",
      "Dừng ngắn rồi từ từ mở tay trở lại hai bên, giữ nguyên kiểu nắm và độ căng của dây."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "df80b49f-2768-4b16-adc6-f5a24f0ee221",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "633cfe88f1359c5aebf66000de5eb24363c926b2b5044c25cc5e0fbb02e06cc4",
    "name": "Squat với dây kháng lực",
    "description": "",
    "steps": [
      "Đứng hai chân rộng bằng vai trên dây kháng lực, mỗi tay nắm một đầu dây ở hai bên người.",
      "Đẩy hông ra sau và gập gối để hạ vào tư thế squat, giữ hai tay ở hai bên người.",
      "Cố gắng hạ đến khi hai đùi song song với sàn rồi đứng lên trở lại. Nếu khó xác định độ sâu, hãy squat trước gương để kiểm tra tư thế."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "e702fe77-adf6-4cdb-9b92-037b0150abb3",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "505285344d58f44f469b0b4d981edc1694d6da7765ee855f572d1ee539d7672e",
    "name": "Đứng khép chân với cáp",
    "description": "",
    "steps": [
      "Đặt cáp ở vị trí thấp nhất của máy và gắn đai cổ chân vào chân gần máy nhất. Đứng nghiêng bên cạnh máy, giữ bàn chân còn lại trên sàn và vịn khung máy để giữ vững.",
      "Kéo chân gắn cáp vào trong, đi ngang phía trước chân trụ, sau đó đưa chân ra ngoài trở lại có kiểm soát. Lặp lại đủ số lần mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "eb589db7-6217-4ecb-b087-7fab222e4942",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "66b42c5c45a92b34a10b4f5a646b1684ce4c14f5302ebd92baaca2c70b81fead",
    "name": "Tập tim mạch với máy Ski Erg",
    "description": "",
    "steps": [
      "Đứng hướng về máy Ski Erg, hai chân tách nhau, mỗi tay nắm một tay cầm và vươn tay lên để bắt đầu lượt kéo.",
      "Kéo cả hai tay cầm xuống về phía đùi đồng thời gập hông và gối, giữ hai bàn chân trên sàn.",
      "Đứng thẳng trở lại, đưa tay ra trước và lên trên để về tư thế ban đầu, sau đó lặp lại động tác kéo."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
  },
  {
    "exercise_id": "ff006eef-2a90-4966-bcac-84a7d65a0257",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "158f0949d2989bab4b00d5bebe4bc2906c12dd5aace7c8890cce660688bc7157",
    "name": "Ép ngực một tay với dây kháng lực",
    "description": "",
    "steps": [
      "Gắn dây kháng lực vào điểm neo ngang khoảng vai. Một tay nắm dây với cánh tay mở sang bên và bước ra xa vài bước đến khi dây căng.",
      "Giữ khuỷu tay hơi gập, đưa cánh tay qua trước ngực đến khi cảm nhận cơ ngực co lại, sau đó đưa tay mở ra ngoài trở lại có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T06:20:40.151Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 18
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 18
    or (select count(*) from _noi_gym_restore_translations) <> 18
    or (select count(*) from _noi_gym_restore_before) <> 18 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 18 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1837, VI 1836, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
