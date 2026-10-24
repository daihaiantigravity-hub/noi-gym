-- Noi Gym / Supabase project exhgtcaczbgdqfozwrvg
-- Restore 40 exact captured instruction blocks and insert 38 reviewed VI translations.
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
    "exercise_id": "00e0406c-028e-488b-9567-03080b5137e0",
    "source_id": 41658992398893,
    "before_hash": "c13b3ac834212046999b46d079faa0fc6bff3c8bc7bc7aeec20d00ed0418caa2",
    "after_hash": "95e0d560d3d21bc57c429650c1241a186c8c1b5bded07cfeda614b3f46c77dd2",
    "expected_updated_at": "2026-10-14T10:46:52.651203+00:00",
    "steps": [
      "Position the bench between 45 and 60 degrees.",
      "Lay flat on the bench with your feet on the ground.",
      "Lower the kettlebells to your mid chest",
      "Raise the kettlebells (slowly and controlled) until you've locked your elbows."
    ]
  },
  {
    "exercise_id": "021f6cb3-27a9-4962-a250-79fa9517f933",
    "source_id": 262034034523253,
    "before_hash": "b725d585fb5aa79835b79f99dbf435d8fdc29d53e7f3add5c36afced21acb725",
    "after_hash": "b88bdbfa7d21977876185416304f50ac0cb6e1a2b1305326733f07aa5a12ebc8",
    "expected_updated_at": "2026-10-14T10:47:38.48026+00:00",
    "steps": [
      "Stand tall, hold the cable handle with a neutral grip, your elbow should be at a 90 degree angle.",
      "Rotate your shoulder by bringing your forearm across your body."
    ]
  },
  {
    "exercise_id": "0d274d59-d309-4a3b-bf06-d816dadbc9ca",
    "source_id": 86750533196020,
    "before_hash": "0995efcf2f5d4eaf795b5294a963a49f8052216b1a47d3423ad964f08bb049af",
    "after_hash": "35b96cf173ef775caa07fa11aa463c6525750381a5d86bbb4e5233ab33d993a6",
    "expected_updated_at": "2026-10-14T10:47:02.733946+00:00",
    "steps": [
      "Start on your hands and knees with one foot placed on the bottom of the bar.",
      "Keeping your core braced, your back flat, and your moving leg bent at a 90 degree angle, drive the heel of your working leg up the ceiling while squeezing your glute.",
      "Follow the movement path as you bring your knee back down to the ground beneath your hip, keeping your knee bent to maintain control of the bar.",
      "Repeat for the desired number of reps before switching sides."
    ]
  },
  {
    "exercise_id": "13950676-cd8b-4856-81ad-99dbbce23e15",
    "source_id": 34196860574643,
    "before_hash": "2914a411a805c241c61f1e2822b9889f02c71db2c468d7611c6c8ba02ea413fb",
    "after_hash": "403c39a652c7643ec1424cdb692195c1a665e7c823749363c6f26d6a9286731e",
    "expected_updated_at": "2026-10-14T10:46:50.700928+00:00",
    "steps": [
      "Either use two handles or no attachment at all. Both sides of the cable crossover should be set to the top.",
      "Stand in the center of the machine holding each Cable in the opposing hand. Your upper arm should be at a 45 degree angle with your torso.",
      "Extend your elbows until you feel a contraction and then return to the starting position"
    ]
  },
  {
    "exercise_id": "29ca15ed-d688-4e9c-9c0b-2ced5cfb9e8c",
    "source_id": 157369389002576,
    "before_hash": "f0b1d88fa3e0e1ddc5cc393e80a5810dbc55449b40b14c79bec2ab22fa2cd48e",
    "after_hash": "c599aa78d32e706fdc13a525dba638d22728bd28e3516e1467a40301cc775c75",
    "expected_updated_at": "2026-10-14T10:47:16.850643+00:00",
    "steps": [
      "Position the bench between 30 and 45 degrees.",
      "Lay flat on the bench with your feet on the ground. With straight arms unrack the bar.",
      "Lower the bar to your mid chest",
      "Raise the bar (slowly and controlled) until you've locked your elbows."
    ]
  },
  {
    "exercise_id": "2a854fdd-57fa-4f00-822d-4d119cdd1919",
    "source_id": 206877899312911,
    "before_hash": "edc212ce975fcc0afc9935740f17e58d11bad76b7a68f5f54df51185c8725bd9",
    "after_hash": "306898fd42ac3fdd19ce10b8142a327c93cff46a89d2a5516e986f49bdbd7856",
    "expected_updated_at": "2026-10-14T10:47:27.110135+00:00",
    "steps": [
      "Loop band around elbows, arms bent 90 degrees at sides.",
      "Raise both elbows outward to shoulder height.",
      "Lower slowly and alternate, keeping tension on band."
    ]
  },
  {
    "exercise_id": "409f685b-d478-436d-a86b-cfee60294b44",
    "source_id": 87024189386563,
    "before_hash": "5eadd824027bc543d5239cda860557f379395885a36a9674b688cc93fb11d692",
    "after_hash": "3c9906e90ac201d91e25bb9ed272b4698e86b6edd11aed1c7d4a2a6e92bf96b1",
    "expected_updated_at": "2026-10-14T10:47:02.84119+00:00",
    "steps": [
      "Lay flat on the ground with your head by the anchor point of the band, which should be 6 to 12 inches above your head",
      "Place the band around your midfoot and extend at the knees and hip."
    ]
  },
  {
    "exercise_id": "41275e45-0a4b-4352-970d-e0f389ec663a",
    "source_id": 122004221925765,
    "before_hash": "2213bca49bb1a2dbe8360a54af983a02a20b9d0ae09ed5fcfc965f7b709a11c6",
    "after_hash": "f3b392a4b2bd816fbf5714b8337be9115b89fe0d5231ad37fec0c95a32500e97",
    "expected_updated_at": "2026-10-14T10:47:10.11371+00:00",
    "steps": [
      "Sit on the machine with your back against the cushion and adjust the machine you are using so that your knees are at a 90 degree angle at the starting position.",
      "Raise the weight by extending your knees outward, then lower your leg to the starting position. Both movements should be done in a slow, controlled motion."
    ]
  },
  {
    "exercise_id": "48851130-e3d7-4a55-94fa-255322897744",
    "source_id": 16189906001079,
    "before_hash": "cfe57762ef1e3f7e2d642f2fa97fd7ff6ae7af7630104a32301553e9e4d005a2",
    "after_hash": "3f3500468b42f128d8f79d23dc3982d54e5b5995730ff7c282e62d46adc0ec7f",
    "expected_updated_at": "2026-10-14T10:46:46.710838+00:00",
    "steps": [
      "Starting lying on your back perpendicularly to the barbell while holding the end of the bar in your hand that is further away from the landmine attachment. Your elbow should be rest on the ground at a 45 to 60 degree angle from your torso, with your wrist stacked over your elbow.",
      "Drive the end of the bar upwards, squeezing your chest at the top of the movement. Lower the bar back down until your elbow gently touches the ground.",
      "Repeat for the desired number of reps on one side before switching sides."
    ]
  },
  {
    "exercise_id": "4998e346-5462-4ed3-a55e-e17c7566ca23",
    "source_id": 55053628597646,
    "before_hash": "e2b41b8909cae95c2df26a2683d7671e0b145be6978120b43a9fd2a30c5841ff",
    "after_hash": "bdfd0e660f4c1289e4b56ecf07e8cd9f615463176aeccb38a5fe340805a67880",
    "expected_updated_at": "2026-10-14T10:46:55.724266+00:00",
    "steps": [
      "Place one foot flat on the ground in front of you at a 90 degree angle. With your other leg, balance upon your knee, placing the tip of your foot against the wall behind you for balance.",
      "Place your hands on your knee in front of you, and lean forward so that your knee extends over your foot.",
      "Pause at the apex of the stretch, and slowly return to starting position. Repeat with your other leg."
    ]
  },
  {
    "exercise_id": "510abfb8-b0dd-4953-a347-34639ac9f210",
    "source_id": 154248282871736,
    "before_hash": "54e5c5c7c7c20efe5946d3e74abcc761e27d8ca85a9bfd219c00aa0b0d6acad2",
    "after_hash": "00393aae1cf3fe6a6330e461608eeecb0cfabed188519d0582b5f78a4ff4ad30",
    "expected_updated_at": "2026-10-14T10:47:16.561319+00:00",
    "steps": [
      "Use a dip belt to attach a plate to yourself. Grip bars with arms straight, shoulders above hands. Keep legs straight or bent.",
      "Lower slowly until elbows are at 90 degrees.",
      "Push back up to start position, extending arms fully."
    ]
  },
  {
    "exercise_id": "527c0819-c11c-41db-9f45-d4c7761fac09",
    "source_id": 153292445373105,
    "before_hash": "600f1ec086ba80076378768b2c91d3e6f86c9ffd03689022fb620c1f982d1a59",
    "after_hash": "e09e3e34b1d03c5efaa0a5e535e8deb457859d90544482bdd518952a8a02660b",
    "expected_updated_at": "2026-10-14T10:47:16.358289+00:00",
    "steps": [
      "Anchor band, elbow at side bent 90 degrees.",
      "Rotate forearm outward, keeping elbow pinned.",
      "Return slowly to start, controlling resistance."
    ]
  },
  {
    "exercise_id": "532d22b3-fba0-4749-8605-8f7cc98d4a1c",
    "source_id": 34958525106676,
    "before_hash": "227e4cb4ddf6194c98038e85fe07051f4371564bdcd163e538d61512f6dd8dba",
    "after_hash": "38b2d69f6d85d5f08f817e210bcdf1117a9d8887e67a338457ab3920333be258",
    "expected_updated_at": "2026-10-14T10:46:50.920742+00:00",
    "steps": [
      "Place your hands together.",
      "Rotate your arms and hands 180 degrees.",
      "Hold at the peak of the stretch.",
      "Return to starting position."
    ]
  },
  {
    "exercise_id": "61dccbc8-0f36-461c-ba4a-4f8ec7ab9593",
    "source_id": 15574727447630,
    "before_hash": "eb68a7fb4829f80e498132b6b0e30b6518b5a61f25a4768bcb08280fafb02a1e",
    "after_hash": "e8d7bd244065d850c7cb6817baa5c28012e90615728b965959c3f197b6535955",
    "expected_updated_at": "2026-10-14T10:46:46.98532+00:00",
    "steps": [
      "Stand in front of Bosu, one foot on the center.",
      "Lower into a lunge position, knee at 90 degrees.",
      "Push off the front foot to return to starting position."
    ]
  },
  {
    "exercise_id": "62a98c2f-1a87-4320-8337-a637b4f3634e",
    "source_id": 266506739896158,
    "before_hash": "6b149f65c4aa9f284cfea522441f206ef7778b163f841b61ae364e2992e72fb5",
    "after_hash": "a327d859b438002d7217ca2ad73af10b4c1f912c6f43c566b7519fe5f3133f1c",
    "expected_updated_at": "2026-10-14T10:47:39.230725+00:00",
    "steps": [
      "Start on your hands and knees perpendicular to the barbell with the end of the barbell resting on the inside of your knee that is closer to the bar.",
      "Keeping your core braced, your back flat, and your moving leg bent at a 90 degree angle, drive the heel of your working leg up the ceiling while squeezing your glute.",
      "Follow the movement path as you bring your knee back down to the ground beneath your hip, keeping your knee bent to maintain control of the barbell.",
      "Repeat for the desired number of reps before switching sides."
    ]
  },
  {
    "exercise_id": "6433bf12-e67e-4ea7-841d-e0c741f7e6b1",
    "source_id": 40821886447222,
    "before_hash": "af11a9fc3c04fc2d8be8a956d51be2da5116514f6af0c9520ec687664f744ce2",
    "after_hash": "ae246d6406a7df57d83986268086c4c8b2d53cfccf8fcd04024b87a3a4982cff",
    "expected_updated_at": "2026-10-14T10:46:52.356277+00:00",
    "steps": [
      "Position the bench between 30 and 45 degrees.",
      "Lay flat on the bench with your feet on the ground. With straight arms unrack the bar.",
      "Lower the bar to your mid chest",
      "Raise the bar (slowly and controlled) until you've locked your elbows."
    ]
  },
  {
    "exercise_id": "64dc6018-12ff-4a7b-8d45-3d0973b58097",
    "source_id": 90240452139392,
    "before_hash": "6ec1f11134ded92f67050932c71d914664cc9dde8c8ff4813a64d2a556b4b4e7",
    "after_hash": "103b25d34cf8c67cea33dcd639cf5be541e18734761efc6829ba86449de63c47",
    "expected_updated_at": "2026-10-14T10:47:03.622565+00:00",
    "steps": [
      "Hold barbell behind you with arms at a 30 degree angle with your torso.",
      "Shrug shoulders up and slightly back toward ears, keeping elbows locked.",
      "Pause briefly at the top, then lower under control to full stretch."
    ]
  },
  {
    "exercise_id": "671ac465-b4d9-498f-881a-912d1e2528c5",
    "source_id": 218944829238423,
    "before_hash": "0164bbfec6f9c87639b8758d7eb9132816fe92ff001647a6eac0780c9d0132b8",
    "after_hash": "a9da120fcaf5cc0baffe08d8d693ba452ef6f1bcfea0c71116c1f56706fbc56b",
    "expected_updated_at": "2026-10-14T10:47:29.445013+00:00",
    "steps": [
      "Lay flat on the ground and hold the end of the bar with your arms extended.",
      "Raise your back off the ground until you are sitting at a 90 degree angle.",
      "Then lower slowly back to the floor."
    ]
  },
  {
    "exercise_id": "6af3a49a-5a01-4cb1-8b41-acb2e3a2d9db",
    "source_id": 4526561305790,
    "before_hash": "b78ee07dd64656f671569b42cbe932bfd544b1edfdfcfa5fb7c9977637c83b5d",
    "after_hash": "cf874b3a293c07280273d5b94147ea3b5fb8297723961559a15e19fe4c803280",
    "expected_updated_at": "2026-10-14T10:46:44.433096+00:00",
    "steps": [
      "Stand with feet shoulder-width apart, placing a stability ball between your lower back and wall.",
      "Slowly squat down by bending knees to 90 degrees, keeping back straight and core engaged.",
      "Press through heels, straighten legs, and return to standing while maintaining balance and control."
    ]
  },
  {
    "exercise_id": "77222098-18f3-4e01-b21f-cdf90a08d6bb",
    "source_id": 31216563323324,
    "before_hash": "e3e1d6a686a759bb4b6a583ad18ef41f0295656b4cf9be0f97996d974cf7e665",
    "after_hash": "7a4a3f1a83223eb972d378240dca38bc76d7df6c1ea94b40e9f6899b060221ce",
    "expected_updated_at": "2026-10-14T10:46:49.973897+00:00",
    "steps": [
      "Grip the bar with the palms facing forward, your hands need to be spaced out at a distance wider than shoulder width.",
      "As you have both arms extended in front of you holding the bar, bring your torso back around 30 degrees while sticking your chest out.",
      "Pull the bar down to about chin level or a little lower in a smooth movement whilst squeezing the shoulder blades together.",
      "After a second of squeezing, slowly raise the bar back to the starting position when your arms are fully extended."
    ]
  },
  {
    "exercise_id": "78948b30-4f20-48a9-ada3-737617b85f2e",
    "source_id": 84460948077646,
    "before_hash": "6d92b2f7dfdcf4e45c22e1f5d403270127eba301fada491b4b91cceb67a8f73b",
    "after_hash": "91301be3512206edffec9e5c81e394f3214b3cbac1b8e6e801be7c79894d9243",
    "expected_updated_at": "2026-10-14T10:47:02.32315+00:00",
    "steps": [
      "Raise your arm to shoulder height at 90 degrees to your body.",
      "Press lightly on your hand and push towards you.",
      "Rotate the arm across your body.",
      "Switch sides and repeat."
    ]
  },
  {
    "exercise_id": "80da666a-26c7-4060-921f-69f5d887136a",
    "source_id": 62797738117690,
    "before_hash": "4d39f13ebe3fb5d7345b763d04eec89123b03cf3a1f37c574688fdcdbab9d4cc",
    "after_hash": "47ecc1a62ad6c35cf93519303663aba6bc59aa8cd0c4797a86bd62435a67fea0",
    "expected_updated_at": "2026-10-14T10:46:57.910296+00:00",
    "steps": [
      "Step back with your right foot into a lunge position, both knees bent at 90 degrees.",
      "Twist your torso to the right, keeping the plate close to your chest.",
      "Push through your front foot to return to the starting position and repeat on the other side."
    ]
  },
  {
    "exercise_id": "8aee4fef-ff5a-481f-a8aa-e25e98010192",
    "source_id": 215711220842007,
    "before_hash": "453502bae0cc1d20ea4ca8dcb3a4c58e16cb5280d099710a89bfc2676dbdb874",
    "after_hash": "ffd955d73f03ffbf2e218d2761cd9aabb44d3f4367ceb1ed8b0006c5512c5232",
    "expected_updated_at": "2026-10-14T10:47:28.589771+00:00",
    "steps": [
      "Use a handle attachment. The cable should be set all the way to the bottom of the machine.",
      "Face away from the cable machine. Stagger your stance so you have a better base of support.",
      "Start with your elbow at a 90 degree angle with your palm facing down. Flex and extend at the wrist."
    ]
  },
  {
    "exercise_id": "8e8fd6cb-2969-4a0d-b11c-c963a080b2e9",
    "source_id": 92401292665135,
    "before_hash": "527f4454752f44c52259f84e2825aed6b29c4176c946e1f0959453c292aa8a31",
    "after_hash": "9d63af7779fde726046e105a812244d04a21d5cafc2a3c5a733fce5376efe281",
    "expected_updated_at": "2026-10-14T10:47:04.018799+00:00",
    "steps": [
      "Put on a dip belt and attach the cable carabiner to the chain/strap.",
      "Take a few steps back and stand tall. Raise up onto the balls of your feet and hold for a 1 count."
    ]
  },
  {
    "exercise_id": "90dfa42f-efc7-474c-9cda-f7d9ed603200",
    "source_id": 180136768720351,
    "before_hash": "d158cfd895a7c2cf936360a8d145c64460339a7948925900d31ff5ddd2b26e91",
    "after_hash": "af701ab96373ea534e3518c22560c9046fb1e29c6d4cb96f4d232f1a6fa6ffb7",
    "expected_updated_at": "2026-10-14T10:47:22.268541+00:00",
    "steps": [
      "Grip bars with arms straight, shoulders above hands. Keep legs straight or bent.",
      "Lower slowly until elbows are at 90 degrees.",
      "Push back up to start position, extending arms fully."
    ]
  },
  {
    "exercise_id": "9d8c3706-b54c-4029-8189-348470f4b39e",
    "source_id": 125070535724714,
    "before_hash": "be54508e803816abda022e1b7dfdf17a4604cf72c2bb56c888742b3cac602207",
    "after_hash": "c5f605ef1852da06a22ab42cf453fdcc0295d0d7b6769f5635747245f034dc8d",
    "expected_updated_at": "2026-10-14T10:47:10.86078+00:00",
    "steps": [
      "Lie on back, arms out, legs together.",
      "Lift legs to 90 degrees.",
      "Rotate legs side to side, keeping shoulders grounded."
    ]
  },
  {
    "exercise_id": "a424ec46-2fd1-4a46-a3ea-a883bfcb89f4",
    "source_id": 251872070488837,
    "before_hash": "55879716a86e849a98efca23a9f63d0e66c1b446a63d96098c8ca2527b5d078a",
    "after_hash": "25047a9627902e2b5ab8f65d4290aabdbd8ee04a9bb70efe876fb2c0f6d95322",
    "expected_updated_at": "2026-10-14T10:47:36.645503+00:00",
    "steps": [
      "Position the bench between 30 and 45 degrees.",
      "Lay flat on the bench with your feet on the ground.",
      "Lower the kettlebells to your mid chest",
      "Raise the kettlebells (slowly and controlled) until you've locked your elbows."
    ]
  },
  {
    "exercise_id": "acae8c6a-d0de-436d-9c04-8c92f3003aa4",
    "source_id": 4858582411034,
    "before_hash": "d64effea476334c44f9398d9879d39737ffab3732ad1cc4cce54bcb51746728a",
    "after_hash": "47686a046896479ab6f796769c9fc0743d07b4347ca5add51d97edbc7bde2434",
    "expected_updated_at": "2026-10-14T10:46:44.647928+00:00",
    "steps": [
      "Stand facing the barbell while holding the end of the bar at your side with one hand.",
      "With the leg on the same side of your body as the barbell, lunge backward and across your body at a 45 degree angle while keeping your weight on your front heel to lower your back knee gently to the ground.",
      "Drive through your front heel as you step back to the starting position, and repeat for the desired number of reps before switching sides."
    ]
  },
  {
    "exercise_id": "ad77025e-38b2-40c2-bccb-afa1248fd4da",
    "source_id": 262064414434146,
    "before_hash": "08244671015e127411ced248501e0d92937b6a68220bde2432a3f3ab1fdb4f94",
    "after_hash": "a9395c85997b8331d54a2862145c0dceebea89bd239099359170a5872becb025",
    "expected_updated_at": "2026-10-14T10:47:38.561535+00:00",
    "steps": [
      "Loop band around elbows, arms bent 90 degrees at sides.",
      "Raise one elbow outward to shoulder height.",
      "Lower slowly and alternate, keeping tension on band."
    ]
  },
  {
    "exercise_id": "b415a3f3-14c7-47e4-862a-f37b9c3163b0",
    "source_id": 174332831198338,
    "before_hash": "97720b7f86a55788703ba2d1968d0cd6ff16722c7a080d8be0ae0801f5f8cef5",
    "after_hash": "e773597c8bbfccebaf68c738a1cede363080a01e0b6e624b6119ba3b62c5ac91",
    "expected_updated_at": "2026-10-14T10:47:20.840816+00:00",
    "steps": [
      "Stand upright with your feet shoulder width apart.",
      "Keeping your chest facing forward, turn your head 90 degrees to the left. Then return to centre point.",
      "Repeat, turning your head in the other direction."
    ]
  },
  {
    "exercise_id": "b637bb52-7c75-4342-a8b0-09a28bb82fce",
    "source_id": 20374539110082,
    "before_hash": "70036d49994213b618b72345af3051b768612efe081f2cd7413e131713c42a76",
    "after_hash": "b0c7ead1c3dcb3158a76e1000afe1b0173358a820c8af845661b57ddc0412bb0",
    "expected_updated_at": "2026-10-14T10:46:47.853967+00:00",
    "steps": [
      "Place the top of your hand into the small of your back, your arm at a 90 degree angle.",
      "Hold your elbow with the other arm, and slowly pull the arm forward until you feel your shoulder engaged in the stretch. Pause at the apex of the stretch and return to the starting position.",
      "Return to starting position, and repeat with your other arm."
    ]
  },
  {
    "exercise_id": "b71d4fa0-47ae-480f-a244-0a4a292c1f96",
    "source_id": 211403545163251,
    "before_hash": "bd61f4bc579f2a6f51a596b2af3d5660828b2571885a213efcd75ccc2f0b88b6",
    "after_hash": "b905bc8a0d6a0b0a8e17bb81ec0d04eb13f1bf52dfff5fd57c36383da3c3f32a",
    "expected_updated_at": "2026-10-14T10:47:27.88413+00:00",
    "steps": [
      "Lay flat and bring your left leg to 90 degrees.",
      "Hold your left leg with both hands and slowly rotate your hips to the right hand side.",
      "Hold at the peak of the stretch, then slowly return to starting position.",
      "Switch sides and repeat."
    ]
  },
  {
    "exercise_id": "b87e6b1b-6800-4998-a22d-1248fe674499",
    "source_id": 266502207720283,
    "before_hash": "d348260931f6835b41b90d42594502dabded2ac356ab3157cfe3ab72127d9a1b",
    "after_hash": "8a493936c9bebfd0180b9a823a978af3f0297718a755b83b6b4b5185f6be9a83",
    "expected_updated_at": "2026-10-14T10:47:39.170743+00:00",
    "steps": [
      "Sit on the machine with your back against the cushion and adjust the machine you are using so that your knees are at a 90 degree angle at the starting position.",
      "Raise the weight by extending your knees outward, then lower your leg to the starting position. Both movements should be done in a slow, controlled motion."
    ]
  },
  {
    "exercise_id": "cb875305-f2f6-48fc-909e-27815d816abf",
    "source_id": 255768199916496,
    "before_hash": "b837f4e2680afb82090ecbfcbd2fb79bf32abf53c7f46ca071377040b6d69dfd",
    "after_hash": "a9c00d4e427d6fbad46a3358e534aa5f99de018b16e6a3cb61cd4963ba9f3857",
    "expected_updated_at": "2026-10-14T10:47:37.121622+00:00",
    "steps": [
      "Use a dip belt to attach a dumbbell to yourself. Grip bars with arms straight, shoulders above hands. Keep legs straight or bent.",
      "Lower slowly until elbows are at 90 degrees.",
      "Push back up to start position, extending arms fully."
    ]
  },
  {
    "exercise_id": "d06f14d0-9a5b-47b0-ae6b-d808251ef169",
    "source_id": 100214159909435,
    "before_hash": "539db23dbd992c8edea8af83cb4977519b366e0ed98076cba4cabac8ec22aa2a",
    "after_hash": "52141d41f522ac1fdd93521aa3672074ef0808fc1cc806b0db5ae121d90619e4",
    "expected_updated_at": "2026-10-14T10:47:05.446149+00:00",
    "steps": [
      "Position the bench between 45 and 60 degrees.",
      "Lay flat on the bench with your feet on the ground. With straight arms unrack the bar.",
      "Lower the bar to your mid chest",
      "Raise the bar (slowly and controlled) until you've locked your elbows."
    ]
  },
  {
    "exercise_id": "d2efa759-8d10-4e96-9563-f4c34e398abe",
    "source_id": 158077836240562,
    "before_hash": "03f93d19361d297787438701cf03ac6e781f8de661947d6a5d6b342fb4571af8",
    "after_hash": "8686f0af918bd8dd1f5a95cdd288cc8a5a5500c5bcf129d9231046eec3ed003d",
    "expected_updated_at": "2026-10-14T10:47:17.059428+00:00",
    "steps": [
      "Using a raised wall, place your arm at a 90 degree angle against it.",
      "With a staggered stance, lean into the wall extending your chest.",
      "Pause for a few seconds and then return to starting position and repeat on opposite side."
    ]
  },
  {
    "exercise_id": "dc46c05f-2836-4af7-9905-1aa16a670493",
    "source_id": 48976058376042,
    "before_hash": "54a64fc8faf9b0a6021b2c0ba3740a2be2f4f8c32d45f5681885d92e77e0029b",
    "after_hash": "6fbed79f8fec7dc55b0ced28e32f3ae825b464a03be184ec54a19d49e8040dc7",
    "expected_updated_at": "2026-10-14T10:46:54.238894+00:00",
    "steps": [
      "Hold the cable handle in one hand, elbow bent at 90 degrees going across your torso.",
      "Rotate your arm outward, keeping your elbow stable."
    ]
  },
  {
    "exercise_id": "eb499a97-b40c-4cda-8a79-b5d53a7c3716",
    "source_id": 21143202119942,
    "before_hash": "7815d24494b19ee1451fce4c05b6f4ff5b145b19fa1adf8a93319d86e13a6ad8",
    "after_hash": "b13fda24ab9ff22676606247b147c218d6739e60981c8b6ad54943a50df3a948",
    "expected_updated_at": "2026-10-14T10:46:48.159179+00:00",
    "steps": [
      "Start facing the barbell while holding the end of the bar in the goblet position in front of your chest with your elbows close to your sides.",
      "Step backward and across your body with one leg at a 45 degree angle while keeping your weight on your front heel to gently lower your back knee to the ground.",
      "Drive through your front heel as you step back up and to the starting position.",
      "Repeat for the desired number of reps before switching legs."
    ]
  },
  {
    "exercise_id": "f8818dd6-62df-40b3-b06e-4cdbf1bc9b59",
    "source_id": 246833846879451,
    "before_hash": "fe7728d1c245f00a3f86ce1bbdda9d1b7d70644917573e56fc99a6e2e75a301d",
    "after_hash": "e8b183ee50694c145138b2d8c66fb55801f8bc7228ed15a4862e67fe1e7a7b6d",
    "expected_updated_at": "2026-10-14T10:47:35.48179+00:00",
    "steps": [
      "Hold barbell with a wide grip. Your arms should be at a roughly 30 degree angle.",
      "Pull your shoulders towards your ears instead of straight up toward the ceiling."
    ]
  },
  {
    "exercise_id": "fde63e2f-1d58-404a-9f37-34a0db384220",
    "source_id": 57648573545124,
    "before_hash": "1aa5e937e8d37324c9789d0386456182ba03f73b511109b30d2e3e9cf47d1c4c",
    "after_hash": "1a6ab2e321df347a1ee421b97f871814af2ed4d6b0c7b59eacad74dc8e0c64d8",
    "expected_updated_at": "2026-10-14T10:46:56.457069+00:00",
    "steps": [
      "Stand on the band with one or 2 feet depending on how heavy you want the band to be.",
      "With your elbows extended raise your fists straight up to the ceiling until they are at eye level."
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
    "exercise_id": "fde63e2f-1d58-404a-9f37-34a0db384220",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "1a6ab2e321df347a1ee421b97f871814af2ed4d6b0c7b59eacad74dc8e0c64d8",
    "name": "Nâng tay ra trước với dây kháng lực",
    "description": "",
    "steps": [
      "Giẫm lên dây bằng một hoặc 2 bàn chân tùy mức kháng lực mong muốn.",
      "Giữ khuỷu tay duỗi, nâng nắm tay thẳng lên phía trần đến ngang mắt."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "409f685b-d478-436d-a86b-cfee60294b44",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3c9906e90ac201d91e25bb9ed272b4698e86b6edd11aed1c7d4a2a6e92bf96b1",
    "name": "Đạp chân với dây kháng lực",
    "description": "",
    "steps": [
      "Nằm phẳng trên sàn, đầu gần điểm neo dây, điểm neo cao hơn đầu 6 đến 12 inch.",
      "Vòng dây quanh giữa bàn chân, duỗi gối và hông."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "ad77025e-38b2-40c2-bccb-afa1248fd4da",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "a9395c85997b8331d54a2862145c0dceebea89bd239099359170a5872becb025",
    "name": "Nâng khuỷu tay sang ngang luân phiên với mini band",
    "description": "",
    "steps": [
      "Vòng dây quanh khuỷu tay, hai tay co 90 độ ở hai bên thân.",
      "Nâng một khuỷu tay ra ngoài đến ngang vai.",
      "Từ từ hạ xuống và luân phiên hai bên, giữ lực căng trên dây."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "527c0819-c11c-41db-9f45-d4c7761fac09",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e09e3e34b1d03c5efaa0a5e535e8deb457859d90544482bdd518952a8a02660b",
    "name": "Xoay ngoài vai với mini band",
    "description": "",
    "steps": [
      "Neo dây, giữ khuỷu tay sát thân và co 90 độ.",
      "Xoay cẳng tay ra ngoài, giữ khuỷu tay cố định.",
      "Từ từ trở về vị trí ban đầu, kiểm soát lực kháng."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "f8818dd6-62df-40b3-b06e-4cdbf1bc9b59",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e8b183ee50694c145138b2d8c66fb55801f8bc7228ed15a4862e67fe1e7a7b6d",
    "name": "Nhún vai với tạ đòn ở góc 30 độ",
    "description": "",
    "steps": [
      "Giữ tạ đòn với tay nắm rộng. Hai tay tạo góc khoảng 30 độ.",
      "Kéo vai về phía tai thay vì nâng thẳng lên phía trần."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "64dc6018-12ff-4a7b-8d45-3d0973b58097",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "103b25d34cf8c67cea33dcd639cf5be541e18734761efc6829ba86449de63c47",
    "name": "Nhún vai với tạ đòn sau lưng ở góc 30 độ",
    "description": "",
    "steps": [
      "Giữ tạ đòn phía sau, hai tay tạo góc 30 độ với thân.",
      "Nhún vai lên và hơi ra sau về phía tai, giữ khuỷu tay duỗi thẳng.",
      "Dừng ngắn ở điểm cao nhất rồi hạ có kiểm soát đến khi giãn hết."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "d06f14d0-9a5b-47b0-ae6b-d808251ef169",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "52141d41f522ac1fdd93521aa3672074ef0808fc1cc806b0db5ae121d90619e4",
    "name": "Đẩy tạ đòn trên ghế dốc cao",
    "description": "",
    "steps": [
      "Đặt ghế ở góc từ 45 đến 60 độ.",
      "Nằm phẳng trên ghế, đặt bàn chân trên sàn. Duỗi tay và nhấc thanh đòn khỏi giá.",
      "Hạ thanh đòn về giữa ngực.",
      "Nâng thanh đòn chậm và có kiểm soát đến khi khuỷu tay duỗi thẳng hết."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "6433bf12-e67e-4ea7-841d-e0c741f7e6b1",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ae246d6406a7df57d83986268086c4c8b2d53cfccf8fcd04024b87a3a4982cff",
    "name": "Đẩy tạ đòn trên ghế dốc lên",
    "description": "",
    "steps": [
      "Đặt ghế ở góc từ 30 đến 45 độ.",
      "Nằm phẳng trên ghế, đặt bàn chân trên sàn. Duỗi tay và nhấc thanh đòn khỏi giá.",
      "Hạ thanh đòn về giữa ngực.",
      "Nâng thanh đòn chậm và có kiểm soát đến khi khuỷu tay duỗi thẳng hết."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "acae8c6a-d0de-436d-9c04-8c92f3003aa4",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "47686a046896479ab6f796769c9fc0743d07b4347ca5add51d97edbc7bde2434",
    "name": "Chùng chân bắt chéo với landmine",
    "description": "",
    "steps": [
      "Đứng đối diện thanh đòn, một tay giữ đầu thanh đòn ở bên thân.",
      "Dùng chân cùng bên với thanh đòn bước lùi và chéo qua thân ở góc 45 độ, giữ trọng lượng trên gót chân trước để nhẹ nhàng hạ đầu gối sau xuống sàn.",
      "Đạp qua gót chân trước để bước về vị trí ban đầu, lặp lại theo số lần mong muốn rồi đổi bên."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "62a98c2f-1a87-4320-8337-a637b4f3634e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "a327d859b438002d7217ca2ad73af10b4c1f912c6f43c566b7519fe5f3133f1c",
    "name": "Đá chân ra sau với landmine",
    "description": "",
    "steps": [
      "Bắt đầu chống hai tay và hai gối vuông góc với thanh đòn, đầu thanh đòn tựa vào mặt trong đầu gối phía gần thanh đòn.",
      "Giữ cơ trung tâm siết, lưng phẳng và chân đang tập co 90 độ, đẩy gót chân lên phía trần đồng thời siết cơ mông.",
      "Đưa đầu gối theo quỹ đạo trở xuống sàn dưới hông, giữ gối co để kiểm soát thanh đòn.",
      "Lặp lại theo số lần mong muốn rồi đổi bên."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "eb499a97-b40c-4cda-8a79-b5d53a7c3716",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "b13fda24ab9ff22676606247b147c218d6739e60981c8b6ad54943a50df3a948",
    "name": "Chùng chân bắt chéo giữ landmine trước ngực",
    "description": "",
    "steps": [
      "Bắt đầu đối diện thanh đòn, giữ đầu thanh đòn trước ngực ở tư thế goblet và khuỷu tay sát thân.",
      "Bước lùi và chéo qua thân bằng một chân ở góc 45 độ, giữ trọng lượng trên gót chân trước để nhẹ nhàng hạ đầu gối sau xuống sàn.",
      "Đạp qua gót chân trước để bước lên trở về vị trí ban đầu.",
      "Lặp lại theo số lần mong muốn rồi đổi chân."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "48851130-e3d7-4a55-94fa-255322897744",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "3f3500468b42f128d8f79d23dc3982d54e5b5995730ff7c282e62d46adc0ec7f",
    "name": "Đẩy ngực một tay với landmine",
    "description": "",
    "steps": [
      "Nằm ngửa vuông góc với thanh đòn, dùng tay phía xa điểm gắn landmine giữ đầu thanh đòn. Khuỷu tay tựa sàn ở góc 45 đến 60 độ với thân, cổ tay ngay trên khuỷu tay.",
      "Đẩy đầu thanh đòn lên, siết ngực ở điểm cao nhất. Hạ thanh đòn đến khi khuỷu tay chạm nhẹ sàn.",
      "Lặp lại đủ số lần mong muốn ở một bên rồi đổi bên."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "671ac465-b4d9-498f-881a-912d1e2528c5",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "a9da120fcaf5cc0baffe08d8d693ba452ef6f1bcfea0c71116c1f56706fbc56b",
    "name": "Gập bụng ngồi dậy với landmine",
    "description": "",
    "steps": [
      "Nằm phẳng trên sàn, giữ đầu thanh đòn với hai tay duỗi.",
      "Nâng lưng khỏi sàn đến khi ngồi ở góc 90 độ.",
      "Sau đó từ từ hạ trở lại sàn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "90dfa42f-efc7-474c-9cda-f7d9ed603200",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "af701ab96373ea534e3518c22560c9046fb1e29c6d4cb96f4d232f1a6fa6ffb7",
    "name": "Chống đẩy xà kép",
    "description": "",
    "steps": [
      "Nắm hai thanh xà, tay thẳng và vai trên bàn tay. Giữ chân thẳng hoặc co.",
      "Từ từ hạ người đến khi khuỷu tay ở góc 90 độ.",
      "Đẩy lên về vị trí ban đầu, duỗi hoàn toàn tay."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "6af3a49a-5a01-4cb1-8b41-acb2e3a2d9db",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "cf874b3a293c07280273d5b94147ea3b5fb8297723961559a15e19fe4c803280",
    "name": "Squat tựa tường với bóng thăng bằng",
    "description": "",
    "steps": [
      "Đứng hai chân rộng bằng vai, đặt bóng thăng bằng giữa lưng dưới và tường.",
      "Từ từ squat xuống bằng cách co gối đến 90 độ, giữ lưng thẳng và cơ trung tâm siết.",
      "Ấn qua gót chân, duỗi chân và đứng lên, giữ thăng bằng và kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "9d8c3706-b54c-4029-8189-348470f4b39e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "c5f605ef1852da06a22ab42cf453fdcc0295d0d7b6769f5635747245f034dc8d",
    "name": "Xoay chân kiểu cần gạt nước",
    "description": "",
    "steps": [
      "Nằm ngửa, hai tay dang và hai chân sát nhau.",
      "Nâng chân đến 90 độ.",
      "Xoay hai chân sang hai bên, giữ vai trên sàn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "61dccbc8-0f36-461c-ba4a-4f8ec7ab9593",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e8d7bd244065d850c7cb6817baa5c28012e90615728b965959c3f197b6535955",
    "name": "Squat tách chân với bóng BOSU",
    "description": "",
    "steps": [
      "Đứng trước BOSU, một bàn chân ở giữa bóng.",
      "Hạ vào tư thế chùng chân, đầu gối ở góc 90 độ.",
      "Đạp chân trước để trở về vị trí ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "8e8fd6cb-2969-4a0d-b11c-c963a080b2e9",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "9d63af7779fde726046e105a812244d04a21d5cafc2a3c5a733fce5376efe281",
    "name": "Nhón gót với đai gắn cáp",
    "description": "",
    "steps": [
      "Đeo đai tập xà kép và móc khóa cáp vào xích hoặc dây đai.",
      "Bước lùi vài bước rồi đứng thẳng. Nhón lên phần đệm trước bàn chân và giữ trong 1 nhịp đếm."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "13950676-cd8b-4856-81ad-99dbbce23e15",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "403c39a652c7643ec1424cdb692195c1a665e7c823749363c6f26d6a9286731e",
    "name": "Đẩy cáp chéo tập tay sau",
    "description": "",
    "steps": [
      "Dùng hai tay cầm hoặc không dùng phụ kiện. Đặt cả hai bên cáp chéo ở vị trí cao nhất.",
      "Đứng giữa máy, mỗi tay giữ cáp bên đối diện. Cánh tay trên tạo góc 45 độ với thân.",
      "Duỗi khuỷu tay đến khi cảm thấy cơ co rồi trở về vị trí ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "dc46c05f-2836-4af7-9905-1aa16a670493",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "6fbed79f8fec7dc55b0ced28e32f3ae825b464a03be184ec54a19d49e8040dc7",
    "name": "Xoay ngoài vai với cáp",
    "description": "",
    "steps": [
      "Một tay giữ tay cầm cáp, khuỷu tay co 90 độ và tay đi ngang qua thân.",
      "Xoay tay ra ngoài, giữ khuỷu tay ổn định."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "021f6cb3-27a9-4962-a250-79fa9517f933",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "b88bdbfa7d21977876185416304f50ac0cb6e1a2b1305326733f07aa5a12ebc8",
    "name": "Xoay trong vai với cáp",
    "description": "",
    "steps": [
      "Đứng thẳng, nắm tay cầm cáp bằng tay nắm trung tính, khuỷu tay ở góc 90 độ.",
      "Xoay vai bằng cách đưa cẳng tay ngang qua thân."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "8aee4fef-ff5a-481f-a8aa-e25e98010192",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "ffd955d73f03ffbf2e218d2761cd9aabb44d3f4367ceb1ed8b0006c5512c5232",
    "name": "Duỗi cổ tay với cáp",
    "description": "",
    "steps": [
      "Dùng phụ kiện tay cầm. Đặt cáp ở vị trí thấp nhất của máy.",
      "Quay mặt ra xa máy cáp. Đứng chân trước chân sau để có điểm tựa vững hơn.",
      "Bắt đầu với khuỷu tay ở góc 90 độ, lòng bàn tay hướng xuống. Gập và duỗi cổ tay."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "cb875305-f2f6-48fc-909e-27815d816abf",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "a9c00d4e427d6fbad46a3358e534aa5f99de018b16e6a3cb61cd4963ba9f3857",
    "name": "Chống đẩy xà kép gắn tạ đơn",
    "description": "",
    "steps": [
      "Dùng đai tập xà kép gắn tạ đơn vào người. Nắm hai thanh xà, tay thẳng và vai trên bàn tay. Giữ chân thẳng hoặc co.",
      "Từ từ hạ người đến khi khuỷu tay ở góc 90 độ.",
      "Đẩy lên về vị trí ban đầu, duỗi hoàn toàn tay."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "00e0406c-028e-488b-9567-03080b5137e0",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "95e0d560d3d21bc57c429650c1241a186c8c1b5bded07cfeda614b3f46c77dd2",
    "name": "Đẩy tạ ấm trên ghế dốc cao",
    "description": "",
    "steps": [
      "Đặt ghế ở góc từ 45 đến 60 độ.",
      "Nằm phẳng trên ghế, đặt bàn chân trên sàn.",
      "Hạ tạ ấm về giữa ngực.",
      "Nâng tạ ấm chậm và có kiểm soát đến khi khuỷu tay duỗi thẳng hết."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "a424ec46-2fd1-4a46-a3ea-a883bfcb89f4",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "25047a9627902e2b5ab8f65d4290aabdbd8ee04a9bb70efe876fb2c0f6d95322",
    "name": "Đẩy tạ ấm trên ghế dốc lên",
    "description": "",
    "steps": [
      "Đặt ghế ở góc từ 30 đến 45 độ.",
      "Nằm phẳng trên ghế, đặt bàn chân trên sàn.",
      "Hạ tạ ấm về giữa ngực.",
      "Nâng tạ ấm chậm và có kiểm soát đến khi khuỷu tay duỗi thẳng hết."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "b87e6b1b-6800-4998-a22d-1248fe674499",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "8a493936c9bebfd0180b9a823a978af3f0297718a755b83b6b4b5185f6be9a83",
    "name": "Duỗi gối trên máy",
    "description": "",
    "steps": [
      "Ngồi trên máy, lưng tựa đệm, điều chỉnh máy để đầu gối ở góc 90 độ tại vị trí bắt đầu.",
      "Nâng tạ bằng cách duỗi gối ra rồi hạ chân về vị trí ban đầu. Cả hai chiều chuyển động cần chậm và có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "41275e45-0a4b-4352-970d-e0f389ec663a",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "f3b392a4b2bd816fbf5714b8337be9115b89fe0d5231ad37fec0c95a32500e97",
    "name": "Duỗi gối trên máy gắn bánh tạ",
    "description": "",
    "steps": [
      "Ngồi trên máy, lưng tựa đệm, điều chỉnh máy để đầu gối ở góc 90 độ tại vị trí bắt đầu.",
      "Nâng tạ bằng cách duỗi gối ra rồi hạ chân về vị trí ban đầu. Cả hai chiều chuyển động cần chậm và có kiểm soát."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "77222098-18f3-4e01-b21f-cdf90a08d6bb",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "7a4a3f1a83223eb972d378240dca38bc76d7df6c1ea94b40e9f6899b060221ce",
    "name": "Kéo xô trên máy",
    "description": "",
    "steps": [
      "Nắm thanh với lòng bàn tay hướng về trước, hai tay rộng hơn vai.",
      "Khi hai tay duỗi phía trước giữ thanh, ngả thân ra sau khoảng 30 độ và nâng ngực.",
      "Kéo thanh xuống khoảng ngang cằm hoặc thấp hơn một chút theo chuyển động mượt, đồng thời siết hai bả vai lại gần nhau.",
      "Siết trong một giây rồi từ từ nâng thanh về vị trí ban đầu đến khi hai tay duỗi hoàn toàn."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "80da666a-26c7-4060-921f-69f5d887136a",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "47ecc1a62ad6c35cf93519303663aba6bc59aa8cd0c4797a86bd62435a67fea0",
    "name": "Chùng chân lùi xoay người với bánh tạ",
    "description": "",
    "steps": [
      "Bước chân phải ra sau vào tư thế chùng chân, cả hai gối co 90 độ.",
      "Xoay thân sang phải, giữ bánh tạ sát ngực.",
      "Đạp chân trước để trở về vị trí ban đầu rồi lặp lại bên kia."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "510abfb8-b0dd-4953-a347-34639ac9f210",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "00393aae1cf3fe6a6330e461608eeecb0cfabed188519d0582b5f78a4ff4ad30",
    "name": "Chống đẩy xà kép gắn bánh tạ",
    "description": "",
    "steps": [
      "Dùng đai tập xà kép gắn bánh tạ vào người. Nắm hai thanh xà, tay thẳng và vai trên bàn tay. Giữ chân thẳng hoặc co.",
      "Từ từ hạ người đến khi khuỷu tay ở góc 90 độ.",
      "Đẩy lên về vị trí ban đầu, duỗi hoàn toàn tay."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "0d274d59-d309-4a3b-bf06-d816dadbc9ca",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "35b96cf173ef775caa07fa11aa463c6525750381a5d86bbb4e5233ab33d993a6",
    "name": "Đá chân ra sau trên máy Smith",
    "description": "",
    "steps": [
      "Bắt đầu chống hai tay và hai gối, một bàn chân đặt vào mặt dưới thanh đòn.",
      "Giữ cơ trung tâm siết, lưng phẳng và chân đang tập co 90 độ, đẩy gót chân lên phía trần đồng thời siết cơ mông.",
      "Đưa đầu gối theo quỹ đạo trở xuống sàn dưới hông, giữ gối co để kiểm soát thanh đòn.",
      "Lặp lại theo số lần mong muốn rồi đổi bên."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "29ca15ed-d688-4e9c-9c0b-2ced5cfb9e8c",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "c599aa78d32e706fdc13a525dba638d22728bd28e3516e1467a40301cc775c75",
    "name": "Đẩy ngực trên ghế dốc lên với máy Smith",
    "description": "",
    "steps": [
      "Đặt ghế ở góc từ 30 đến 45 độ.",
      "Nằm phẳng trên ghế, đặt bàn chân trên sàn. Duỗi tay và nhấc thanh đòn khỏi giá.",
      "Hạ thanh đòn về giữa ngực.",
      "Nâng thanh đòn chậm và có kiểm soát đến khi khuỷu tay duỗi thẳng hết."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "d2efa759-8d10-4e96-9563-f4c34e398abe",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "8686f0af918bd8dd1f5a95cdd288cc8a5a5500c5bcf129d9231046eec3ed003d",
    "name": "Giãn cơ ngực biến thể một",
    "description": "",
    "steps": [
      "Dùng tường cao, đặt tay tựa vào tường ở góc 90 độ.",
      "Đứng chân trước chân sau, nghiêng vào tường để mở ngực.",
      "Dừng vài giây rồi trở về vị trí ban đầu và lặp lại bên đối diện."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "78948b30-4f20-48a9-ada3-737617b85f2e",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "91301be3512206edffec9e5c81e394f3214b3cbac1b8e6e801be7c79894d9243",
    "name": "Giãn cơ cẳng tay biến thể bốn",
    "description": "",
    "steps": [
      "Nâng tay ngang vai, tạo góc 90 độ với thân.",
      "Ấn nhẹ lên bàn tay và đẩy về phía mình.",
      "Xoay tay ngang qua thân.",
      "Đổi bên và lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "532d22b3-fba0-4749-8605-8f7cc98d4a1c",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "38b2d69f6d85d5f08f817e210bcdf1117a9d8887e67a338457ab3920333be258",
    "name": "Giãn cơ cẳng tay biến thể ba",
    "description": "",
    "steps": [
      "Đặt hai bàn tay lại với nhau.",
      "Xoay cánh tay và bàn tay 180 độ.",
      "Giữ ở điểm giãn sâu nhất.",
      "Trở về vị trí ban đầu."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "b71d4fa0-47ae-480f-a244-0a4a292c1f96",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "b905bc8a0d6a0b0a8e17bb81ec0d04eb13f1bf52dfff5fd57c36383da3c3f32a",
    "name": "Giãn cơ mông biến thể ba",
    "description": "",
    "steps": [
      "Nằm phẳng và đưa chân trái lên 90 độ.",
      "Giữ chân trái bằng hai tay, từ từ xoay hông sang bên phải.",
      "Giữ ở điểm giãn sâu nhất rồi từ từ trở về vị trí ban đầu.",
      "Đổi bên và lặp lại."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "b637bb52-7c75-4342-a8b0-09a28bb82fce",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "b0c7ead1c3dcb3158a76e1000afe1b0173358a820c8af845661b57ddc0412bb0",
    "name": "Giãn vai biến thể ba",
    "description": "",
    "steps": [
      "Đặt mu bàn tay vào vùng lõm lưng dưới, tay ở góc 90 độ.",
      "Dùng tay kia giữ khuỷu tay, từ từ kéo tay về trước đến khi cảm thấy vai được giãn. Dừng ở điểm giãn sâu nhất rồi trở về vị trí ban đầu.",
      "Trở về vị trí ban đầu rồi lặp lại với tay kia."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
  },
  {
    "exercise_id": "b415a3f3-14c7-47e4-862a-f37b9c3163b0",
    "locale": "vi",
    "source_locale": "en",
    "source_hash": "e773597c8bbfccebaf68c738a1cede363080a01e0b6e624b6119ba3b62c5ac91",
    "name": "Giãn cơ thang biến thể hai",
    "description": "",
    "steps": [
      "Đứng thẳng, hai chân rộng bằng vai.",
      "Giữ ngực hướng về trước, xoay đầu 90 độ sang trái rồi trở về giữa.",
      "Lặp lại bằng cách xoay đầu sang hướng kia."
    ],
    "translation_status": "reviewed",
    "reviewed_at": "2026-10-23T01:38:02.947Z"
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
  if (select count(*) from _noi_gym_restore_sources) <> 40
    or (select count(distinct exercise_id) from _noi_gym_restore_sources) <> 40
    or (select count(*) from _noi_gym_restore_translations) <> 38
    or (select count(*) from _noi_gym_restore_before) <> 40 then
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
      and current.translation_status = 'reviewed' and current.reviewed_at = planned.reviewed_at) <> 38 then
    raise exception 'Incomplete translation import; repair rolled back';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.exercises'::regclass and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger was not restored; repair rolled back';
  end if;
end;
$verify_after$;
commit;

-- Expected immediately after this patch: reviewed_total 1772, VI 1771, EN 1.
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
