-- Noi Gym / exhgtcaczbgdqfozwrvg: remove difficulty metadata from 8 EN/VI instruction lists.
-- Full expected translation revisions are checked before any write. Run the entire file.
-- Temporary scratch tables disappear at commit. Public RLS and validation triggers stay enabled.
begin;
set local lock_timeout = '5s';
lock table public.exercises in share row exclusive mode;
lock table public.exercise_translations in share row exclusive mode;
create temp table _metadata_patch on commit drop as
select * from jsonb_to_recordset($metadata_payload$
[
  {
    "exercise_id": "1779ed17-59ce-4479-a0f1-15e49ccc5033",
    "source_id": 205350103074314,
    "expected_updated_at": "2026-10-14T10:47:26.766369+00:00",
    "before_hash": "0cc7c1484ac78fd45a0077238d9e585ed538d6187e27a913ac7acf6d610a5355",
    "after_hash": "9fc141276d7c1826b6926a5ce1096b9d7e520508a26b6f94d1671852141b4e6d",
    "steps": [
      "Begin in a kneeling position with your knees together and your shins and feet on the floor.",
      "Sit back on your heels and place your palms face down on your thighs, with your fingers pointing towards your knees.",
      "Relax your shoulders and take deep breaths.",
      "Hold the pose for several breaths or as long as is comfortable."
    ],
    "before_translation": {
      "exercise_id": "1779ed17-59ce-4479-a0f1-15e49ccc5033",
      "locale": "vi",
      "name": "Tư thế kim cương Vajrasana biến thể 1",
      "description": "",
      "steps": [
        "Người mới bắt đầu.",
        "Bắt đầu quỳ với hai đầu gối sát nhau, cẳng chân và bàn chân trên sàn.",
        "Ngồi về gót chân, đặt lòng bàn tay úp trên đùi với các ngón hướng về đầu gối.",
        "Thả lỏng vai và thở sâu.",
        "Giữ trong vài nhịp thở hoặc trong khoảng thời gian còn thoải mái."
      ],
      "source_locale": "en",
      "source_hash": "0cc7c1484ac78fd45a0077238d9e585ed538d6187e27a913ac7acf6d610a5355",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T00:56:38.229+00:00",
      "created_at": "2026-10-23T00:59:44.546479+00:00",
      "updated_at": "2026-10-23T00:59:44.546479+00:00"
    },
    "after_translation": {
      "exercise_id": "1779ed17-59ce-4479-a0f1-15e49ccc5033",
      "locale": "vi",
      "name": "Tư thế kim cương Vajrasana biến thể 1",
      "description": "",
      "steps": [
        "Bắt đầu quỳ với hai đầu gối sát nhau, cẳng chân và bàn chân trên sàn.",
        "Ngồi về gót chân, đặt lòng bàn tay úp trên đùi với các ngón hướng về đầu gối.",
        "Thả lỏng vai và thở sâu.",
        "Giữ trong vài nhịp thở hoặc trong khoảng thời gian còn thoải mái."
      ],
      "source_locale": "en",
      "source_hash": "9fc141276d7c1826b6926a5ce1096b9d7e520508a26b6f94d1671852141b4e6d",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T04:33:17.421Z",
      "created_at": "2026-10-23T00:59:44.546479+00:00",
      "updated_at": "2026-10-23T00:59:44.546479+00:00"
    }
  },
  {
    "exercise_id": "1d82b2b8-7786-446f-9dd7-6360e2caacf9",
    "source_id": 58122968730966,
    "expected_updated_at": "2026-10-14T10:46:56.580389+00:00",
    "before_hash": "b92df305f5c67601f808e11ccee50a3a05b7eb48c0ab30e309b388ecce028adb",
    "after_hash": "67e4220718acba7df66624c63aa48108c1bf2a165d0caca7dabd01d2d3a104dc",
    "steps": [
      "Begin in a kneeling position with your knees together and your shins and feet on the floor.",
      "Sit back on your heels and place the tops of your hands on your thighs, with your fingers pointing towards your knees.",
      "Relax your shoulders and take deep breaths.",
      "Hold the pose for several breaths or as long as is comfortable."
    ],
    "before_translation": {
      "exercise_id": "1d82b2b8-7786-446f-9dd7-6360e2caacf9",
      "locale": "vi",
      "name": "Tư thế kim cương Vajrasana biến thể 2",
      "description": "",
      "steps": [
        "Người mới bắt đầu.",
        "Bắt đầu quỳ với hai đầu gối sát nhau, cẳng chân và bàn chân trên sàn.",
        "Ngồi về gót chân, đặt mu bàn tay trên đùi với các ngón hướng về đầu gối.",
        "Thả lỏng vai và thở sâu.",
        "Giữ trong vài nhịp thở hoặc trong khoảng thời gian còn thoải mái."
      ],
      "source_locale": "en",
      "source_hash": "b92df305f5c67601f808e11ccee50a3a05b7eb48c0ab30e309b388ecce028adb",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T00:56:38.229+00:00",
      "created_at": "2026-10-23T00:59:44.753998+00:00",
      "updated_at": "2026-10-23T00:59:44.753998+00:00"
    },
    "after_translation": {
      "exercise_id": "1d82b2b8-7786-446f-9dd7-6360e2caacf9",
      "locale": "vi",
      "name": "Tư thế kim cương Vajrasana biến thể 2",
      "description": "",
      "steps": [
        "Bắt đầu quỳ với hai đầu gối sát nhau, cẳng chân và bàn chân trên sàn.",
        "Ngồi về gót chân, đặt mu bàn tay trên đùi với các ngón hướng về đầu gối.",
        "Thả lỏng vai và thở sâu.",
        "Giữ trong vài nhịp thở hoặc trong khoảng thời gian còn thoải mái."
      ],
      "source_locale": "en",
      "source_hash": "67e4220718acba7df66624c63aa48108c1bf2a165d0caca7dabd01d2d3a104dc",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T04:33:17.421Z",
      "created_at": "2026-10-23T00:59:44.753998+00:00",
      "updated_at": "2026-10-23T00:59:44.753998+00:00"
    }
  },
  {
    "exercise_id": "81f96125-adaf-453f-8bd4-2cf00f1a1fed",
    "source_id": 200993322921583,
    "expected_updated_at": "2026-10-14T10:47:26.027927+00:00",
    "before_hash": "aaf3d5d10b214b56ccb9e142add2754bec4a2e9090776d63ebf60e75128540af",
    "after_hash": "24a5f6c7ec7464f771a48ee468445db89eede705022872f396b14ef477541888",
    "steps": [
      "Sit or lie supported, spine long, arms positioned in a v-pose.",
      "Initiate movement by drawing shoulder blades together and down.",
      "Move arms down to your sides, keeping neck relaxed and ribs down.",
      "Maintain control throughout, emphasizing mid-back engagement over arm dominance."
    ],
    "before_translation": {
      "exercise_id": "81f96125-adaf-453f-8bd4-2cf00f1a1fed",
      "locale": "vi",
      "name": "Chuỗi bài lưng giữa 3 trong Pilates",
      "description": "",
      "steps": [
        "Cơ bản.",
        "Ngồi hoặc nằm có điểm đỡ, giữ cột sống dài và tay ở hình chữ V.",
        "Bắt đầu chuyển động bằng cách kéo hai bả vai lại gần nhau và hạ xuống.",
        "Đưa tay xuống hai bên thân, giữ cổ thả lỏng và xương sườn hạ.",
        "Giữ kiểm soát suốt động tác, tập trung cơ lưng giữa thay vì dùng tay là chính."
      ],
      "source_locale": "en",
      "source_hash": "aaf3d5d10b214b56ccb9e142add2754bec4a2e9090776d63ebf60e75128540af",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T01:00:00.629+00:00",
      "created_at": "2026-10-23T01:02:28.640592+00:00",
      "updated_at": "2026-10-23T01:02:28.640592+00:00"
    },
    "after_translation": {
      "exercise_id": "81f96125-adaf-453f-8bd4-2cf00f1a1fed",
      "locale": "vi",
      "name": "Chuỗi bài lưng giữa 3 trong Pilates",
      "description": "",
      "steps": [
        "Ngồi hoặc nằm có điểm đỡ, giữ cột sống dài và tay ở hình chữ V.",
        "Bắt đầu chuyển động bằng cách kéo hai bả vai lại gần nhau và hạ xuống.",
        "Đưa tay xuống hai bên thân, giữ cổ thả lỏng và xương sườn hạ.",
        "Giữ kiểm soát suốt động tác, tập trung cơ lưng giữa thay vì dùng tay là chính."
      ],
      "source_locale": "en",
      "source_hash": "24a5f6c7ec7464f771a48ee468445db89eede705022872f396b14ef477541888",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T04:33:17.421Z",
      "created_at": "2026-10-23T01:02:28.640592+00:00",
      "updated_at": "2026-10-23T01:02:28.640592+00:00"
    }
  },
  {
    "exercise_id": "970cee98-fbc7-48f6-99bd-60110426ad45",
    "source_id": 241481264476397,
    "expected_updated_at": "2026-10-14T10:47:34.246306+00:00",
    "before_hash": "eadb3b7eeec1eb19983b0bda07df0092127c09809dc7605f410ead25b2b2f05a",
    "after_hash": "8701be1688574c89f978c261bfcc2b8cf95398f9e7d4e3ee831d48a81093a5d9",
    "steps": [
      "Start in a tabletop position on your hands and knees with your hands directly under your shoulders and your knees directly under your hips.",
      "Turn your hands so that your fingers are pointing towards the sides of your mat and the tops of your hands are on the floor.",
      "Keep your arms straight and your shoulders away from your ears.",
      "Hold the pose for several breaths or as long as is comfortable."
    ],
    "before_translation": {
      "exercise_id": "970cee98-fbc7-48f6-99bd-60110426ad45",
      "locale": "vi",
      "name": "Tư thế cái bàn biến thể 1",
      "description": "",
      "steps": [
        "Người mới bắt đầu.",
        "Bắt đầu ở tư thế cái bàn, chống hai tay và hai gối, hai tay ngay dưới vai và hai gối ngay dưới hông.",
        "Xoay tay để ngón tay hướng sang hai cạnh thảm và mu bàn tay đặt trên sàn.",
        "Giữ tay thẳng, vai xa tai.",
        "Giữ trong vài nhịp thở hoặc trong khoảng thời gian còn thoải mái."
      ],
      "source_locale": "en",
      "source_hash": "eadb3b7eeec1eb19983b0bda07df0092127c09809dc7605f410ead25b2b2f05a",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T00:56:38.229+00:00",
      "created_at": "2026-10-23T00:59:43.532243+00:00",
      "updated_at": "2026-10-23T00:59:43.532243+00:00"
    },
    "after_translation": {
      "exercise_id": "970cee98-fbc7-48f6-99bd-60110426ad45",
      "locale": "vi",
      "name": "Tư thế cái bàn biến thể 1",
      "description": "",
      "steps": [
        "Bắt đầu ở tư thế cái bàn, chống hai tay và hai gối, hai tay ngay dưới vai và hai gối ngay dưới hông.",
        "Xoay tay để ngón tay hướng sang hai cạnh thảm và mu bàn tay đặt trên sàn.",
        "Giữ tay thẳng, vai xa tai.",
        "Giữ trong vài nhịp thở hoặc trong khoảng thời gian còn thoải mái."
      ],
      "source_locale": "en",
      "source_hash": "8701be1688574c89f978c261bfcc2b8cf95398f9e7d4e3ee831d48a81093a5d9",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T04:33:17.421Z",
      "created_at": "2026-10-23T00:59:43.532243+00:00",
      "updated_at": "2026-10-23T00:59:43.532243+00:00"
    }
  },
  {
    "exercise_id": "d0d3e5a2-4b2f-4ba8-b6fa-0d875c8fec76",
    "source_id": 270414613566827,
    "expected_updated_at": "2026-10-14T10:47:40.040974+00:00",
    "before_hash": "270b7a653033e3fb715ecbb7371fbe006469a184b0db9c8acdc177d1259eeca0",
    "after_hash": "3c8c5fb0ccd1f12f69d41e140196fb2d7a57c954c7db6b61d4c1b80c32c66d29",
    "steps": [
      "Sit or lie supported, spine long, arms positioned in a t-pose.",
      "Initiate movement by drawing shoulder blades together and down.",
      "Move arms down to your sides, keeping neck relaxed and ribs down.",
      "Maintain control throughout, emphasizing mid-back engagement over arm dominance."
    ],
    "before_translation": {
      "exercise_id": "d0d3e5a2-4b2f-4ba8-b6fa-0d875c8fec76",
      "locale": "vi",
      "name": "Chuỗi bài lưng giữa 2 trong Pilates",
      "description": "",
      "steps": [
        "Cơ bản.",
        "Ngồi hoặc nằm có điểm đỡ, giữ cột sống dài và tay ở hình chữ T.",
        "Bắt đầu chuyển động bằng cách kéo hai bả vai lại gần nhau và hạ xuống.",
        "Đưa tay xuống hai bên thân, giữ cổ thả lỏng và xương sườn hạ.",
        "Giữ kiểm soát suốt động tác, tập trung cơ lưng giữa thay vì dùng tay là chính."
      ],
      "source_locale": "en",
      "source_hash": "270b7a653033e3fb715ecbb7371fbe006469a184b0db9c8acdc177d1259eeca0",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T01:00:00.629+00:00",
      "created_at": "2026-10-23T01:02:28.43441+00:00",
      "updated_at": "2026-10-23T01:02:28.43441+00:00"
    },
    "after_translation": {
      "exercise_id": "d0d3e5a2-4b2f-4ba8-b6fa-0d875c8fec76",
      "locale": "vi",
      "name": "Chuỗi bài lưng giữa 2 trong Pilates",
      "description": "",
      "steps": [
        "Ngồi hoặc nằm có điểm đỡ, giữ cột sống dài và tay ở hình chữ T.",
        "Bắt đầu chuyển động bằng cách kéo hai bả vai lại gần nhau và hạ xuống.",
        "Đưa tay xuống hai bên thân, giữ cổ thả lỏng và xương sườn hạ.",
        "Giữ kiểm soát suốt động tác, tập trung cơ lưng giữa thay vì dùng tay là chính."
      ],
      "source_locale": "en",
      "source_hash": "3c8c5fb0ccd1f12f69d41e140196fb2d7a57c954c7db6b61d4c1b80c32c66d29",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T04:33:17.421Z",
      "created_at": "2026-10-23T01:02:28.43441+00:00",
      "updated_at": "2026-10-23T01:02:28.43441+00:00"
    }
  },
  {
    "exercise_id": "e0811330-ece7-48f5-8ecf-3e8e57fd4f35",
    "source_id": 74501225854111,
    "expected_updated_at": "2026-10-14T10:47:00.040512+00:00",
    "before_hash": "ee79586da0de6c1e2d839092f31351838b2decd04f611ac5c2bdc814dda82ee6",
    "after_hash": "49ae699d64c941f3c67226a2c1f3cdcdce2d3a652d8987ee401db960fd2c8be8",
    "steps": [
      "Lie supported, spine long, arms straight up toward ceiling.",
      "Initiate movement by drawing shoulder blades together and down.",
      "Move arms down towards your side, keeping neck relaxed and ribs down.",
      "Maintain control throughout, emphasizing mid-back engagement over arm dominance."
    ],
    "before_translation": {
      "exercise_id": "e0811330-ece7-48f5-8ecf-3e8e57fd4f35",
      "locale": "vi",
      "name": "Chuỗi bài lưng giữa 1 trong Pilates",
      "description": "",
      "steps": [
        "Cơ bản.",
        "Nằm có điểm đỡ, giữ cột sống dài và hai tay thẳng lên trần.",
        "Bắt đầu chuyển động bằng cách kéo hai bả vai lại gần nhau và hạ xuống.",
        "Đưa tay xuống bên thân, giữ cổ thả lỏng và xương sườn hạ.",
        "Giữ kiểm soát suốt động tác, tập trung cơ lưng giữa thay vì dùng tay là chính."
      ],
      "source_locale": "en",
      "source_hash": "ee79586da0de6c1e2d839092f31351838b2decd04f611ac5c2bdc814dda82ee6",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T01:00:00.629+00:00",
      "created_at": "2026-10-23T01:02:28.220152+00:00",
      "updated_at": "2026-10-23T01:02:28.220152+00:00"
    },
    "after_translation": {
      "exercise_id": "e0811330-ece7-48f5-8ecf-3e8e57fd4f35",
      "locale": "vi",
      "name": "Chuỗi bài lưng giữa 1 trong Pilates",
      "description": "",
      "steps": [
        "Nằm có điểm đỡ, giữ cột sống dài và hai tay thẳng lên trần.",
        "Bắt đầu chuyển động bằng cách kéo hai bả vai lại gần nhau và hạ xuống.",
        "Đưa tay xuống bên thân, giữ cổ thả lỏng và xương sườn hạ.",
        "Giữ kiểm soát suốt động tác, tập trung cơ lưng giữa thay vì dùng tay là chính."
      ],
      "source_locale": "en",
      "source_hash": "49ae699d64c941f3c67226a2c1f3cdcdce2d3a652d8987ee401db960fd2c8be8",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T04:33:17.421Z",
      "created_at": "2026-10-23T01:02:28.220152+00:00",
      "updated_at": "2026-10-23T01:02:28.220152+00:00"
    }
  },
  {
    "exercise_id": "e8479c79-e4b2-449f-8679-0978c313c3b2",
    "source_id": 244545930930386,
    "expected_updated_at": "2026-10-14T10:47:35.003673+00:00",
    "before_hash": "a937e5ec569de2c9e40a9aeeafcc394355ad03bc5d5f0816d93f2ac97da6c2f6",
    "after_hash": "df910fae90047042e95b3fec1a571b5ea481ab53aa9d93750e2e00550cffafc6",
    "steps": [
      "Start in a tabletop position on your hands and knees with your hands directly under your shoulders and your knees directly under your hips.",
      "Turn your hands so that your fingers are pointing towards your knees and the tops of your hands are on the floor.",
      "Keep your arms straight and your shoulders away from your ears.",
      "Hold the pose for several breaths or as long as is comfortable."
    ],
    "before_translation": {
      "exercise_id": "e8479c79-e4b2-449f-8679-0978c313c3b2",
      "locale": "vi",
      "name": "Tư thế cái bàn biến thể 2",
      "description": "",
      "steps": [
        "Người mới bắt đầu.",
        "Bắt đầu ở tư thế cái bàn, chống hai tay và hai gối, hai tay ngay dưới vai và hai gối ngay dưới hông.",
        "Xoay tay để ngón tay hướng về đầu gối và mu bàn tay đặt trên sàn.",
        "Giữ tay thẳng, vai xa tai.",
        "Giữ trong vài nhịp thở hoặc trong khoảng thời gian còn thoải mái."
      ],
      "source_locale": "en",
      "source_hash": "a937e5ec569de2c9e40a9aeeafcc394355ad03bc5d5f0816d93f2ac97da6c2f6",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T00:56:38.229+00:00",
      "created_at": "2026-10-23T00:59:43.733211+00:00",
      "updated_at": "2026-10-23T00:59:43.733211+00:00"
    },
    "after_translation": {
      "exercise_id": "e8479c79-e4b2-449f-8679-0978c313c3b2",
      "locale": "vi",
      "name": "Tư thế cái bàn biến thể 2",
      "description": "",
      "steps": [
        "Bắt đầu ở tư thế cái bàn, chống hai tay và hai gối, hai tay ngay dưới vai và hai gối ngay dưới hông.",
        "Xoay tay để ngón tay hướng về đầu gối và mu bàn tay đặt trên sàn.",
        "Giữ tay thẳng, vai xa tai.",
        "Giữ trong vài nhịp thở hoặc trong khoảng thời gian còn thoải mái."
      ],
      "source_locale": "en",
      "source_hash": "df910fae90047042e95b3fec1a571b5ea481ab53aa9d93750e2e00550cffafc6",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T04:33:17.421Z",
      "created_at": "2026-10-23T00:59:43.733211+00:00",
      "updated_at": "2026-10-23T00:59:43.733211+00:00"
    }
  },
  {
    "exercise_id": "f3edc777-f7bd-4829-8bc0-9d54c983a870",
    "source_id": 166504035439885,
    "expected_updated_at": "2026-10-14T10:47:19.180317+00:00",
    "before_hash": "95a48163822276deb5ff4909ddfd97c9e9a548ccd39e808011430cc80daedf6b",
    "after_hash": "34ff67453f3c615807be07947c8f020a6c6f9a7f94c0601e3485ef9df00e9a05",
    "steps": [
      "Lie on your back with bent knees and heels on a slider.",
      "Perform a posterior pelvic tilt (flatten your lower back on the ground).",
      "Press the heels into the ground to raise your hips off it.",
      "Extend and bend the working leg."
    ],
    "before_translation": {
      "exercise_id": "f3edc777-f7bd-4829-8bc0-9d54c983a870",
      "locale": "vi",
      "name": "Gập gối một chân tập đùi sau với đĩa trượt, biến thể 2",
      "description": "",
      "steps": [
        "Mới bắt đầu.",
        "Nằm ngửa, đầu gối co, gót chân trên đĩa trượt.",
        "Nghiêng chậu về sau để ép phẳng lưng dưới xuống đất.",
        "Ấn gót chân xuống đất để nâng hông khỏi đất.",
        "Duỗi và gập chân đang tập."
      ],
      "source_locale": "en",
      "source_hash": "95a48163822276deb5ff4909ddfd97c9e9a548ccd39e808011430cc80daedf6b",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T00:13:54.754+00:00",
      "created_at": "2026-10-23T00:14:38.864844+00:00",
      "updated_at": "2026-10-23T00:14:38.864844+00:00"
    },
    "after_translation": {
      "exercise_id": "f3edc777-f7bd-4829-8bc0-9d54c983a870",
      "locale": "vi",
      "name": "Gập gối một chân tập đùi sau với đĩa trượt, biến thể 2",
      "description": "",
      "steps": [
        "Nằm ngửa, đầu gối co, gót chân trên đĩa trượt.",
        "Nghiêng chậu về sau để ép phẳng lưng dưới xuống đất.",
        "Ấn gót chân xuống đất để nâng hông khỏi đất.",
        "Duỗi và gập chân đang tập."
      ],
      "source_locale": "en",
      "source_hash": "34ff67453f3c615807be07947c8f020a6c6f9a7f94c0601e3485ef9df00e9a05",
      "translation_status": "reviewed",
      "reviewed_at": "2026-10-23T04:33:17.421Z",
      "created_at": "2026-10-23T00:14:38.864844+00:00",
      "updated_at": "2026-10-23T00:14:38.864844+00:00"
    }
  }
]
$metadata_payload$::jsonb) as patch(exercise_id uuid, source_id bigint, expected_updated_at timestamptz,
  before_hash text, after_hash text, steps jsonb, before_translation jsonb, after_translation jsonb);
