-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Apply 27 reviewed instruction corrections and insert 27 reviewed VI translations.
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
    "exercise_id": "02340348-9464-4339-a68c-2a4babd72437",
    "source_id": 198877323338800,
    "before_hash": "67fc1e99d5915a66454fa011b402923596b66ee62249c0af198c59bf8c95c277",
    "after_hash": "7066a76a73cb65c2e5ef5db2c5e4761c7314cf207e78e49696c1736533f4f775",
    "expected_updated_at": "2026-10-14T10:47:25.691821+00:00",
    "steps": [
      "Lie on your back with the soles of your feet together and your bent knees open to the sides. Place your hands behind your head.",
      "Contract your abs to curl your shoulders and upper back off the floor, then lower under control while keeping your feet together and knees open."
    ]
  },
  {
    "exercise_id": "1244468a-2bcf-4569-87d0-3f0ab747c061",
    "source_id": 177554052490913,
    "before_hash": "0142e39ed206f72adb8f60241eefc8e78e044138d974309de934dcd38f761d77",
    "after_hash": "f5fa2c5a82a3e5628e070f0946e2cbec8f8d279429dac5459326f533f3088185",
    "expected_updated_at": "2026-10-14T10:47:21.797308+00:00",
    "steps": [
      "Stand on the machine platform and hold the handles for support. Adjust the roller so it contacts the inside of your working thigh above the knee.",
      "Keep your supporting foot planted and position your working leg out to the side against the roller.",
      "Press your working leg inward toward your supporting leg, then return it outward under control while keeping your torso steady."
    ]
  },
  {
    "exercise_id": "1ab4a56e-891e-451d-9eea-1d7fa2a966a5",
    "source_id": 162868923018165,
    "before_hash": "2fd4206389305cd35c7e7449dcc2fa67cc1ea56dde0b66dde394f807350e4f54",
    "after_hash": "0171d5ca2a70980acd2d2a6c96779250a333d011c3a3c57bea821e84f1653e33",
    "expected_updated_at": "2026-10-14T10:47:18.033228+00:00",
    "steps": [
      "Stand with your heels supported on a weight plate and your forefeet extending beyond its edge. Hold a barbell securely across your upper back.",
      "Keep your heels on the plate and lift your toes and forefeet toward the ceiling.",
      "Hold briefly at the top, then lower your forefeet back toward the floor under control, keeping your heels supported."
    ]
  },
  {
    "exercise_id": "1ac2a75c-8126-43ec-9329-9cfcf97cfd38",
    "source_id": 80009045324079,
    "before_hash": "f46440bf4980aa73d594e37830af8bb6158f1cd358263ef0d59a29cbff3495ba",
    "after_hash": "9b6ba898372761e437ad6ee553f48b9cb7c63045cda47e7c8e9e2fe4e8cfd297",
    "expected_updated_at": "2026-10-14T10:47:01.197104+00:00",
    "steps": [
      "Sit in the machine with your legs apart and the pads against your inner thighs near the knees. Adjust the seat and pads to a comfortable starting position.",
      "Squeeze your legs together against the pads, focusing on your inner thighs, and pause briefly when the pads are close together.",
      "Return to the starting position slowly without letting the weights slam. Repeat for the desired repetitions and sets."
    ]
  },
  {
    "exercise_id": "2f1ce748-9a71-4e2d-8426-a6e2f1675c4d",
    "source_id": 265787503621074,
    "before_hash": "9ea02d12e689f487fd0ea1d1f68e4918e0ce2a47057e395d2247fca262e05804",
    "after_hash": "ab6da7603367383603b5d97867a957854a9792d72d89d99afc6ededf03f81d1b",
    "expected_updated_at": "2026-10-14T10:47:39.058464+00:00",
    "steps": [
      "Sit on a bench with your bare working foot on the floor and your heel supported.",
      "Lift your big toe slightly and move it sideways away from your other toes, keeping the rest of your foot steady.",
      "Use a small, controlled movement, then return your big toe to the starting position.",
      "You can use a line on the floor as a reference for the toe's movement."
    ]
  },
  {
    "exercise_id": "383ce0cd-9e08-495c-9725-a44955247ec1",
    "source_id": 277110802770001,
    "before_hash": "4bd72c57134dab4e09f56817d711d38143722a2aca9d57cc6d5d0024ef6de423",
    "after_hash": "bb991c22f5386950e915ba6f140b49e605035393c58a49055d013cac35541e3b",
    "expected_updated_at": "2026-10-14T10:47:41.350255+00:00",
    "steps": [
      "Start in a high plank with your hands under your shoulders and your arms straight.",
      "Place your feet about shoulder-width apart. A wider stance provides more support; a narrower stance makes balancing harder.",
      "Reach one arm forward and lift the opposite leg behind you, then return your hand and foot to the floor and switch sides.",
      "Keep your hips level and your back steady without rounding or arching throughout the movement."
    ]
  },
  {
    "exercise_id": "4afdffa4-fabb-4a73-8878-160d38555407",
    "source_id": 19389924243878,
    "before_hash": "6688152dd3c6c6bb823174c8ea1d07ba89bc392ca3794050f50e821f458bf7f4",
    "after_hash": "4400778181e02cacd9d7901e640793cb7bfa698e950de9ec35d6c408c65961b9",
    "expected_updated_at": "2026-10-14T10:46:47.601929+00:00",
    "steps": [
      "Stand with your feet slightly wider than shoulder-width apart and hold a pole overhead with a wide overhand grip and your arms extended.",
      "Bend your hips and knees to begin the squat, keeping your core engaged and the pole balanced overhead.",
      "Lower into the squat while keeping the pole overhead, then push through your feet to return to standing.",
      "Repeat for the desired repetitions, keeping your back straight, chest lifted and the pole steady throughout."
    ]
  },
  {
    "exercise_id": "4dfd84e1-792e-4d3f-9acf-d6cabf5b3115",
    "source_id": 65290127734165,
    "before_hash": "13adeb855ff422d273c1ed85251ff6fa8b4aed33339761c6e94a7df96fa800fd",
    "after_hash": "3af716b13398650f4df5bec9f933a939707e79c74c6f43a7629447a92a17ef28",
    "expected_updated_at": "2026-10-14T10:46:58.597792+00:00",
    "steps": [
      "Stand on one leg and hold an upright pole for balance. Raise the other knee in front of you with the thigh near parallel to the floor.",
      "Guide the raised knee out to the side and back inward in a smooth looping path, keeping your standing foot planted and your torso steady.",
      "Let the knee lead while the ankle follows, continuing the loop under control before lowering the foot and changing sides."
    ]
  },
  {
    "exercise_id": "501ab877-2ee3-42e0-a595-68cc39a6fb8e",
    "source_id": 275445887078288,
    "before_hash": "ede06ef5669e19802e2c585d4fa8eee0cfe1e071d236a70e38a0cf945c43d182",
    "after_hash": "1792d8dc873d10ff1c5045b3e992be7b45bd389b758840c72f71527e9563703a",
    "expected_updated_at": "2026-10-14T10:47:41.005999+00:00",
    "steps": [
      "Place the BOSU dome upward. Support yourself with your forearms on the dome and toes on the floor in a plank.",
      "Keeping your forearms on the BOSU, allow your chest to settle slightly between your shoulder blades without sagging at the hips.",
      "Press through your forearms into the BOSU to spread your shoulder blades and hold the supported plank with your torso steady."
    ]
  },
  {
    "exercise_id": "50dd43ed-2d46-41a1-84bc-cc86d67f4341",
    "source_id": 139341276391319,
    "before_hash": "200d67d46ea7353214d04eb27a6e970e453cdd78ff59ed5fde1b3204ea45b61c",
    "after_hash": "29fb279ee59f26200f3434673110f55064b8c037eab064ec74bd8a8206fdd65c",
    "expected_updated_at": "2026-10-14T10:47:13.3553+00:00",
    "steps": [
      "Stand upright with your feet fairly close together.",
      "Gently shift onto the outer edges of your feet so the soles turn inward, and hold your balance.",
      "Keep the movement small without rolling excessively, then return your feet flat to the floor under control."
    ]
  },
  {
    "exercise_id": "53b8a572-4351-4991-a030-57078465f780",
    "source_id": 80380500764132,
    "before_hash": "68a21c1c4bbca3e13cb2ba57b7ba4383a5c3d2f9bb41468d57f142f394b8d13c",
    "after_hash": "8e5b799e8bc80410dd63c269c0be50d2a1ded701d8df3cecd539c23314e658f8",
    "expected_updated_at": "2026-10-14T10:47:01.326339+00:00",
    "steps": [
      "Place two stable boxes on the floor about shoulder-width apart with a gap between them.",
      "Place one hand on each box and extend your arms into a plank position.",
      "Keep your legs extended with your toes on the floor and your body aligned.",
      "Bend your elbows to lower your chest into the gap between the boxes, keeping your core engaged.",
      "Press through your hands to straighten your arms and return to the starting position."
    ]
  },
  {
    "exercise_id": "559b7383-7829-4a79-b113-385a0991658d",
    "source_id": 9486734250132,
    "before_hash": "212951bc9c22632f7e866fa9d70ec2e87e767af2b6af35818cfa7e4a9a50655a",
    "after_hash": "8e120ccae6967439bb194e37b2ae6f8442fbcdbe4db7217a3f54c20ecbe518d4",
    "expected_updated_at": "2026-10-14T10:46:45.632529+00:00",
    "steps": [
      "Support yourself on your knees and hands, with your thumbs and index fingers forming a diamond under your chest. Keep your torso aligned from shoulders to knees.",
      "Bend your elbows to lower your chest toward your hands, keeping your elbows close to your body and your knees on the floor.",
      "Press through your hands to straighten your arms and return to the starting position."
    ]
  },
  {
    "exercise_id": "60b4466d-4427-4fa4-92b4-ac3a3a6f7afa",
    "source_id": 258828132017337,
    "before_hash": "fbca3baf928449a8f61f377e726f46fad223b53abd9282b9a1ed00cd642497b7",
    "after_hash": "b871a393c45421eba42940d79a4d10c8e3e58c2973ce2d02556a7ff3fcee25e8",
    "expected_updated_at": "2026-10-14T10:47:37.627373+00:00",
    "steps": [
      "Sit in the horizontal leg-press machine with your back against the pad, hands on the handles and feet on the platform about shoulder-width apart, with your knees slightly bent.",
      "Press briskly through the balls of your feet, extending your ankles and knees to move the seat away from the platform.",
      "Return under control by bending your knees and bringing your ankles back toward the starting position, then repeat with your back supported."
    ]
  },
  {
    "exercise_id": "6470505a-acd9-4534-9ec4-280af6ded3c8",
    "source_id": 110330796626419,
    "before_hash": "e96a2632bddaad1f97a754f2b68621b4dc96a6b1df15d8e94b63469535dab4d2",
    "after_hash": "f66688a93ed07413efb2fab8e6e3eb10cbc8a62d491b9175be93197973e9696e",
    "expected_updated_at": "2026-10-14T10:47:07.94396+00:00",
    "steps": [
      "Lie on your back with one knee bent and that foot flat on the floor. Keep the other leg raised off the floor and your arms at your sides.",
      "Squeeze your glutes and push through your planted foot to lift your hips toward the ceiling.",
      "Hold briefly at the top with your hips raised, keeping your shoulders supported on the floor and the other leg lifted.",
      "Lower your hips under control to the starting position, then repeat and change sides."
    ]
  },
  {
    "exercise_id": "7e733fad-2449-473a-9804-f0e945842806",
    "source_id": 34705340638994,
    "before_hash": "3e0e5ab8899b7c4115a1dad9416159f379145c82f8d49ad4d7edc294bbdbcbe4",
    "after_hash": "3906fc4117102034844c375064a790cbe8927ed80c5d6f02de430fd7ddf4bd86",
    "expected_updated_at": "2026-10-14T10:46:50.808917+00:00",
    "steps": [
      "Grasp the overhead bar and hang with your arms extended.",
      "Engage your core and raise your thighs in front of you, keeping your knees bent as shown in the demonstrations.",
      "Hold the bent-knee position for the intended duration while keeping your torso steady."
    ]
  },
  {
    "exercise_id": "82bd72ae-7d93-492d-8fe7-4e64f8006689",
    "source_id": 211986485241312,
    "before_hash": "c4bf86d35be2fc482d5de3708c1a758a1ebd195746da48df33279af4a2257425",
    "after_hash": "14219608ebc9e8d9a53a5c770d4e23f888e05680cca492499dc6b07d81b3ddc9",
    "expected_updated_at": "2026-10-14T10:47:28.083543+00:00",
    "steps": [
      "Sit on a stable box with your arms crossed over your chest, lean your torso back and lift your feet off the floor.",
      "Bring your bent knees and torso toward each other while balancing on the box.",
      "Extend your legs forward and lean your torso back under control to return to the starting position, keeping your feet raised."
    ]
  },
  {
    "exercise_id": "8e9130d2-6d82-4dd6-9516-0f4167862fed",
    "source_id": 127912152785679,
    "before_hash": "9f38640add456dc056b1f4f3dd6d1eda828fd46351cbe17a5a1d3e05aa0d8999",
    "after_hash": "e9576b2ae78c10425182d2c7f13f5189a806c25aee66e733f1e37b1fb05bf88a",
    "expected_updated_at": "2026-10-14T10:47:11.754999+00:00",
    "steps": [
      "Lie on your back with your arms at your sides. Rest one heel on a stable box with that knee bent, and cross the opposite ankle over the supporting thigh.",
      "Push through the supported heel to lift your hips, keeping your shoulders on the floor and the other leg crossed. Lower your hips under control and repeat before changing sides."
    ]
  },
  {
    "exercise_id": "a574adcf-5d2a-4a36-9cda-536c5412e009",
    "source_id": 112818505008395,
    "before_hash": "f4ecbc4c2bb7b0fa58b9374346eba0c98b20423c63cc193d01610bcc2e789145",
    "after_hash": "e03d1a78528ca6c00db0628e16f2799bd7860e4fc0d160ac2440fb0fe7b6694b",
    "expected_updated_at": "2026-10-14T10:47:08.39244+00:00",
    "steps": [
      "Place one hand on each of two stable boxes beside your body. Support yourself with your arms extended, knees bent and feet off the floor.",
      "Bend your elbows to lower your body between the boxes under control, keeping your hands in place.",
      "Press through your hands to straighten your elbows and raise your body back to the starting position."
    ]
  },
  {
    "exercise_id": "b437e1ea-8762-4122-87e8-34d06576e34e",
    "source_id": 181506875447260,
    "before_hash": "7a7b826e16bb2a1932aba2398c8953ba31fd8af0129d16cb05deac63f3f66afa",
    "after_hash": "97effd98ba9c0424973f35c98bfcf0bac245da83c6f7451e966c4ae78de202ec",
    "expected_updated_at": "2026-10-14T10:47:22.652203+00:00",
    "steps": [
      "Lie on your back with your legs raised and your hips and knees bent to about 90 degrees, with your arms at your sides.",
      "Keep your knees bent as you lower your toes toward the floor, then lift back to the starting position. The male demonstration alternates legs; the female demonstration lowers both together.",
      "Keep your lower back flat against the floor and your torso steady throughout the movement."
    ]
  },
  {
    "exercise_id": "b6989ab4-e390-4217-a9a5-d1e5e89e4bee",
    "source_id": 211950085458276,
    "before_hash": "54152dab61a2d4cdcb98e5c290c66dfc1126a1134b6b96cbce079cf0fdc076af",
    "after_hash": "db341803ca8403bc53de2499e56bda33ffaed5d4d3b205cd6897577ab7587281",
    "expected_updated_at": "2026-10-14T10:47:28.064294+00:00",
    "steps": [
      "Step your left foot diagonally behind your right leg. Bend your knees and lower your hips so your front right thigh approaches parallel to the floor and your rear left knee moves toward the floor.",
      "Push through your right foot to straighten your legs and return to the starting position.",
      "Repeat the movement with your other leg crossing behind."
    ]
  },
  {
    "exercise_id": "c8597094-227f-4852-940e-463eba41bd01",
    "source_id": 65065140484801,
    "before_hash": "f58a68f4fdf67886b7d25524af48bc2aa7a8d9eaa5735dc64c0bceeedb0b4fc2",
    "after_hash": "0f10319870dee27abab1ff5d219fe369a0a8325b638156d30903b37dad91509c",
    "expected_updated_at": "2026-10-14T10:46:58.592452+00:00",
    "steps": [
      "Stand with your feet about shoulder-width apart and hold your empty hands together in front of your chest.",
      "Squat down toward parallel, then rise only partway back up.",
      "Continue moving up and down within this short range for the duration of the set."
    ]
  },
  {
    "exercise_id": "d4c54a65-33e5-44df-a438-3e124353263c",
    "source_id": 222896604904592,
    "before_hash": "ef22b48c09649b021d8aebf9861a4a7ccd779e026460d9f296c901d49bcb4025",
    "after_hash": "be66a74f7a1e00290013adb3dacb4f931c91728a8999f46ec7fe06f198fa6a5d",
    "expected_updated_at": "2026-10-14T10:47:30.419995+00:00",
    "steps": [
      "Stand on a platform with your feet hip-width apart and your hands together in front of your chest, without holding a weight.",
      "Keep one foot on the platform and step the other back and across behind it, lowering your rear knee toward the floor with your chest upright and core engaged.",
      "Push through the foot on the platform to return to the starting position, keeping your balance throughout."
    ]
  },
  {
    "exercise_id": "d96f1c18-8e30-496c-b073-ac0ed00e4d1c",
    "source_id": 134433394472690,
    "before_hash": "6fc33acfce6cdec7d58e354c38e996f3353c103c371fc30e2fae8c368b343b89",
    "after_hash": "5fb49480f132f4e1801bbc65c74a8f20f1565c8215ebb4c64a3d79ac1d108b85",
    "expected_updated_at": "2026-10-14T10:47:12.673029+00:00",
    "steps": [
      "Stand upright with your hands together in front of your chest, without holding a weight.",
      "Step one foot back and diagonally across behind the other leg, bending your knees to lower your hips and rear knee toward the floor.",
      "Push through your front foot to return to standing, then repeat with the other leg and continue alternating sides."
    ]
  },
  {
    "exercise_id": "def74b78-55fa-48a7-8b43-9204378a09b7",
    "source_id": 63572228692074,
    "before_hash": "208e23252fc743312fdb209c3e5c132faf2e693214856900fe964b2eee0885b2",
    "after_hash": "683793eba4997430e435cb2d15e972199b1dd0385cb19d2fd87401455ec37d35",
    "expected_updated_at": "2026-10-14T10:46:58.112676+00:00",
    "steps": [
      "Stand in front of a stable box with your feet about shoulder-width apart.",
      "Choose a low box if you are learning the movement.",
      "Bend your hips and knees and swing your arms back, then extend your legs and swing your arms forward to jump onto the box.",
      "Land with both feet near the middle of the box and soften your knees to control the landing. Stand up, then step down before the next repetition."
    ]
  },
  {
    "exercise_id": "e8581eea-28da-4ca5-9503-282f091712e1",
    "source_id": 154224024868920,
    "before_hash": "c0c83f0b36c2461d722a342a7e0e0cf63028e9fe79cad70cef3170277d819676",
    "after_hash": "2cb4b11912c09af0cbc441fee5983d7dd9aeb3004ebd785337c2fdcecdc8b3a7",
    "expected_updated_at": "2026-10-14T10:47:16.54583+00:00",
    "steps": [
      "Place the BOSU dome upward and support yourself with your forearms on the dome and toes on the floor in a plank.",
      "Keep your forearms supported and allow your chest to lower slightly between your shoulder blades, keeping your hips steady.",
      "Press your forearms into the BOSU to spread your shoulder blades and lift your chest back up. Repeat this small movement without moving your elbows to the floor."
    ]
  },
  {
    "exercise_id": "f1060f7b-82eb-4ab8-90d6-7e69fd2297e5",
    "source_id": 7753352383068,
    "before_hash": "57e03abcbcc1de095e8eef784fe74513e5e138e720dd164040e245fee3710fde",
    "after_hash": "31b1cb069f1d23df7f558340d22a76152685e7eda7e3dac1309758f853261a21",
    "expected_updated_at": "2026-10-14T10:46:45.200358+00:00",
    "steps": [
      "Stand upright with your back straight and your arms relaxed at your sides.",
      "Raise your shoulders toward your ears while keeping your arms at your sides.",
      "Lower your shoulders under control back to the relaxed starting position, then repeat."
    ]
  },
  {
    "exercise_id": "f1f42d92-f79d-4fe4-8d33-0fd14745a370",
    "source_id": 280321027042191,
    "before_hash": "6dbc61f6356362e830d4fe793dadef25197442c3644c06f85ba03499c478c66b",
    "after_hash": "e5814ce4b6c56aea419608e2ce42a163be3dcea9a00278c3ebfefef0ee785751",
    "expected_updated_at": "2026-10-14T10:47:42.001227+00:00",
    "steps": [
      "Place a long foam roller on the floor in line with your body.",
      "Lie lengthwise on the roller so your back and head are supported.",
      "Bend your knees and place your feet flat on the floor, keeping your lower back supported and your chin gently tucked.",
      "Start with your arms beside your hips and your shoulders relaxed against the roller.",
      "Raise your extended arms and bring them overhead toward the floor, then return under control while keeping your feet planted and back supported."
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
    "exercise_id": "02340348-9464-4339-a68c-2a4babd72437",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "7066a76a73cb65c2e5ef5db2c5e4761c7314cf207e78e49696c1736533f4f775",
    "name": "Gập bụng tư thế con ếch",
    "description": "",
    "steps": [
      "Nằm ngửa, áp hai lòng bàn chân vào nhau và mở hai gối đang gập sang hai bên. Đặt hai tay sau đầu.",
      "Siết cơ bụng để cuộn vai và lưng trên lên khỏi sàn, sau đó hạ có kiểm soát, giữ hai bàn chân áp nhau và gối mở."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "1244468a-2bcf-4569-87d0-3f0ab747c061",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "f5fa2c5a82a3e5628e070f0946e2cbec8f8d279429dac5459326f533f3088185",
    "name": "Đứng khép hông với máy đa hướng",
    "description": "",
    "steps": [
      "Đứng trên bệ máy và nắm tay cầm để giữ thăng bằng. Chỉnh con lăn tì vào mặt trong đùi chân tập, phía trên gối.",
      "Giữ bàn chân trụ trên bệ và đưa chân tập sang bên, tựa vào con lăn.",
      "Ép chân tập vào trong về phía chân trụ rồi đưa ra ngoài có kiểm soát, giữ thân người ổn định."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "1ab4a56e-891e-451d-9eea-1d7fa2a966a5",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0171d5ca2a70980acd2d2a6c96779250a333d011c3a3c57bea821e84f1653e33",
    "name": "Đứng nâng mũi chân kê gót với tạ đòn",
    "description": "",
    "steps": [
      "Đứng với hai gót trên bánh tạ, phần trước bàn chân đưa ra ngoài mép. Giữ chắc tạ đòn ngang lưng trên.",
      "Giữ gót trên bánh tạ và nâng các ngón cùng phần trước bàn chân về phía trần.",
      "Giữ ngắn ở trên cùng rồi hạ phần trước bàn chân về phía sàn có kiểm soát, giữ gót trên điểm kê."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "1ac2a75c-8126-43ec-9329-9cfcf97cfd38",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "9b6ba898372761e437ad6ee553f48b9cb7c63045cda47e7c8e9e2fe4e8cfd297",
    "name": "Ngồi máy khép đùi",
    "description": "",
    "steps": [
      "Ngồi vào máy, hai chân mở và đệm tì vào mặt trong đùi gần gối. Chỉnh ghế và đệm về vị trí bắt đầu thoải mái.",
      "Ép hai chân vào nhau qua đệm, tập trung vào cơ đùi trong và dừng ngắn khi hai đệm gần nhau.",
      "Từ từ trở lại tư thế ban đầu, không để chồng tạ va mạnh. Lặp lại đủ số lần và số hiệp mong muốn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "2f1ce748-9a71-4e2d-8426-a6e2f1675c4d",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ab6da7603367383603b5d97867a957854a9792d72d89d99afc6ededf03f81d1b",
    "name": "Tách ngón chân cái",
    "description": "",
    "steps": [
      "Ngồi trên ghế, đặt bàn chân tập không mang giày trên sàn và giữ gót có điểm tựa.",
      "Hơi nâng ngón chân cái rồi đưa sang bên, tách khỏi các ngón còn lại, giữ phần còn lại của bàn chân ổn định.",
      "Thực hiện chuyển động nhỏ, có kiểm soát rồi đưa ngón cái về tư thế ban đầu.",
      "Có thể dùng một đường trên sàn làm mốc theo dõi chuyển động của ngón chân."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "383ce0cd-9e08-495c-9725-a44955247ec1",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "bb991c22f5386950e915ba6f140b49e605035393c58a49055d013cac35541e3b",
    "name": "Ổn định cơ trung tâm 4: nâng tay chân đối bên ở tư thế chống đẩy",
    "description": "",
    "steps": [
      "Bắt đầu ở tư thế plank cao, hai tay thẳng và bàn tay đặt dưới vai.",
      "Đặt hai bàn chân rộng khoảng bằng vai. Mở chân rộng hơn giúp có thêm điểm tựa; thu hẹp chân làm việc giữ thăng bằng khó hơn.",
      "Vươn một tay ra trước và nâng chân đối bên ra sau, sau đó đưa tay và chân về sàn rồi đổi bên.",
      "Giữ hông cân bằng và lưng ổn định, không cong tròn hoặc ưỡn lưng trong suốt động tác."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "4afdffa4-fabb-4a73-8878-160d38555407",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "4400778181e02cacd9d7901e640793cb7bfa698e950de9ec35d6c408c65961b9",
    "name": "Squat giữ gậy qua đầu",
    "description": "",
    "steps": [
      "Đứng hai chân hơi rộng hơn vai, cầm gậy qua đầu bằng kiểu cầm sấp rộng tay và duỗi hai tay.",
      "Gập hông và gối để bắt đầu squat, siết cơ trung tâm và giữ gậy cân bằng qua đầu.",
      "Hạ người vào tư thế squat, giữ gậy qua đầu rồi đạp qua hai bàn chân để đứng lên.",
      "Lặp lại đủ số lần mong muốn, giữ lưng thẳng, ngực nâng và gậy ổn định trong suốt động tác."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "4dfd84e1-792e-4d3f-9acf-d6cabf5b3115",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3af716b13398650f4df5bec9f933a939707e79c74c6f43a7629447a92a17ef28",
    "name": "Đứng vận động hông theo đường số 8",
    "description": "",
    "steps": [
      "Đứng trên một chân, giữ gậy dựng đứng để hỗ trợ thăng bằng. Nâng gối chân kia ra trước để đùi gần song song với sàn.",
      "Dẫn gối đang nâng ra ngoài rồi trở vào trong theo đường vòng liền mạch, giữ bàn chân trụ trên sàn và thân người ổn định.",
      "Để gối dẫn chuyển động và cổ chân đi theo, tiếp tục đường vòng có kiểm soát rồi hạ chân và đổi bên."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "501ab877-2ee3-42e0-a595-68cc39a6fb8e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "1792d8dc873d10ff1c5045b3e992be7b45bd389b758840c72f71527e9563703a",
    "name": "Plank tựa BOSU kích hoạt cơ răng trước",
    "description": "",
    "steps": [
      "Đặt BOSU với mặt vòm hướng lên. Chống cẳng tay lên mặt vòm và mũi chân xuống sàn ở tư thế plank.",
      "Giữ cẳng tay trên BOSU, để ngực hạ nhẹ giữa hai bả vai, không võng hông.",
      "Ấn cẳng tay vào BOSU để tách hai bả vai và giữ tư thế plank có điểm tựa, thân người ổn định."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "50dd43ed-2d46-41a1-84bc-cc86d67f4341",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "29fb279ee59f26200f3434673110f55064b8c037eab064ec74bd8a8206fdd65c",
    "name": "Đứng giữ tư thế nghiêng bàn chân vào trong",
    "description": "",
    "steps": [
      "Đứng thẳng, hai bàn chân tương đối gần nhau.",
      "Nhẹ nhàng chuyển điểm tì sang mép ngoài bàn chân để lòng bàn chân xoay vào trong, giữ thăng bằng.",
      "Giữ biên độ nhỏ, không nghiêng quá mức, sau đó đưa hai bàn chân về tư thế đặt phẳng trên sàn có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "53b8a572-4351-4991-a030-57078465f780",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "8e5b799e8bc80410dd63c269c0be50d2a1ded701d8df3cecd539c23314e658f8",
    "name": "Chống đẩy kê cao hai tay trên bục",
    "description": "",
    "steps": [
      "Đặt hai bục chắc chắn trên sàn, cách nhau khoảng bằng vai và chừa khoảng trống ở giữa.",
      "Đặt mỗi tay lên một bục, duỗi tay vào tư thế plank.",
      "Giữ hai chân duỗi, mũi chân trên sàn và thân người thẳng hàng.",
      "Gập khuỷu để hạ ngực vào khoảng trống giữa hai bục, siết cơ trung tâm.",
      "Đẩy qua hai bàn tay để duỗi tay và trở lại tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "559b7383-7829-4a79-b113-385a0991658d",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "8e120ccae6967439bb194e37b2ae6f8442fbcdbe4db7217a3f54c20ecbe518d4",
    "name": "Chống đẩy kim cương trên gối",
    "description": "",
    "steps": [
      "Chống gối và hai tay, để ngón cái cùng ngón trỏ tạo hình kim cương dưới ngực. Giữ thân người thẳng hàng từ vai đến gối.",
      "Gập khuỷu để hạ ngực về hai bàn tay, giữ khuỷu sát người và gối trên sàn.",
      "Đẩy qua hai bàn tay để duỗi tay và trở lại tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "60b4466d-4427-4fa4-92b4-ac3a3a6f7afa",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "b871a393c45421eba42940d79a4d10c8e3e58c2973ce2d02556a7ff3fcee25e8",
    "name": "Đẩy bật bắp chân trên máy đạp chân ngang",
    "description": "",
    "steps": [
      "Ngồi vào máy đạp chân ngang, tựa lưng vào đệm, nắm tay cầm và đặt hai bàn chân lên bàn đạp rộng khoảng bằng vai, gối hơi gập.",
      "Đạp nhanh qua phần trước bàn chân, duỗi cổ chân và gối để đưa ghế ra xa bàn đạp.",
      "Trở lại có kiểm soát bằng cách gập gối và đưa cổ chân về gần tư thế ban đầu, sau đó lặp lại, giữ lưng tựa đệm."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "6470505a-acd9-4534-9ec4-280af6ded3c8",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "f66688a93ed07413efb2fab8e6e3eb10cbc8a62d491b9175be93197973e9696e",
    "name": "Nâng hông một chân",
    "description": "",
    "steps": [
      "Nằm ngửa, gập một gối và đặt bàn chân đó phẳng trên sàn. Giữ chân kia nâng khỏi sàn, hai tay đặt bên người.",
      "Siết cơ mông và đạp qua bàn chân trụ để nâng hông về phía trần.",
      "Giữ ngắn ở trên cùng với hông nâng, vai tựa trên sàn và chân kia vẫn nâng.",
      "Hạ hông có kiểm soát về tư thế ban đầu, sau đó lặp lại và đổi bên."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "7e733fad-2449-473a-9804-f0e945842806",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3906fc4117102034844c375064a790cbe8927ed80c5d6f02de430fd7ddf4bd86",
    "name": "Treo xà giữ L-sit gập gối",
    "description": "",
    "steps": [
      "Nắm thanh xà phía trên và treo người với hai tay duỗi.",
      "Siết cơ trung tâm và nâng hai đùi ra trước, giữ gối gập như trong video hướng dẫn.",
      "Giữ tư thế gập gối trong thời gian dự định, giữ thân người ổn định."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "82bd72ae-7d93-492d-8fe7-4e64f8006689",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "14219608ebc9e8d9a53a5c770d4e23f888e05680cca492499dc6b07d81b3ddc9",
    "name": "Ngồi bục co gối gập bụng",
    "description": "",
    "steps": [
      "Ngồi trên bục chắc chắn, khoanh tay trước ngực, ngả thân người ra sau và nâng chân khỏi sàn.",
      "Đưa hai gối đang gập và thân người lại gần nhau, giữ thăng bằng trên bục.",
      "Duỗi chân ra trước và ngả thân người ra sau có kiểm soát để trở lại tư thế ban đầu, giữ chân nâng khỏi sàn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "8e9130d2-6d82-4dd6-9516-0f4167862fed",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e9576b2ae78c10425182d2c7f13f5189a806c25aee66e733f1e37b1fb05bf88a",
    "name": "Nâng hông kê chân cao và bắt chéo chân",
    "description": "",
    "steps": [
      "Nằm ngửa, hai tay bên người. Đặt một gót lên bục chắc chắn với gối gập, bắt cổ chân còn lại qua đùi chân trụ.",
      "Đạp qua gót đang kê để nâng hông, giữ vai trên sàn và chân kia bắt chéo. Hạ hông có kiểm soát rồi lặp lại trước khi đổi bên."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "a574adcf-5d2a-4a36-9cda-536c5412e009",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e03d1a78528ca6c00db0628e16f2799bd7860e4fc0d160ac2440fb0fe7b6694b",
    "name": "Chống tay giữa hai bục hạ người",
    "description": "",
    "steps": [
      "Đặt mỗi tay lên một bục chắc chắn ở hai bên người. Chống người bằng hai tay duỗi, gập gối và nâng chân khỏi sàn.",
      "Gập khuỷu để hạ người xuống giữa hai bục có kiểm soát, giữ bàn tay tại chỗ.",
      "Đẩy qua hai bàn tay để duỗi khuỷu và nâng người về tư thế ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "b437e1ea-8762-4122-87e8-34d06576e34e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "97effd98ba9c0424973f35c98bfcf0bac245da83c6f7451e966c4ae78de202ec",
    "name": "Nằm hạ chân gập gối",
    "description": "",
    "steps": [
      "Nằm ngửa, nâng hai chân và gập hông, gối khoảng 90 độ, hai tay đặt bên người.",
      "Giữ gối gập khi hạ các ngón chân về phía sàn rồi nâng về tư thế ban đầu. Video nam luân phiên từng chân; video nữ hạ cả hai chân cùng lúc.",
      "Giữ lưng dưới áp sàn và thân người ổn định trong suốt động tác."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "b6989ab4-e390-4217-a9a5-d1e5e89e4bee",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "db341803ca8403bc53de2499e56bda33ffaed5d4d3b205cd6897577ab7587281",
    "name": "Chùng chân chéo sau",
    "description": "",
    "steps": [
      "Bước chân trái chéo ra sau chân phải. Gập gối và hạ hông để đùi phải phía trước tiến gần song song với sàn, gối trái phía sau hạ về phía sàn.",
      "Đạp qua bàn chân phải để duỗi chân và trở lại tư thế ban đầu.",
      "Lặp lại với chân còn lại bước chéo ra sau."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "c8597094-227f-4852-940e-463eba41bd01",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "0f10319870dee27abab1ff5d219fe369a0a8325b638156d30903b37dad91509c",
    "name": "Squat nhấp không dùng tạ",
    "description": "",
    "steps": [
      "Đứng hai chân rộng khoảng bằng vai, chắp hai tay không cầm tạ trước ngực.",
      "Squat xuống gần song song với sàn rồi chỉ nâng người lên một phần.",
      "Tiếp tục nhấp lên xuống trong biên độ ngắn này suốt hiệp tập."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "d4c54a65-33e5-44df-a438-3e124353263c",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "be66a74f7a1e00290013adb3dacb4f931c91728a8999f46ec7fe06f198fa6a5d",
    "name": "Chùng chân chéo sau trên bục không dùng tạ",
    "description": "",
    "steps": [
      "Đứng trên bục, hai chân rộng bằng hông, chắp tay trước ngực và không cầm tạ.",
      "Giữ một bàn chân trên bục, bước chân kia ra sau và chéo qua phía sau chân trụ, hạ gối chân sau về phía sàn, giữ ngực thẳng và siết cơ trung tâm.",
      "Đạp qua bàn chân trên bục để trở lại tư thế ban đầu, giữ thăng bằng trong suốt động tác."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "d96f1c18-8e30-496c-b073-ac0ed00e4d1c",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "5fb49480f132f4e1801bbc65c74a8f20f1565c8215ebb4c64a3d79ac1d108b85",
    "name": "Chùng chân chéo sau luân phiên không dùng tạ",
    "description": "",
    "steps": [
      "Đứng thẳng, chắp tay trước ngực và không cầm tạ.",
      "Bước một chân ra sau và chéo qua phía sau chân kia, gập gối để hạ hông và gối chân sau về phía sàn.",
      "Đạp qua bàn chân trước để đứng lên, sau đó thực hiện bằng chân còn lại và tiếp tục luân phiên hai bên."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "def74b78-55fa-48a7-8b43-9204378a09b7",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "683793eba4997430e435cb2d15e972199b1dd0385cb19d2fd87401455ec37d35",
    "name": "Bật nhảy lên bục",
    "description": "",
    "steps": [
      "Đứng trước bục chắc chắn, hai chân rộng khoảng bằng vai.",
      "Chọn bục thấp nếu đang học động tác.",
      "Gập hông và gối, đưa hai tay ra sau, sau đó duỗi chân và vung tay ra trước để bật lên bục.",
      "Tiếp đất bằng cả hai chân gần giữa bục, chùng gối để kiểm soát tiếp đất. Đứng lên rồi bước xuống trước lần tiếp theo."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "e8581eea-28da-4ca5-9503-282f091712e1",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "2cb4b11912c09af0cbc441fee5983d7dd9aeb3004ebd785337c2fdcecdc8b3a7",
    "name": "Plank chủ động tựa BOSU kích hoạt cơ răng trước",
    "description": "",
    "steps": [
      "Đặt BOSU với mặt vòm hướng lên, chống cẳng tay lên mặt vòm và mũi chân xuống sàn ở tư thế plank.",
      "Giữ cẳng tay tại điểm tựa, để ngực hạ nhẹ giữa hai bả vai, giữ hông ổn định.",
      "Ấn cẳng tay vào BOSU để tách hai bả vai và nâng ngực lên trở lại. Lặp lại chuyển động nhỏ này, không chuyển khuỷu tay xuống sàn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "f1060f7b-82eb-4ab8-90d6-7e69fd2297e5",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "31b1cb069f1d23df7f558340d22a76152685e7eda7e3dac1309758f853261a21",
    "name": "Nâng bả vai",
    "description": "",
    "steps": [
      "Đứng thẳng lưng, thả lỏng hai tay ở hai bên người.",
      "Nâng vai về phía tai, giữ hai tay ở hai bên người.",
      "Hạ vai có kiểm soát về tư thế thả lỏng ban đầu rồi lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
  },
  {
    "exercise_id": "f1f42d92-f79d-4fe4-8d33-0fd14745a370",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e5814ce4b6c56aea419608e2ce42a163be3dcea9a00278c3ebfefef0ee785751",
    "name": "Gập vai qua đầu khi nằm dọc con lăn",
    "description": "",
    "steps": [
      "Đặt con lăn xốp dài trên sàn theo chiều dọc thân người.",
      "Nằm dọc trên con lăn để lưng và đầu có điểm tựa.",
      "Gập gối và đặt hai bàn chân phẳng trên sàn, giữ lưng dưới có điểm tựa và hơi thu cằm.",
      "Bắt đầu với hai tay bên hông, thả lỏng vai trên con lăn.",
      "Nâng hai tay duỗi rồi đưa qua đầu về phía sàn, sau đó trở lại có kiểm soát, giữ bàn chân trên sàn và lưng có điểm tựa."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T08:17:57.993Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 27
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 27
    or (select count(*) from _noi_gym_restore_translations) <> 27
    or (select count(*) from _noi_gym_restore_before) <> 27 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 27 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1908, VI 1907, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
