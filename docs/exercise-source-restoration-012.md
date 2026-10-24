# Đợt 8.13 — Rà soát Stretches

Ngày đối soát: 23/10/2026. Dự án Supabase: `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`).

Đã rà soát năm bài Stretches còn thiếu nội dung Việt qua 20 clip (năm bài × hai giới × hai góc). Mỗi clip có hai ảnh chụp cách nhau theo thời gian; tổng cộng lưu 40 ảnh cùng checksum. Ba vấn đề được video xác nhận đủ để sửa và dịch; hai bài tiếp tục chờ vì khung hình chưa làm rõ chính xác điểm tiếp xúc.

## Checklist đã kiểm chứng

- [x] Chụp snapshot trước sửa gồm 1.946 bài và 1.914 bản reviewed; hash nguồn `c4c119a21a9d711d2f76febd74fee72132a4ac7f4fadab7d71774f4b7d17ec97`.
- [x] Đối chiếu video nam/nữ ở góc trước/bên cho năm bài; lưu 40 khung hình và checksum trong `artifacts/localization/stage-20-video-evidence/`.
- [x] Sửa `steps` nguồn của ba bài, giữ nguyên số bước, tên, mô tả, category, nhóm cơ, media và timestamp.
- [x] Duyệt ba bản Việt/10 bước theo nguồn tiếng Anh đã sửa.
- [x] Chạy transaction trên Supabase. Hash nguồn sau sửa `90565ce240ae77de42fcf90368f487d136937b2a78d13d28cdec7c5cc2719307`, trùng hash dự kiến; ngoài `steps` không đổi trường nguồn nào.
- [x] Database có 1.917 bản reviewed (1.916 Việt, 1 Anh), 5.905 bước; tính cả bài gốc Việt, 1.917/1.946 bài có nội dung Việt, còn 29.
- [x] Anonymous đọc đủ 1.917 bản reviewed; không có nháp/stale và bộ quét nguồn báo 0 cảnh báo.
- [x] Giữ nguyên 291 lượt lưu cá nhân và 289 bài admin ưu tiên.
- [x] Import dry-run batch 046: 3 unchanged, 0 writes, không lỗi.
- [x] Trên localhost:3001, kiểm tra cả ba bài ở tiếng Anh/Việt và query giới nam/nữ; đúng 3 hoặc 4 bước, cả hai góc video còn hiển thị.
- [ ] Rà soát 29 bài thiếu nội dung Việt và nghiệm thu đầy đủ các màn hình, auth, favorites/admin, hiệu năng.
- [ ] Hoàn tất nghiệm thu trước khi bật localization trên production.

## Bài được sửa

- `Quads Stretch Variation Two` (`4998e346-5462-4ed3-a55e-e17c7566ca23`): video cho thấy gối trước gập khoảng 90 độ, gối sau đặt xuống sàn và mu bàn chân sau tựa tường. Câu nguồn khiến góc 90 độ có vẻ mô tả bàn chân; đã làm rõ đó là góc gối. Tên Việt: `Giãn cơ đùi trước biến thể hai`.
- `Abdominals Stretch Variation Three` (`79009697-d870-4b1e-956b-c5a09b9a99c3`): video cho thấy với tay qua đầu rồi nghiêng người sang bên đối diện. Hai chỉ dẫn trái/phải trong nguồn bị đảo thứ tự; đã đổi thứ tự, giữ nguyên số bước và bên cơ thể. Tên Việt: `Giãn cơ bụng biến thể ba`.
- `Glutes Stretch Variation One` (`e38c6169-c56c-4074-9a73-63037169e582`): video cho thấy bắt đầu chống hai tay và hai gối, một gối đưa về trước, chân kia duỗi ra sau rồi vươn tay chéo trên thảm. Nguồn mô tả nằm sấp và chưa rõ vị trí chân; đã thay bằng các tư thế nhìn thấy, không khẳng định bên tay nếu video chưa xác nhận. Tên Việt: `Giãn cơ mông biến thể một`.

## Bài tiếp tục được giữ lại

- `Forearms Stretch Variation Two` (`39a07611-a045-4d15-983f-e60daa133db0`): chưa xác định đủ hướng lòng bàn tay và đầu ngón tay đang chạm tường ở pha căng.
- `Lower back Stretch Variation Two` (`ff0457f4-54bb-48e6-84e3-e8a66867688b`): video cho thấy xoay hông khi nằm ngửa, nhưng chưa rõ chân nào móc dưới gối chân kia và chân nào phải giữ sát sàn.

## Kết quả đối soát

| Chỉ số | Kết quả |
| --- | --- |
| Bài có nội dung Việt, tính cả nguồn Việt | 1.917/1.946 |
| Bản reviewed | 1.917 = 1.916 Việt + 1 Anh |
| Bài còn thiếu nội dung Việt | 29 |
| Bước trong bản reviewed | 5.905 |
| Bước nguồn | 6.019 |
| Bài có media nam / nữ đã có nội dung Việt | 1.685 / 1.904 |
| Stretches | 50/52 |
| Bài admin ưu tiên có nội dung Việt | 289/289 |
| Lượt lưu cá nhân | 291, giữ nguyên |
| Hash toàn bộ nguồn sau sửa | `90565ce240ae77de42fcf90368f487d136937b2a78d13d28cdec7c5cc2719307` |
| Cảnh báo tự động | 0; còn 29 bài chờ rà soát ngữ nghĩa |

29 bài còn thiếu gồm Recovery 9, Pilates 2, Stretches 2, Yoga 15 và một bài chưa phân loại. Hàng đợi mới ở `artifacts/localization/stage-20-remaining-source-review-queue.json`.

## Tệp bàn giao

- Quyết định rà soát: [source-review-decisions-012.json](../scripts/localization/data/source-review-decisions-012.json).
- Bằng chứng và sửa nguồn: [source-restorations-013.json](../scripts/localization/data/source-restorations-013.json).
- Văn bản dịch: [priority-text-046.json](../scripts/localization/data/priority-text-046.json), [manifest đã chuẩn bị](../scripts/localization/data/prepared-translations-046.json), [manifest đã đối soát](../scripts/localization/data/reviewed-translations-046.json).
- SQL transaction: [20261023_correct_stretches_instructions_stage20.sql](../supabase/repairs/20261023_correct_stretches_instructions_stage20.sql).
- Kết quả live: `artifacts/localization/stage-20-before.json`, `stage-20-after.json`, `stage-20-remaining-source-review-queue.json`.
- Ảnh giao diện: `artifacts/localization/stage-20-detail-vi.png`.

Supabase cảnh báo RLS cho bảng tạm của transaction; các bảng đều được tạo `ON COMMIT DROP`, nên không tồn tại sau commit. RLS của các bảng ứng dụng không đổi. Không thay schema, migration, media hay code ứng dụng; không tải tệp lên R2; không cần build/deploy.
