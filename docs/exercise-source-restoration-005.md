# Xác minh và dịch nhóm TRX — đợt 8.6

Đã áp dụng và đối soát ngày 23/10/2026 trên Supabase `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`). Toàn bộ **31/31 bài TRX có nội dung Việt**. Đây là một bước của [kế hoạch Anh / Việt](english-vietnamese-localization-plan.md); toàn bộ kế hoạch chưa hoàn tất.

Các số liệu dưới đây ghi nhận tại cuối đợt 8.6. Kết quả tiếp theo và độ phủ mới nhất nằm ở [báo cáo đợt 8.7](exercise-source-restoration-006.md).

## Phạm vi và bằng chứng

Đối chiếu 11 nguồn TRX còn thiếu bản Việt với cả nam/nữ và hai góc quay: 44 clip, mỗi clip sáu mẫu theo thời gian. Với Lateral Lunge, Pec Fly và Rear Delt Fly, các mẫu đều ban đầu có lúc trùng pha động tác, nên đã xem thêm tám ảnh gồm 48 mẫu lệch thời điểm. Tổng cộng 312 mẫu được kiểm tra.

Manifest lưu URL/source ID, nội dung trước/sau, hash/timestamp, giới/góc quay và checksum video/ảnh. Đây là biên tập theo tư thế và chuyển động quan sát được; không khẳng định đã khôi phục văn bản gốc của nhà cung cấp. Giữ góc 90 độ và ví dụ trái/phải sẵn có, không thêm số lần/hiệp, tải trọng hay góc cơ thể mới.

| Bài | Nội dung đã xác minh và sửa |
| --- | --- |
| TRX Lateral Lunge | Quay về điểm neo; gối bên bước ngang gập, chân đối diện duỗi; dùng tay nắm hỗ trợ trở về. Bỏ cách gọi chân trước/sau không phù hợp. |
| TRX Jumping Squat | Giữ cả hai tay nắm khi squat, bật nhảy và tiếp đất; bỏ câu có thể buông tay vung tự do. |
| TRX Kneeling Ab Rollout | Gối giữ trên sàn, hai tay vươn ra trước/lên trên rồi trở về tư thế quỳ; bỏ chỉ dẫn chuyển sang đầu ngón chân. |
| TRX Pushup | Quay lưng về điểm neo, chân trên sàn, nghiêng người ra trước trong tư thế plank, gập/duỗi khuỷu tay. |
| TRX Pec Fly | Quay lưng về điểm neo, mở hai tay với khuỷu hơi gập rồi khép có kiểm soát. Bỏ hướng quay sai và thiết lập độ cao không được xác minh. |
| TRX Forearm Plank | Chân treo trong quai, cẳng tay trên sàn, khuỷu dưới vai; bỏ yêu cầu đồng thời cầm tay nắm trên đầu. |
| TRX Rear Delt Fly | Quay về điểm neo, ngả ra sau rồi mở hai tay ngang vai để nâng thân, trở về có kiểm soát. Không ép khuỷu luôn thẳng khi clip có gập. |
| TRX Curtsy Lunge | Sửa hướng quay về điểm neo; giữ ví dụ chân trái chéo sau chân phải và đổi bên của nguồn. |
| TRX Reverse Curl | Nắm sấp, lòng bàn tay xuống ở tư thế đầu; tay trên ở trước thân, gập khuỷu đưa tay nắm về trán rồi duỗi. |
| TRX Hamstring Curl | Nằm ngửa, gót trong quai, vai/tay trên sàn; nâng hông và gập gối kéo gót về mông. Bỏ tư thế nằm sấp sai. |
| TRX Rear Delt Row | Quay về điểm neo, ngả ra sau, gập khuỷu mở sang hai bên để kéo thân về phía tay nắm rồi duỗi trở lại. |

## Checklist đã hoàn thành

