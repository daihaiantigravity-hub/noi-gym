# Xác minh và dịch tạ ấm, bánh tạ, BOSU và bóng tạ — đợt 8.8

Báo cáo lịch sử của đợt 8.8. Độ phủ và checklist mới nhất nằm ở [đợt 8.9](exercise-source-restoration-008.md); giữ nguyên số liệu dưới đây để đối soát.

Đã áp dụng và đối soát trực tiếp ngày 23/10/2026 trên `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`). Thêm **22 bản Việt với 71 bước**, hoàn tất bốn nhóm: **Kettlebells 168/168, Plate 68/68, Bosu Ball 31/31 và Medicine Ball 34/34**. Toàn bộ [kế hoạch Anh / Việt](english-vietnamese-localization-plan.md) chưa hoàn tất.

## Phạm vi và bằng chứng

Đã kiểm tra 86 tệp clip theo giới/góc hiện có, mỗi clip sáu mẫu theo thời gian, tổng 516 mẫu chính. Bổ sung 72 mẫu: 12 khung hình trong năm giây đầu của mỗi clip clean/jerk (bốn clip), và bốn ảnh sáu mẫu lệch thời điểm để kiểm tra điểm tựa BOSU, chân khi xoay với bánh tạ và thanh cố định. Tổng 588 mẫu đã xem.

Kettlebell Guillotine Bench Press chỉ có video nữ; ID, URL nguồn và từng bước cũ được đối chiếu thêm với file import nữ gốc có checksum. Partner Side Toss dùng cùng đoạn biểu diễn hai người trong các tệp media nam/nữ, không coi đó là bốn màn biểu diễn khác nhau. Không tạo hoặc gán thêm media.

Sửa nguồn là biên tập theo quan sát, không phải khôi phục văn bản nhà cung cấp. Giữ số bước, thứ tự phải/trái và khoảng giữ một giây có sẵn trong Plate Russian Twist. Không thêm góc, số lần/hiệp hay tải trọng.

| Nhóm bài | Nội dung được xác minh và sửa |
| --- | --- |
| Kettlebell Waiters Bow; Kettlebell Staggered Waiters Bow; Plate Staggered Waiters Bow | Thanh cố định ở đùi là điểm tựa/tham chiếu, tạ cầm là hai tạ ấm hoặc một bánh tạ trước ngực. Giữ riêng chân trước/phần ngón chân sau và trình tự gập hông. |
| Kettlebell Upright Row Single; Kettlebell Upright Row | Một tạ cầm bằng hai tay khác với mỗi tay một tạ; cả hai giữ thân thẳng đứng. Bỏ hướng dẫn gập người hạ tạ xuống sàn bị chép sai. |
| Kettlebell Guillotine Bench Press; Kettlebell Incline Guillotine Bench Press | Mỗi tay một tạ; tách ghế phẳng và ghế dốc lên, khuỷu mở hai bên. Không suy ra góc ghế hoặc yêu cầu tạ chạm cổ. |
| Kettlebell Staggered Swing | Bổ sung tư thế đầu và vung ra sau trước pha đẩy hông; giữ chân trước chân sau và mục tiêu ngang ngực của nguồn. |
| Kettlebell Hang Clean And Jerk | Xác minh đoạn từ treo lên vai, nhún gối và dùng lực chân đưa tạ qua đầu; không tự thêm pha đón gập gối lần hai hoặc tách chân chưa được xác lập. |
| Kettlebell Alternating Single Arm Thruster; Kettlebell Thruster | Tách đẩy một tay luân phiên trong khi tay kia giữ ở vai với đẩy cả hai tạ. Thruster có squat trước khi đẩy, không chỉ nhún nhẹ. |
| Weighted Knee Push Ups; Plate Deficit Pushup | Bánh tạ nằm trên lưng trên ở bài chống đẩy gối; bài tăng biên độ dùng hai bánh tạ riêng, mỗi tay một bánh và ngực hạ vào khoảng trống. |
| Plate Single Leg Pinch Grip Deadlift; Plate Lateral Raise; Plate Hip Abduction | Deadlift cầm kẹp mép một bánh mỗi tay, gập hông cùng chân tự do duỗi sau rồi đứng lên; lateral raise mỗi tay một bánh; hip abduction giữ bánh áp đùi ngoài, không neo giữa hai chân. |
| Plate Russian Twist | Cầm một bánh bằng hai tay, thân ngả ra sau, giữ chân ổn định. Video nam nhấc chân, nữ giữ gót gần/trên sàn nên không ép cùng tư thế bàn chân cho cả hai. Giữ thứ tự phải/trái và khoảng dừng cũ. |
| Bosu Ball Hip Thrust; Bosu Ball Single Leg Hip Thrust; Bosu Ball Situp | Hai bài nâng hông tựa lưng trên vào mặt vòm BOSU, tách một chân và hai chân trụ. Situp nằm trên sàn, cầm mép BOSU nâng lên, không tựa lưng lên bóng. |
| Medicine Ball Press Jack; Medicine Ball Partner Side Toss | Tách/khép chân đồng thời đẩy/hạ bóng; hai bạn tập đứng cạnh nhau cùng hướng trước rồi xoay để chuyền ngang, không đứng đối diện nhau. |

