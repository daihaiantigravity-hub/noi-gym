# Sửa nhãn độ khó và xác minh tiếp hướng dẫn nguồn

Đã áp dụng và đối soát hai transaction trên dự án Supabase `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`) ngày 23/10/2026. Đây là đợt 8.3–8.4 của [kế hoạch Anh / Việt](english-vietnamese-localization-plan.md); chưa hoàn thành toàn bộ kế hoạch.

## Đợt 8.3 — bỏ nhãn độ khó khỏi danh sách bước

- [x] Đối chiếu bản DOM đánh số: hai Vajrasana, hai Table Top, ba Midback Series và Single Leg Slider Hamstring Curl 2. Chỉ dòng `Beginner`/`Novice` nằm ngoài hướng dẫn bị đọc nhầm thành bước.
- [x] Lưu checksum file gốc, URL/source ID, hash trước/sau, timestamp nguồn và toàn bộ bản dịch trước sửa tại `scripts/localization/data/source-restorations-003.json`.
- [x] Chạy `supabase/repairs/20261023_remove_difficulty_instruction_metadata.sql`: khóa phạm vi trong transaction, so cả phiên bản nguồn lẫn toàn bộ bản dịch trước khi ghi; chỉ bỏ bước nhãn trong Anh và Việt. RLS và trigger xác thực vẫn bật; chỉ tạm ngừng trigger timestamp nguồn và khôi phục trong cùng transaction.
- [x] Xác minh toàn bộ nguồn/bản dịch/quyền đọc anonymous/favorites sau sửa bằng `scripts/localization/metadata-cleanup.mjs --verify`. Không có bản dịch stale; 1.776 bản dịch ngoài phạm vi giữ nguyên, tám bản sửa giữ ngày tạo và mọi nội dung còn lại.
- [x] Giữ nguyên các manifest duyệt ban đầu. `reviewed-revisions-001.json` lưu bản sửa cùng đúng bản duyệt trước đó; `reviewed-content.mjs` chỉ áp dụng khi đối chiếu khớp lịch sử và bằng chứng đã xác minh database. Không coi bản sửa là tám bài dịch mới.
- [x] Kiểm tra 16 trường hợp chi tiết nam/nữ ở cả EN/VI và 16 đường dẫn danh sách. Kiểm tra thực tế Vajrasana: bốn bước đúng ở hai ngôn ngữ, video phát; viewport CSS 390 × 844 không tràn ngang. Đã trả kích thước và lựa chọn ngôn ngữ về trạng thái ban đầu sau kiểm tra.

Kết quả riêng đợt này: vẫn 1.784 bản duyệt, 5.480 bước dịch thay vì 5.488; 6.017 bước nguồn thay vì 6.025. Hash toàn nguồn sau sửa: `c7115f0f7008266959ccc483b4639e982cc4e47e720b9ab533df610a80cbdc3c`. Báo cáo `artifacts/localization/stage-10-after.json`; ảnh `stage-10-guide-mobile-vi.jpg`.

## Đợt 8.4 — sửa mâu thuẫn bằng video rồi dịch tám bài mới

Đọc các block nguồn và 192 mẫu theo thứ tự thời gian từ 32 clip hiện có: tám bài × hai giới × hai góc. Mỗi clip được lấy sáu mẫu trải trên thời lượng đã ghi nhận. Đây là nội dung biên tập từ hành động quan sát được, không khẳng định nhà cung cấp đã sửa văn bản. Không thêm tải trọng, số hiệp/lần hoặc góc tập không có căn cứ.