create temp table _metadata_sources_before on commit drop as
select exercise.* from public.exercises exercise join _metadata_patch patch on patch.exercise_id = exercise.id;
do $preflight$
begin
  if (select count(*) from _metadata_patch) <> 8
    or (select count(distinct exercise_id) from _metadata_patch) <> 8
    or (select count(*) from _metadata_sources_before) <> 8
    or (select count(*) from public.exercise_translations current join _metadata_patch patch on patch.exercise_id = current.exercise_id) <> 8 then
    raise exception 'Unexpected metadata cleanup scope';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.exercises'::regclass
    and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Expected enabled exercise timestamp trigger';
  end if;
  if exists (
    select 1 from public.exercises exercise join _metadata_patch patch on patch.exercise_id = exercise.id
    join public.exercise_translations current on current.exercise_id = exercise.id
    where exercise.source <> 'musclewiki' or exercise.source_id is distinct from patch.source_id
      or exercise.updated_at is distinct from patch.expected_updated_at
      or not (
        (public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) = patch.before_hash
          and to_jsonb(current) = to_jsonb(jsonb_populate_record(null::public.exercise_translations, patch.before_translation)))
        or (public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) = patch.after_hash
          and (to_jsonb(current) - 'updated_at') = (to_jsonb(jsonb_populate_record(null::public.exercise_translations, patch.after_translation)) - 'updated_at'))
      )
  ) then raise exception 'Source or approved translation revision changed; refresh instead of overwriting'; end if;