- [x] Lưu inventory trước sửa tại `artifacts/localization/stage-13-before.json`; chưa có bản dịch cho 11 ID này.
- [x] Lưu quyết định tại `source-review-decisions-005.json`, bằng chứng trước/sau và checksum tại `source-restorations-006.json`.
- [x] Duyệt 11 tên Việt và 39 bước trong `priority-text-039.json`, đóng gói `prepared-translations-039.json`.
- [x] Chạy toàn bộ `supabase/repairs/20261023_correct_trx_exercise_instructions.sql`: transaction có guard hash/timestamp và bản dịch mới phát sinh; chỉ tạm ngừng trigger timestamp nguồn rồi khôi phục trong cùng giao dịch. RLS và trigger kiểm tra bản dịch vẫn hoạt động. Bảng không bật RLS trong cảnh báo dashboard là bảng tạm tự hủy sau commit.
- [x] Chạy `verify-source-restoration.mjs` trên dữ liệu thật rồi chốt `reviewed-translations-039.json`.
- [x] Đối chiếu đủ 1.946 nguồn: chỉ steps của 11 ID thay đổi; tên, ID, category, nhóm cơ, media và timestamp giữ nguyên. Toàn bộ 1.808 bản dịch trước đợt này giữ nguyên, gồm tám revision nhãn độ khó.
- [x] Anonymous đọc đủ 1.819 bản duyệt còn hiệu lực. Giữ 291 lượt yêu thích và 289 bài admin ưu tiên; cả 289 bài ưu tiên có nội dung Việt.
- [x] Bộ đọc admin thực tế trả 127 thiếu + 1.818 duyệt + một bài gốc Việt; không draft/stale. Bộ lọc bản Việt duyệt có 73 trang, trang cuối 18 bài, không bị cắt ở 1.000 dòng.
- [x] HTTP kiểm tra 22 trường hợp chi tiết nam/nữ ở cả Anh/Việt: tên, đủ bước, media và liên kết quay về. Kiểm tra thêm 16 đường dẫn danh sách hồi quy.
- [x] Xác định đúng 12 trang danh sách chứa đủ 11 bài mới/22 trường hợp giới tính bằng comparator trong code và dữ liệu yêu thích/admin thực tế. ID/thứ tự/tên/media giữa hai ngôn ngữ đều đúng.
- [x] Kiểm tra trực tiếp TRX Hamstring Curl trên mobile CSS 390 × 844: tiêu đề và đủ ba bước tiếng Việt, hai video có `readyState=4` và đang phát, không tràn ngang. Sau refresh vẫn tiếng Việt và video phát; đã khôi phục tiếng Anh cùng kích thước ban đầu. Không thao tác lưu/bỏ yêu thích.
- [x] 99/99 test, lint file thay đổi và dry-run manifest 039 đạt: 11 unchanged, không còn bản cần ghi.

## Kết quả và giới hạn

Hiện **1.819/1.946 bài có nội dung Việt, còn 127 bài**. Database có 1.818 bản Việt + một bản Anh, tổng 5.595 bước dịch; nguồn vẫn có 6.017 bước. Độ phủ Việt gồm 1.595 bài có media nam và 1.806 bài có media nữ, có phần giao nhau.

Hash toàn nguồn sau sửa: `d3fd9d5df5b3dca6f65be14ed9fc48173f1cb75ec56004b19b4175ab0a6cebf6`.

Một request chi tiết Rear Delt Fly tiếng Việt ở localhost trả HTTP 500 trong lượt audit đầu. Mở lại cùng URL ở Anh/Việt đều 200, sau đó toàn bộ lượt audit chạy lại đạt. Chưa xác định nguyên nhân gốc; không coi là đã sửa lỗi dev. Đây là kết quả HTTP riêng, không suy đoán nội dung lỗi từ những đợt trước.

Báo cáo: `artifacts/localization/stage-13-after.json`, `stage-13-restoration-after.json`, `stage-13-admin-coverage-audit.json`, `stage-13-detail-pages-audit.json`, `stage-13-library-pages-audit.json`, `stage-13-translated-library-cards-audit.json` và `stage-13-browser-audit.json`. Ảnh kết quả: `stage-13-supabase-result.jpg`, `stage-13-trx-hamstring-mobile-vi.jpg`. Hàng đợi tiếp theo `stage-13-remaining-source-review-queue.json` giữ 127 ID, trong đó 16 bài chưa có category. Bốn cảnh báo tự động vẫn thuộc hàng đợi này; không đại diện cho toàn bộ lỗi ngữ nghĩa còn lại.

Đợt này không upload video/poster lên R2 và không thay code giao diện hoặc cấu hình production. Còn xử lý 127 nguồn, nghiệm thu UI/admin/hiệu năng và triển khai theo kế hoạch chung.