| Bài | Mâu thuẫn đã giải quyết |
| --- | --- |
| Long Lever Forearm Plank | Xác định cẳng tay và ngón chân làm điểm tựa; bỏ chuyển động “đi khuỷu tay” từ tư thế chống bàn tay không được thiết lập. |
| Kettlebell Seated Calf Raise Double | Mỗi đùi đỡ một tạ ấm, hai tay giữ ổn định; nguồn ghi nhầm tạ đòn. |
| Kettlebell Quad Stomp | Một tạ ấm mỗi tay, nguồn ghi hai tạ mỗi tay. |
| Slow Tempo Mountain Climber | Bỏ chỉ dẫn đổi chân thật nhanh trái với nhịp chậm; làm rõ chân trở lại trước khi đầu gối bên kia tiến lên. |
| Dumbbell Front Rack Step Up | Giữ tạ đơn ở vai suốt động tác, không đổi sang tạ đòn; bỏ yêu cầu chỉ một kiểu nắm không khớp clip. |
| TRX Glute Bridge | Chân treo trong quai TRX, không đồng thời đặt phẳng trên sàn; làm rõ hạ hông trở lại. |
| Stability Ball Glute Bridge | Bàn chân tiếp tục đỡ trên bóng, không đổi sang thanh đòn. |
| Band Overhead Press | Gập khuỷu khi hạ dây về ngang vai, không giữ cánh tay thẳng trong chiều hạ. |

- [x] Lưu quyết định từng bài tại `source-review-decisions-003.json`; URL/source ID, hash media/mẫu khung hình, quan sát và nội dung trước/sau tại `source-restorations-004.json`.
- [x] Duyệt tám bản Việt/25 bước trong `priority-text-037.json`, đóng gói `prepared-translations-037.json`; giữ số bước, trái/phải, dụng cụ và điểm tựa theo nguồn đã xác minh.
- [x] Chạy toàn bộ `supabase/repairs/20261023_correct_exercise_support_and_load.sql`; chốt `reviewed-translations-037.json` chỉ sau khi bộ kiểm tra hậu transaction đạt.
- [x] Đối soát tất cả 1.946 nguồn và 1.784 bản dịch trước đợt này: chỉ steps của tám ID mới thay đổi, toàn bộ bản dịch trước đó giữ nguyên; không đổi media/category/timestamp nguồn, 291 lượt lưu và 289 bài admin ưu tiên.
- [x] Anonymous đọc đủ 1.792 bản duyệt còn hiệu lực; bộ đọc admin trả 154 thiếu, 1.791 duyệt, một bài gốc Việt, không nháp/stale; bộ lọc đã duyệt có 72 trang, trang cuối 16 bài.
- [x] Kiểm tra HTTP 16 trường hợp chi tiết nam/nữ ở cả EN/VI, gồm bài không có category qua target Chi tiết; 16 đường dẫn danh sách giữ cùng thứ tự, ID và media. Kiểm tra trực tiếp đổi cờ ở TRX nữ: tiêu đề/ba bước đúng, hai video R2 vẫn phát sau đổi.
- [x] 95/95 test và lint các file thay đổi đạt. Không tạo ảnh/video mới trên R2; chỉ đọc clip hiện có về artifacts local. Không thay code giao diện hoặc triển khai production trong đợt này.
- [x] Chạy lại chế độ dry-run của `reviewed-translations-037.json` và `reviewed-revisions-001.json`: mỗi file tám bản không đổi, không có bản cần ghi và không lỗi. Không chạy import lại các bản lịch sử đã được revision thay thế.

Kết quả khi hoàn tất hai gói trong báo cáo này: **1.792/1.946 bài có nội dung Việt, còn 154**. Database có 1.791 bản Việt + một bản Anh, 5.505 bước dịch; 289/289 bài admin ưu tiên có nội dung Việt. Hash toàn nguồn: `8fa8d24356475bcf4bb3ca3e488f7910461b864399064ed030a4c3c2478b17b4`. Trạng thái mới hơn tại [báo cáo nhóm chân](exercise-source-restoration-004.md) và kế hoạch chung.

Báo cáo: `artifacts/localization/stage-11-after.json`, `stage-11-restoration-after.json`, `stage-11-admin-coverage-audit.json`, `stage-11-detail-pages-audit.json`, `stage-11-library-pages-audit.json`, `stage-11-browser-audit.json`. Hàng đợi tiếp theo: `stage-11-remaining-source-review-queue.json`.

Localhost ban đầu trả 500 ở một lượt kiểm tra (`Unexpected end of JSON input` trong dev log). Gọi lại đường dẫn thành công và toàn bộ lượt audit sau đó đạt; chưa xác định nguyên nhân gốc và không coi lỗi dev này là đã được sửa. Kiểm tra mobile/admin toàn bộ luồng và nghiệm thu production vẫn còn trong kế hoạch chung.