end;
$preflight$;
alter table public.exercises disable trigger exercises_updated_at;
update public.exercises exercise set steps = patch.steps from _metadata_patch patch
where exercise.id = patch.exercise_id
  and public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) = patch.before_hash;
alter table public.exercises enable trigger exercises_updated_at;
-- The source trigger first marks these translations stale. Restore reviewed status only
-- with the newly reviewed hash and the exact retained instruction list.
update public.exercise_translations current
set steps = planned.steps, source_hash = planned.source_hash, translation_status = planned.translation_status,
  reviewed_at = planned.reviewed_at
from _metadata_patch patch,
lateral jsonb_populate_record(null::public.exercise_translations, patch.after_translation) planned
where current.exercise_id = patch.exercise_id and current.locale = planned.locale
  and (to_jsonb(current) - 'updated_at') is distinct from (to_jsonb(planned) - 'updated_at');
do $postflight$
begin
  if exists (select 1 from public.exercises exercise
    join _metadata_patch patch on patch.exercise_id = exercise.id
    join _metadata_sources_before original on original.id = exercise.id
    where public.exercise_content_hash(exercise.name, exercise.description, exercise.steps) <> patch.after_hash
      or (to_jsonb(exercise) - 'steps') is distinct from (to_jsonb(original) - 'steps')) then
    raise exception 'Unexpected source field or ranking timestamp change';
  end if;
  if (select count(*) from public.exercise_translations current
    join _metadata_patch patch on patch.exercise_id = current.exercise_id
    where (to_jsonb(current) - 'updated_at') = (to_jsonb(jsonb_populate_record(null::public.exercise_translations, patch.after_translation)) - 'updated_at')) <> 8 then
    raise exception 'Incomplete translation revision';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.exercises'::regclass
    and tgname = 'exercises_updated_at' and tgenabled = 'O') then
    raise exception 'Timestamp trigger not restored';
  end if;
end;
$postflight$;
commit;
select count(*) filter (where translation_status = 'reviewed') as reviewed_total,
  count(*) filter (where translation_status = 'reviewed' and locale = 'vi') as reviewed_vi,
  count(*) filter (where translation_status = 'reviewed' and locale = 'en') as reviewed_en
from public.exercise_translations;