## Checklist đã hoàn thành

- [x] Lưu inventory trước sửa tại `artifacts/localization/stage-15-before.json`, xác nhận hash nguồn khớp đợt trước và 22 ID chưa có bản dịch.
- [x] Lưu quyết định `source-review-decisions-007.json`; bằng chứng trước/sau, source ID/hash/timestamp, giới/góc, checksum clip/ảnh và import nữ tại `source-restorations-008.json`.
- [x] Duyệt `priority-text-041.json`, đóng gói 22 bản Việt/71 bước trong `prepared-translations-041.json`.
- [x] Chạy toàn bộ `supabase/repairs/20261023_correct_kettlebell_plate_bosu_ball_instructions.sql`: giao dịch kiểm tra hash/timestamp, không ghi đè bản dịch mới phát sinh. Chỉ tạm ngừng trigger timestamp nguồn rồi khôi phục trong cùng transaction; RLS và trigger xác thực bản dịch vẫn hoạt động. Cảnh báo RLS của dashboard liên quan các bảng tạm tự hủy khi commit.
- [x] Chạy `verify-source-restoration.mjs` trên database thật rồi mới chốt `reviewed-translations-041.json`.
- [x] Đối chiếu đủ 1.946 nguồn: chỉ steps của 22 ID thay đổi; ID, tên, category, nhóm cơ, media và timestamp giữ nguyên. Toàn bộ 1.837 bản dịch trước đó không đổi, gồm tám revision nhãn độ khó.
- [x] Anonymous đọc đủ 1.859 bản duyệt còn hiệu lực; không draft/stale. Giữ 291 lượt yêu thích và 289 bài admin ưu tiên, cả 289 bài có nội dung Việt.
- [x] Bộ đọc admin thực tế trả 87 thiếu + 1.858 duyệt + một bài gốc Việt; bộ lọc duyệt có 75 trang, trang cuối tám bài, không bị cắt ở 1.000 dòng.
- [x] HTTP kiểm tra 43 trường hợp chi tiết theo giới có sẵn ở cả Anh/Việt: tên, toàn bộ bước, URL video và liên kết quay lại. Kiểm tra thêm 16 đường dẫn danh sách hồi quy.
- [x] Kiểm tra 39 trang thực sự chứa đủ 22 bài/43 trường hợp giới tính; dùng comparator trong code và dữ liệu favorites/admin thực tế. ID, thứ tự ưu tiên, media giữ nguyên giữa hai ngôn ngữ và tên thẻ đúng locale.
- [x] Kiểm tra BOSU Situp trên mobile CSS 390 × 844: ba bước đúng, hai video `readyState=4` và đang phát, không tràn ngang. Sau refresh vẫn tiếng Việt và video phát; đã trả tiếng Anh/kích thước ban đầu, không thao tác lưu/bỏ yêu thích.
- [x] 103/103 test và lint đạt; dry-run manifest 041 trả 22 unchanged, 0 pending writes, không lỗi.

## Kết quả và phần còn lại

Hiện **1.859/1.946 bài có nội dung Việt, còn 87 bài**. Database có 1.858 bản Việt và một bản Anh, tổng 5.714 bước dịch; số bước nguồn vẫn 6.017. Độ phủ Việt gồm 1.631 bài có media nam và 1.846 bài có media nữ, có phần giao nhau.

Hash toàn nguồn sau sửa: `5190f7c1cdc5e2d119666c940412d4dc8893f6bddf721edbd45cb86ec902ecd5`.

Báo cáo tại `artifacts/localization/stage-15-after.json`, `stage-15-restoration-after.json`, `stage-15-admin-coverage-audit.json`, `stage-15-detail-pages-audit.json`, `stage-15-library-pages-audit.json`, `stage-15-translated-library-cards-audit.json` và `stage-15-browser-audit.json`. Ảnh kết quả: `stage-15-supabase-result.jpg`, `stage-15-bosu-situp-mobile-vi.jpg`.

Hàng đợi `stage-15-remaining-source-review-queue.json` còn 87 ID: 71 bài có category, 16 bài chưa có category. Bốn cảnh báo tự động nằm trong hàng đợi này, không đại diện cho toàn bộ lỗi ngữ nghĩa. HTTP đợt này đạt; nguyên nhân các lỗi dev 500/JSON tạm thời ở đợt trước vẫn chưa xác định và không được coi là đã sửa.

Đợt này không phát sinh video/poster trên R2 và không đổi code giao diện hoặc cấu hình production. Còn xử lý 87 nguồn, nghiệm thu UI/admin/hiệu năng và triển khai theo kế hoạch chung.
