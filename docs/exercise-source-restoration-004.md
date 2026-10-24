# Xác minh và dịch nhóm bài chân — đợt 8.5

Đã áp dụng và đối soát thành công ngày 23/10/2026 trên Supabase `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`). Đây là một bước tiếp của [kế hoạch Anh / Việt](english-vietnamese-localization-plan.md), chưa hoàn thành toàn bộ kế hoạch.

Các số liệu dưới đây ghi nhận tại cuối đợt 8.5. Kết quả tiếp theo, gồm nhóm TRX và độ phủ mới nhất, nằm ở [báo cáo đợt 8.6](exercise-source-restoration-005.md).

## Phạm vi và bằng chứng

Đọc hướng dẫn cũ và 336 mẫu theo thứ tự thời gian từ 56 video hiện có của 16 bài, hai góc cho mỗi giới có sẵn. Mỗi clip được lấy sáu mẫu trải trên thời lượng ghi nhận. Có 12 bài đủ video nam/nữ và bốn bài chỉ có video nữ; không tạo hoặc gán thêm media nam.

Bốn bài chỉ có nữ: Dumbbell Reverse Lunge, Dumbbell Goblet Reverse Lunge, Dumbbell Split Squat và Dumbbell Goblet Split Squat. Đã đối chiếu thêm ID số, URL nguồn, tên và toàn bộ bước cũ với `scripts/migration/data/female/musclewiki-female-import.json`; manifest lưu checksum file và JSON pointer chính xác. Không gộp ID dù hai bài có hướng dẫn cũ giống nhau.

Các sửa đổi là biên tập theo hành động, dụng cụ và điểm tựa quan sát được; không khẳng định nhà cung cấp đã sửa văn bản. Giữ các góc 90 độ và ví dụ trái/phải đã có; không thêm tải trọng, số hiệp/lần hoặc chiều cao bục.

| Nhóm | Bài | Nội dung đã xác minh và sửa |
| --- | --- | --- |
| Chùng chân lùi | Plate Reverse Lunge; Dumbbell Reverse Lunge; Dumbbell Goblet Reverse Lunge; Bodyweight Reverse Lunge; Kettlebell Alternating Reverse Lunge | Đùi của chân trước/chân trụ hạ về ngang sàn, không phải đùi của chân đang bước lùi. Giữ các góc và ví dụ đổi bên có sẵn. |
| Split squat | Barbell Split Squat; Trap Bar Split Squat; Dumbbell Split Squat; Dumbbell Goblet Split Squat | Gối sau cũng gập khi hạ. Xác định tạ đòn ở lưng trên, tay cầm trap bar ở hai bên, hai tạ đơn ở hai bên hoặc một tạ goblet trước ngực theo từng ID. |
| Bước lên bục | Dumbbell Step Up; Kettlebell Step Up Double | Giữ hai tạ ở hai bên suốt động tác; bỏ câu tạ đòn ở vai hoặc chỉ cầm một tạ ấm. |
| Tạ ấm trước vai | Kettlebell Front Rack Lateral Lunge (Double); Kettlebell Front Rack Reverse Lunge (Double) | Mỗi tay một tạ ấm trước vai; bài ngang làm rõ chân gập và chân duỗi từ tư thế rộng chân. |
| Tạ ấm hai bên | Kettlebell Forward Lunge (Double) | Mỗi tay một tạ ấm, không phải một tạ duy nhất ở một bên. |
| Bục và tư thế một chân | Dumbbell Deficit Reverse Lunge; Dumbbell Single Leg Stiff Leg Deadlift | Giữ tạ đơn ở hai bên thay câu tạ đòn; deadlift đứng một chân, chân kia nhấc và duỗi ra sau, không đồng thời đứng hai chân rộng bằng vai. |

## Checklist đã hoàn thành

