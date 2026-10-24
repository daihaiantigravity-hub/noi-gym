# Đợt 8.12 — Rà soát Pilates

Ngày đối soát: 23/10/2026. Dự án Supabase: `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`).

Đã rà soát sáu bài Pilates còn thiếu nội dung Việt bằng các trang chi tiết local, xem đủ video nam/nữ ở góc trước/bên và chụp ba khung hình cách nhau theo thời gian cho mỗi video. Bốn video cho mỗi bài được kiểm tra; bốn trường hợp đủ rõ để sửa và dịch, hai bài tiếp tục chờ bằng chứng bổ sung.

## Checklist đã kiểm chứng

- [x] Tạo snapshot trước sửa gồm 1.946 bài và 1.910 bản reviewed; hash nguồn `67e13961fcbce18b06b4a95c7f0b3c374e4eec981cf95783ded85dd1ca0d60fc`.
- [x] Xem 24 video: sáu bài × hai giới × hai góc; chụp ba ảnh toàn trang theo thời gian cho mỗi tuyến giới tính (36 ảnh chụp toàn trang, gồm 72 khung hình quan sát của clip). Giữ ảnh và checksum trong `artifacts/localization/stage-19-video-evidence/`.
- [x] Sửa hướng dẫn dựa trên chuyển động nhìn thấy; giữ số bước, tên, mô tả, category, nhóm cơ, media và timestamp. Các sửa nguồn chỉ thay `steps`.
- [x] Dịch/duyệt bốn bài với 13 bước; đối chiếu từng bước Việt với nguồn tiếng Anh đã sửa.
- [x] Chạy transaction cho bốn nguồn và bốn bản dịch trên `noi-gym-v2`. Supabase cảnh báo về RLS vì transaction tạo bảng tạm; chúng được tạo `ON COMMIT DROP` và không tồn tại sau khi commit. RLS của bảng ứng dụng không đổi.
- [x] Đối soát trực tiếp toàn bộ nguồn: hash cuối `c4c119a21a9d711d2f76febd74fee72132a4ac7f4fadab7d71774f4b7d17ec97`, khớp hash dự kiến; không đổi media/category/timestamp hoặc trường ngoài `steps` ở bốn bài.
- [x] Xác nhận database có 1.914 bản reviewed (1.913 Việt, 1 Anh), 5.895 bước; tính cả một bài gốc Việt, 1.914/1.946 bài có nội dung Việt, còn 32.
- [x] Anonymous đọc đủ 1.914 bản reviewed còn hiệu lực; không có nháp/stale và bộ quét nguồn có 0 cảnh báo.
- [x] Giữ nguyên 291 lượt lưu cá nhân và 289 bài admin ưu tiên.
- [x] Import dry-run batch 045: 4 unchanged, 0 writes, không lỗi.
- [x] Trên localhost:3001 kiểm tra cả bốn trang chi tiết ở EN/VI, với query giới nam/nữ; tên và đủ số bước đúng, video vẫn hiển thị hai góc.
- [ ] Rà soát 32 bài còn thiếu nội dung Việt và nghiệm thu đầy đủ các màn hình, auth, favorites/admin và hiệu năng.
- [ ] Hoàn tất nghiệm thu trước khi bật localization trên production.

## Bài được sửa

- `Long Arm Adduction Side Kneeling` (`0d186026-7797-4ab8-93b1-25b162d38f23`): video cho thấy người tập quỳ thẳng trên máy, cầm dây và kéo cánh tay xuống; không có tay chống dưới vai. Hướng dẫn được sửa để khớp tư thế và bỏ chỉ dẫn quay về “overhead” chưa được video xác nhận. Tên Việt: “Khép tay với dây khi quỳ nghiêng”.
- `Single Leg Bicycle` (`1018382d-bfe2-4f78-8b98-dc0e97c09d51`): hai chân luân phiên giữa duỗi và gập lên tabletop. Hướng dẫn làm rõ chân đang duỗi đạp trong khi chân kia nâng, rồi đổi vị trí. Tên Việt: “Đạp xe một chân trên máy Pilates”.
- `Front Rowing Preps Straight Forward Seated` (`b35700e9-f0e0-44cd-93d8-70ed4892ad2a`): video cho thấy tay bắt đầu duỗi dọc hai bên thân người, rồi đưa thẳng ra trước; không bắt đầu ở ngang ngực/gần xương sườn như nguồn cũ. Tên Việt: “Chuẩn bị chèo thuyền: ngồi, đưa tay thẳng về trước”.
- `Side Splits Skating` (`fdce9075-8080-41e9-9943-8cb4b4a8be70`): thân người giữ gập về trước và lưng trung lập trong cả pha đẩy lẫn trở về; sửa chỉ dẫn “maintaining upright posture”. Tên Việt: “Trượt tách chân ngang trên máy Pilates”.

## Bài tiếp tục được giữ lại

- `Hip Rolls` (`06144a01-a685-456d-a1be-ebbb1f1c9192`): các khung hình cho thấy bridge, đẩy và hạ, nhưng chưa xác định đủ thứ tự đưa carriage về so với cuộn cột sống xuống. Chưa sửa/dịch.
- `Hip Lift` (`443b5ff2-5934-44f8-a10e-685bf0a7d708`): chưa xác định rõ bàn chân tì vào đâu và hông có giữ ở vị trí nâng trong lúc đẩy hay không. Chưa sửa/dịch.

## Kết quả đối soát

| Chỉ số | Kết quả |
| --- | --- |
| Bài có nội dung Việt, tính cả nguồn Việt | 1.914/1.946 |
| Bản reviewed | 1.914 = 1.913 Việt + 1 Anh |
| Bài còn thiếu nội dung Việt | 32 |
| Bước trong bản reviewed | 5.895 |
| Bước nguồn | 6.019 |
| Bài có media nam / nữ đã có nội dung Việt | 1.682 / 1.901 |
| Pilates | 47/49 |
| Bài admin ưu tiên có nội dung Việt | 289/289 |
| Lượt lưu cá nhân | 291, giữ nguyên |
| Hash toàn bộ nguồn sau sửa | `c4c119a21a9d711d2f76febd74fee72132a4ac7f4fadab7d71774f4b7d17ec97` |
| Cảnh báo tự động | 0; còn 32 bài chờ rà soát ngữ nghĩa |

32 bài còn thiếu gồm Recovery 9, Pilates 2, Stretches 5, Yoga 15 và một bài chưa phân loại. Hàng đợi mới tại `artifacts/localization/stage-19-remaining-source-review-queue.json`.

## Tệp bàn giao

- Quyết định rà soát: [source-review-decisions-011.json](../scripts/localization/data/source-review-decisions-011.json).
- Bằng chứng và sửa nguồn: [source-restorations-012.json](../scripts/localization/data/source-restorations-012.json).
- Văn bản dịch: [priority-text-045.json](../scripts/localization/data/priority-text-045.json), [manifest đã chuẩn bị](../scripts/localization/data/prepared-translations-045.json), [manifest đã đối soát](../scripts/localization/data/reviewed-translations-045.json).
- SQL transaction: [20261023_correct_pilates_instructions_stage19.sql](../supabase/repairs/20261023_correct_pilates_instructions_stage19.sql).
- Kết quả live: `artifacts/localization/stage-19-before.json`, `stage-19-after.json`, `stage-19-remaining-source-review-queue.json`.
- Ảnh giao diện: `artifacts/localization/stage-19-detail-vi.png`.

Không thay đổi schema, migration, media hoặc code ứng dụng. Không tải tệp lên R2, không cần build lại, và không triển khai production trong đợt này.
