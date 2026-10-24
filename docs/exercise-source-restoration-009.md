# Đợt 8.10 — Hoàn tất Bodyweight và rà soát bài chưa phân loại

Ngày đối soát: 23/10/2026. Dự án Supabase: `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`).

Đã đối chiếu 28 nguồn còn lại của Bodyweight và nhóm chưa có category bằng 110 video, 660 khung hình theo thời gian, 72 mẫu bổ sung và tám khung hình gốc độ phân giải đầy đủ. Có 27 bài đủ bằng chứng để sửa hướng dẫn và duyệt tiếng Việt; một bài hướng dẫn kéo giãn thần kinh được giữ nguyên để chờ xác minh. Bodyweight đạt 197/197; nhóm chưa phân loại đạt 131/132.

## Checklist đã kiểm chứng

- [x] Chụp snapshot trước sửa gồm 1.946 bài, 1.881 bản duyệt và hash nguồn `6adc9d3e7d83b5eb96b5ef48c2f9efb7d49c51d2546aae49371c2025b6ea0e22`.
- [x] Xem đủ 110 video nam/nữ và hai góc cho 28 bài; kiểm tra 660 khung hình chính, 72 mẫu bổ sung và tám khung hình gốc. Tổng 740 khung hình được xem: 714 cho 27 bài chấp nhận và 26 cho bài giữ lại.
- [x] Giữ checksum, đường dẫn và ID nguồn cho từng clip. Bài chỉ có nữ được đối chiếu ID/tên/hướng dẫn với dữ liệu import gốc, không gán thêm media nam.
- [x] Chỉnh 27 hướng dẫn theo điểm tựa, dụng cụ, hướng chuyển động và biến thể nam/nữ đã quan sát. Giữ tên, mô tả, số bước, category, nhóm cơ, media và timestamp; không thêm mức tạ, số lần, số hiệp hay góc đo.
- [x] Dịch và duyệt 27 bài/88 bước; kiểm tra tên, số, hướng trái/phải và tính nhất quán theo từng bước.
- [x] Chạy transaction cho đúng 27 nguồn và 27 bản dịch. Hash và `updated_at` phải khớp trước khi cập nhật; kiểm tra sau transaction xác nhận chỉ `steps` nguồn thay đổi. Trigger timestamp được khôi phục trong transaction; RLS và trigger kiểm tra bản dịch vẫn bật.
- [x] Đối soát live: hash nguồn sau sửa `715e6a6794ca89fb4e9a0a1de4dbad06c92b663eb603c31d8545e7f082093109`; không còn cảnh báo tự động. Giữ 1.881 bản dịch cũ, 291 lượt lưu cá nhân và 289 bài admin ưu tiên.
- [x] Kiểm tra quyền đọc công khai: anonymous nhận 1.908 bản reviewed còn hiệu lực; không có bản nháp/stale.
- [x] Kiểm tra SSR ở 53 trường hợp trang chi tiết theo giới và 42 trang danh sách bao phủ đủ 27 bài/53 trường hợp theo giới. Tên, hướng dẫn, thứ tự, ID và video giữ đúng ở EN/VI, gồm các trang advanced/recovery cho nhóm chưa phân loại.
- [x] Kiểm tra trang quản trị qua hàm phân trang thực tế: tiếng Việt 1.907 reviewed + 1 nội dung gốc + 38 thiếu, 77 trang, trang cuối 7 bài; tiếng Anh 1 reviewed + 1.945 nội dung gốc. Không có nháp/stale.
- [x] Kiểm tra mobile CSS 390 × 844: trang chi tiết có đúng bốn bước, hai video đang phát (`readyState=4`), không tràn ngang. Đổi sang Việt và tải lại vẫn giữ lựa chọn; trả giao diện về tiếng Anh và khôi phục viewport ban đầu.
- [x] Kiểm thử nội dung/transaction liên quan đạt 19/19; ESLint đạt. Import dry-run cho 27 bản đã duyệt trả 27 unchanged, 0 pending writes.
- [ ] Rà soát 38 bài còn thiếu bản Việt và nghiệm thu đầy đủ mọi màn hình, auth, thao tác favorites/admin và hiệu năng.
- [ ] Nghiệm thu rồi mới bật localization trên production theo kế hoạch chung.

## Bài được giữ lại

`Seated Ulnar Nerve Tensioner` (`474b9866-556c-46e1-bdaf-2f2a3fd81b62`) vẫn giữ nguyên hướng dẫn và trạng thái dịch. Video chưa giải quyết rõ cách xoay cẳng tay và vị trí tiếp xúc của bàn tay; không nên tự suy diễn thêm hướng dẫn cho động tác kéo giãn thần kinh. Bằng chứng bốn video và hai ảnh gốc được ghi trong `source-review-decisions-009.json`. Bài này nằm trong 38 bài chưa dịch còn lại.

## Kết quả đối soát

| Chỉ số | Kết quả |
| --- | --- |
| Bài có nội dung Việt, tính cả nguồn Việt | 1.908/1.946 |
| Bản dịch reviewed | 1.908 = 1.907 Việt + 1 Anh |
| Bài còn thiếu nội dung Việt | 38 |
| Bước trong bản dịch reviewed | 5.875 |
| Bước nguồn | 6.019 |
| Bài có media nam / nữ đã có nội dung Việt | 1.678 / 1.895 |
| Bodyweight | 197/197 |
| Chưa có category | 131/132 |
| Bài admin ưu tiên có nội dung Việt | 289/289 |
| Lượt lưu cá nhân | 291, giữ nguyên |
| Nguồn sửa tích lũy | 10 gói, 183 ID riêng biệt; một ID được sửa lại có bằng chứng ở hai gói |
| Cảnh báo tự động | 0; vẫn còn 38 bài chờ rà soát ngữ nghĩa |

38 bài còn thiếu gồm Recovery 11, Pilates 6, Stretches 5, Yoga 15 và một bài chưa phân loại đang được giữ lại. Không có nghĩa vụ phải tự gán category cho bài chưa phân loại.

## Tệp bàn giao

- Quyết định rà soát: [source-review-decisions-009.json](../scripts/localization/data/source-review-decisions-009.json).
- Bằng chứng và sửa nguồn: [source-restorations-010.json](../scripts/localization/data/source-restorations-010.json).
- Nội dung Việt đã soát: [priority-text-043.json](../scripts/localization/data/priority-text-043.json), [manifest đã chuẩn bị](../scripts/localization/data/prepared-translations-043.json), [manifest đã xác minh live](../scripts/localization/data/reviewed-translations-043.json).
- SQL: [20261023_correct_bodyweight_uncategorized_instructions.sql](../supabase/repairs/20261023_correct_bodyweight_uncategorized_instructions.sql).
- Kết quả live: `artifacts/localization/stage-17-restoration-after.json`, `stage-17-after.json`, `stage-17-admin-coverage-audit.json`, `stage-17-detail-pages-audit.json`, `stage-17-translated-library-cards-audit.json` và `stage-17-remaining-source-review-queue.json`.
- Ảnh kiểm chứng: `artifacts/localization/stage-17-supabase-result.png` và `stage-17-mobile-detail-vi.png`.

SQL Editor cảnh báo RLS vì transaction tạo bảng tạm. Đã chọn chạy không bật RLS cho bảng tạm `ON COMMIT DROP`; chúng không tồn tại sau transaction và không mở quyền truy cập cho client. RLS của bảng ứng dụng không bị tắt. Không tải thêm media lên R2, không build và không triển khai production.
