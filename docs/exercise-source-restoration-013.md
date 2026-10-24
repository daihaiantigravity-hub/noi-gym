# Đợt 8.14 — Rà soát Yoga

Ngày đối soát: 23/10/2026. Dự án Supabase: `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`).

Đã xem năm bài Yoga đang thiếu nội dung Việt qua các trang video gốc MuscleWiki, cả hai giới và hai góc quay. Mỗi biến thể giới có hai ảnh chụp cách nhau theo thời gian; tổng cộng 20 ảnh. Hai lỗi hướng dẫn được video xác nhận đủ để sửa và dịch thành hai bản Việt/8 bước. Ba bài còn lại tiếp tục chờ vì video không xác nhận cùng một chỉ dẫn rõ ràng cho cả hai giới hoặc không cho thấy chính xác vị trí tay/chân.

## Checklist đã kiểm chứng

- [x] Chụp snapshot trước sửa gồm 1.946 bài và 1.917 bản reviewed; hash nguồn `90565ce240ae77de42fcf90368f487d136937b2a78d13d28cdec7c5cc2719307`.
- [x] Đối chiếu năm trang video nguồn ở cả nam/nữ, hai góc; lưu 20 khung hình và checksum trong `artifacts/localization/stage-21-video-evidence/`.
- [x] Sửa `steps` nguồn của hai bài, giữ nguyên số bước và mọi trường nguồn khác.
- [x] Duyệt hai bản Việt/8 bước theo hướng dẫn tiếng Anh đã sửa.
- [x] Đổi tên Việt của Double Pigeon thành `Tư thế chim bồ câu đôi`; các nguồn yoga gọi tư thế này là Fire Log/Agnistambhasana, với hai cẳng chân xếp chồng, không phải hoa sen ([Yoga Basics](https://www.yogabasics.com/asana/firelog/), [Yoga Philippines](https://yogaphilippines.com/poses/fire-log-pose/)).
- [x] Chạy transaction nguồn/dịch và transaction hiệu chỉnh tên trên Supabase. Hash toàn bộ nguồn sau sửa `e444cd605435192a7810f9792e223ffb426e3d40d15e1e05768800a8cc57be5c`; ngoài `steps` của hai bài, không đổi trường nguồn nào.
- [x] Database có 1.919 bản reviewed (1.918 Việt, 1 Anh), 5.913 bước; tính cả bài gốc Việt, 1.919/1.946 bài có nội dung Việt, còn 27.
- [x] Anonymous đọc đủ 1.919 bản reviewed; không có nháp/stale và bộ quét nguồn báo 0 cảnh báo.
- [x] Giữ nguyên 291 lượt lưu cá nhân và 289 bài admin ưu tiên.
- [x] Import dry-run batch 047: 2 unchanged, 0 writes, không lỗi.
- [x] Trên localhost:3001, kiểm tra Double Pigeon và Half Lotus với nội dung EN/VI ở các route nam/nữ; sau hiệu chỉnh tên, chi tiết nam Double Pigeon hiển thị `Tư thế chim bồ câu đôi` cùng đủ bốn bước Việt.
- [x] 76/76 test localization đạt.
- [ ] Rà soát 27 bài thiếu nội dung Việt và nghiệm thu đầy đủ các màn hình, auth, favorites/admin, hiệu năng.
- [ ] Hoàn tất nghiệm thu trước khi bật localization trên production.

## Bài được sửa

- `Double Pigeon Pose` (`3b04d689-6830-4946-9ea2-f73e926102cb`): video cho thấy hai gối gập và hai cẳng chân xếp chồng; nguồn chỉ hướng dẫn gập một gối, bỏ qua cách đặt chân còn lại. Đã sửa bước này để mô tả cả hai chân, không gán bên trái/phải khi clip không cần đến. Tên Việt: `Tư thế chim bồ câu đôi`.
- `Half Lotus` (`bd843d68-7f5d-4dcc-a870-e839427a10a3`): cả hai giới cho thấy một bàn chân đặt lên đùi đối diện trong khi chân kia duỗi trên thảm. Bước nguồn đặt cả hai bàn chân lên đùi sẽ thành hoa sen đầy đủ; đã đổi thành giữ chân còn lại duỗi. Tên Việt: `Tư thế hoa sen bán phần`.

## Bài tiếp tục được giữ lại

- `Pigeon Pose` (`2091cc69-6557-48c9-a6d2-a2f2e70a563d`): video nam cho thấy một chân duỗi ra sau, nhưng biến thể nữ và pha chuyển tiếp không xác nhận cùng một cách đặt chân/tay. Chưa sửa nguồn hoặc duyệt bản dịch.
- `Reverse Prayer` (`c9efa90c-6348-4cdc-b471-ac78acaa2ce5`): video xác nhận tay ở sau thân người nhưng ảnh chưa phân biệt rõ hai lòng bàn tay ép vào nhau hay các ngón tay đan vào nhau.
- `Wide Legged Standing Forward Bend Holding Heels` (`f98f8ba1-005a-4c83-9926-1d956a471333`): clip nam có động tác gập rộng chân, nhưng clip nữ được xem chưa xác nhận cùng tư thế hoặc động tác nắm gót; tiêu đề và hướng dẫn vẫn chưa khớp đủ chắc chắn.

## Kết quả đối soát

| Chỉ số | Kết quả |
| --- | --- |
| Bài có nội dung Việt, tính cả nguồn Việt | 1.919/1.946 |
| Bản reviewed | 1.919 = 1.918 Việt + 1 Anh |
| Bài còn thiếu nội dung Việt | 27 |
| Bước trong bản reviewed | 5.913 |
| Bài có media nam / nữ đã có nội dung Việt | 1.687 / 1.906 |
| Yoga | 60/73 |
| Bài admin ưu tiên có nội dung Việt | 289/289 |
| Lượt lưu cá nhân | 291, giữ nguyên |
| Hash toàn bộ nguồn sau sửa | `e444cd605435192a7810f9792e223ffb426e3d40d15e1e05768800a8cc57be5c` |
| Cảnh báo tự động | 0; còn 27 bài chờ rà soát ngữ nghĩa |

27 bài còn thiếu gồm Recovery 9, Pilates 2, Stretches 2, Yoga 13 và một bài chưa phân loại. Hàng đợi mới ở `artifacts/localization/stage-21-remaining-source-review-queue.json`.

## Tệp bàn giao

- Quyết định rà soát: [source-review-decisions-013.json](../scripts/localization/data/source-review-decisions-013.json).
- Bằng chứng và sửa nguồn: [source-restorations-014.json](../scripts/localization/data/source-restorations-014.json).
- Văn bản dịch: [priority-text-047.json](../scripts/localization/data/priority-text-047.json), [manifest đã chuẩn bị](../scripts/localization/data/prepared-translations-047.json), [manifest đã đối soát](../scripts/localization/data/reviewed-translations-047.json).
- SQL sửa hướng dẫn: [20261023_correct_yoga_instructions_stage21.sql](../supabase/repairs/20261023_correct_yoga_instructions_stage21.sql).
- SQL hiệu chỉnh tên Việt sau rà soát thuật ngữ: [20261023_refine_yoga_translation_title_stage21.sql](../supabase/repairs/20261023_refine_yoga_translation_title_stage21.sql).
- Kết quả live: `artifacts/localization/stage-21-before.json`, `stage-21-after.json`, `stage-21-remaining-source-review-queue.json`.
- Ảnh contact sheet nguồn: `artifacts/localization/stage-21-video-evidence/`; ảnh kiểm tra giao diện: `artifacts/localization/stage-21-detail-vi.png`.

Không thay schema, media, category, timestamps nguồn hoặc code ứng dụng; không tải tệp lên R2; không cần build/deploy.