- [x] Lưu inventory trước sửa tại `artifacts/localization/stage-12-before.json`; nguồn khớp hash đã kiểm chứng ở đợt trước, chưa có bản dịch cho 16 ID này.
- [x] Lưu quyết định tại `source-review-decisions-004.json` và bằng chứng trước/sau, source ID/hash/timestamp, giới/góc, URL media và checksum tại `source-restorations-005.json`.
- [x] Duyệt 16 tên Việt và 51 bước trong `priority-text-038.json`, đóng gói `prepared-translations-038.json`; giữ nguyên số/thứ tự bước và con số theo nguồn đã xác minh.
- [x] Chạy toàn bộ `supabase/repairs/20261023_correct_lower_body_exercise_instructions.sql`: transaction khóa phạm vi, kiểm tra source hash/timestamp và không ghi đè bản dịch vừa được admin thêm. RLS cùng trigger xác thực vẫn hoạt động; trigger timestamp nguồn được tạm ngừng và khôi phục trong cùng transaction.
- [x] Chạy `verify-source-restoration.mjs` và chốt `reviewed-translations-038.json` sau khi toàn bộ kiểm tra live đạt. Các manifest trước đó được giữ nguyên.
- [x] Đối chiếu đủ 1.946 nguồn: chỉ steps của 16 ID thay đổi; ID, tên, category, nhóm cơ, media và timestamp nguồn giữ nguyên. Toàn bộ 1.792 bản dịch trước đợt này giữ nguyên, gồm tám revision nhãn độ khó.
- [x] Anonymous đọc đủ 1.808 bản duyệt còn hiệu lực. Giữ 291 lượt yêu thích và 289 bài admin ưu tiên, tất cả 289 bài ưu tiên có nội dung Việt.
- [x] Bộ đọc admin trả 138 thiếu + 1.807 duyệt + một bài gốc Việt, không nháp/stale. Bộ lọc bản Việt duyệt có 73 trang, trang cuối bảy bài; không bị giới hạn 1.000 dòng.
- [x] Kiểm tra HTTP 28 trường hợp chi tiết nam/nữ ở cả Anh/Việt: đúng tên, đủ các bước, cùng media và link quay về. Bốn bài chỉ có nữ được kiểm tra ở giới thực tế hiện có.
- [x] Kiểm tra 16 đường dẫn danh sách hồi quy và thêm 27 trang thực sự chứa đủ 16 bài mới/28 trường hợp giới tính. Dùng comparator ưu tiên trong code, số yêu thích và danh sách admin thực tế để xác định trang; đối chiếu toàn bộ ID/thứ tự/tên thẻ giữa Anh/Việt và giữ cùng URL video.
- [x] Kiểm tra trực tiếp mobile CSS 390 × 844: đổi Anh → Việt ở Dumbbell Split Squat, ba bước đúng, hai video vẫn phát, không tràn ngang. Mở riêng Goblet Split Squat xác nhận một tạ trước ngực, tiêu đề và media khác. Đã khôi phục tiếng Anh và kích thước trình duyệt ban đầu sau kiểm tra.
- [x] 97/97 test và lint file thay đổi đạt; dry-run manifest 038 sau nhập không còn bản cần ghi.

## Kết quả và phần tiếp theo

Hiện có **1.808/1.946 bài có nội dung Việt, còn 138 bài**. Database có 1.807 bản Việt + một bản Anh, tổng 5.556 bước dịch; 6.017 bước nguồn. Nội dung Việt phủ 1.584 bài có media nam và 1.795 bài có media nữ, tính cả phần giao nhau.

| Danh mục trong nhóm vừa xử lý | Có nội dung Việt / tổng |
| --- | ---: |
| Dumbbells | 296 / 312 |
| Kettlebells | 158 / 168 |
| Barbell | 202 / 208 |
| Bodyweight | 185 / 197 |
| Plate | 61 / 68 |

Hash toàn nguồn sau sửa: `1b0cdf6f36c7b598702efb69e7d53d3126f0a817e200b36fbc1574bd85f11ad1`.

Báo cáo mới nhất nằm tại `artifacts/localization/stage-12-after.json`, `stage-12-restoration-after.json`, `stage-12-admin-coverage-audit.json`, `stage-12-detail-pages-audit.json`, `stage-12-library-pages-audit.json`, `stage-12-translated-library-cards-audit.json` và `stage-12-browser-audit.json`. Ảnh kết quả: `stage-12-supabase-result.jpg`, `stage-12-split-squat-mobile-vi.jpg`.

Hàng đợi tiếp theo: `artifacts/localization/stage-12-remaining-source-review-queue.json`, còn 138 ID, trong đó 16 bài chưa có category. Bốn cảnh báo tự động vẫn được theo dõi riêng và không đại diện cho toàn bộ lỗi ngữ nghĩa còn lại. Không upload video/poster lên R2, không đổi code giao diện hoặc bật tính năng trên production trong đợt này. Còn nghiệm thu UI/admin/toàn bộ luồng và production theo kế hoạch chung.
