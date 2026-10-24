# Đợt 8.11 — Rà soát Recovery

Ngày đối soát: 23/10/2026. Dự án Supabase: `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`).

Đã kiểm tra 11 bài Recovery còn thiếu nội dung Việt qua 22 video nữ (mỗi bài có góc trước và góc bên), tổng 132 khung hình theo thời gian. Hai video xác nhận lỗi trong hướng dẫn nguồn; chín bài còn lại tiếp tục được giữ để chờ xác minh, không dịch theo suy đoán.

## Checklist đã kiểm chứng

- [x] Chụp snapshot trước sửa gồm 1.946 bài, 1.908 bản reviewed và hash nguồn `715e6a6794ca89fb4e9a0a1de4dbad06c92b663eb603c31d8545e7f082093109`.
- [x] Kiểm tra đủ 22 clip/132 khung hình cho 11 bài; tất cả clip thuộc biến thể nữ. Đối chiếu ID, hướng dẫn và URL video với dữ liệu import nữ gốc.
- [x] Ghi bằng chứng riêng cho từng bài, gồm checksum, quan sát và nội dung trước/sau. Hai bài được sửa; chín bài còn mâu thuẫn hoặc chưa đủ rõ được giữ nguyên.
- [x] Chỉ sửa trường `steps` của `Calf Stretch On Box Bilateral` và `Bodyweight Deadlift`; giữ nguyên tên, mô tả, số bước, category, nhóm cơ, media, thứ tự và timestamp nguồn.
- [x] Dịch và duyệt đúng 2 bài/7 bước; tên, số lượng bước và trình tự khớp với nguồn đã sửa.
- [x] Chạy transaction sửa hai nguồn và thêm hai bản dịch. Lần chạy SQL đầu gặp lỗi phân tích cú pháp và rollback toàn bộ; payload được đóng gói lại an toàn hơn, sau đó transaction hoàn tất. Không có thay đổi một phần từ lần chạy lỗi.
- [x] Đối soát trực tiếp: hash nguồn cuối `67e13961fcbce18b06b4a95c7f0b3c374e4eec981cf95783ded85dd1ca0d60fc`, đúng hash dự kiến; chỉ hai trường `steps` được thay đổi.
- [x] Anonymous đọc đủ 1.910 bản reviewed còn hiệu lực: 1.909 Việt và 1 Anh. Không có bản nháp/stale; bộ quét nguồn trả 0 cảnh báo.
- [x] Xác nhận 291 lượt lưu cá nhân và 289 bài admin ưu tiên không đổi. Nội dung Việt đạt 1.910/1.946 bài; Recovery đạt 107/116.
- [x] Import dry-run cho batch 044: 2 unchanged, 0 writes, không lỗi.
- [x] Trên `http://localhost:3001`, kiểm tra trang chi tiết của hai bài bằng tiếng Anh và tiếng Việt; tên và từng hướng dẫn hiển thị đúng sau khi đổi ngôn ngữ.
- [ ] Rà soát 36 bài còn thiếu nội dung Việt và nghiệm thu đầy đủ các màn hình, auth, favorites/admin và hiệu năng.
- [ ] Hoàn tất nghiệm thu trước khi bật localization trên production theo kế hoạch chung.

## Hai bài đã xử lý

- `Calf Stretch On Box Bilateral` (`4d64425d-a884-4aed-8aac-bc991e9450dc`): cả hai video cho thấy mũi cả hai bàn chân đặt gần mép bục và hai gót cùng hạ xuống. Hướng dẫn được sửa thành động tác hai chân; bản Việt: “Giãn bắp chân hai chân trên bục”.
- `Bodyweight Deadlift` (`c5d150e3-d0f3-45aa-bed5-aa23bb9b5eb7`): video trước/bên cho thấy động tác gập hông không dùng dụng cụ. Bước cuối được sửa thành duỗi hông và gối để đứng thẳng; bản Việt: “Deadlift không tạ”.

Các bản tiếng Việt có đủ 3 và 4 bước như nguồn tương ứng. Bản Anh vẫn là nội dung nguồn đã sửa; bản Việt được duyệt theo hash của chính nội dung đó.

## Các bài tiếp tục được giữ lại

Chín bài Recovery khác chưa được dịch trong đợt này. Bằng chứng video còn có điểm không khớp với hướng dẫn, chưa xác định được biến thể hoặc chưa đủ rõ để diễn đạt an toàn. Danh sách và lý do theo từng ID nằm trong `source-review-decisions-010.json`; không thay đổi nguồn hay trạng thái dịch của các bài này.

## Kết quả đối soát

| Chỉ số | Kết quả |
| --- | --- |
| Bài có nội dung Việt, tính cả nguồn Việt | 1.910/1.946 |
| Bản reviewed | 1.910 = 1.909 Việt + 1 Anh |
| Bài còn thiếu nội dung Việt | 36 |
| Bước trong bản reviewed | 5.882 |
| Bước nguồn | 6.019 |
| Bài có media nam / nữ đã có nội dung Việt | 1.678 / 1.897 |
| Recovery | 107/116 |
| Bài admin ưu tiên có nội dung Việt | 289/289 |
| Lượt lưu cá nhân | 291, giữ nguyên |
| Hash toàn bộ nguồn sau sửa | `67e13961fcbce18b06b4a95c7f0b3c374e4eec981cf95783ded85dd1ca0d60fc` |
| Cảnh báo tự động | 0; vẫn còn 36 bài chờ rà soát ngữ nghĩa |

36 bài còn thiếu gồm Recovery 9, Pilates 6, Stretches 5, Yoga 15 và một bài chưa phân loại. Hàng đợi đã cập nhật tại `artifacts/localization/stage-18-remaining-source-review-queue.json`.

## Tệp bàn giao

- Quyết định rà soát: [source-review-decisions-010.json](../scripts/localization/data/source-review-decisions-010.json).
- Bằng chứng và sửa nguồn: [source-restorations-011.json](../scripts/localization/data/source-restorations-011.json).
- Văn bản dịch: [priority-text-044.json](../scripts/localization/data/priority-text-044.json), [manifest đã chuẩn bị](../scripts/localization/data/prepared-translations-044.json), [manifest đã đối soát](../scripts/localization/data/reviewed-translations-044.json).
- SQL transaction: [20261023_correct_recovery_instructions_stage18.sql](../supabase/repairs/20261023_correct_recovery_instructions_stage18.sql).
- Kết quả live: `artifacts/localization/stage-18-before.json`, `stage-18-after.json`, `stage-18-remaining-source-review-queue.json`.
- Ảnh kết quả Supabase: `artifacts/localization/stage-18-supabase-result.png`.

Không thay đổi schema, migration, RLS, media hoặc code ứng dụng. Không tải tệp lên R2, không cần build lại, và không triển khai production trong đợt này.
