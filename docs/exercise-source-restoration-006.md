# Xác minh và dịch dây kháng lực, máy tập, cáp và Ski Erg — đợt 8.7

Đã áp dụng và đối soát trực tiếp ngày 23/10/2026 trên `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`). Thêm **18 bản Việt với 48 bước**, hoàn tất nội dung Việt cho bốn nhóm: **Band 105/105, Machine 80/80, Cables 186/186 và Cardio 48/48**. Toàn bộ [kế hoạch Anh / Việt](english-vietnamese-localization-plan.md) vẫn còn công việc.

Các số liệu dưới đây ghi nhận tại cuối đợt 8.7. Kết quả tiếp theo và độ phủ mới nhất nằm ở [báo cáo đợt 8.8](exercise-source-restoration-007.md).

## Bằng chứng và nội dung sửa

Đã đọc nguồn cũ và kiểm tra 66 clip hiện có của 18 bài: 396 mẫu theo thời gian, thêm 36 mẫu lệch thời điểm ở sáu clip để thấy các pha chưa rõ. Tổng 432 mẫu đã được xem. Mười lăm bài có cả nam/nữ, ba bài chỉ có nữ: Cable Bar Reverse Grip Pushdown, Neutral Chest Press và Machine Chest Press. Ba ID này được đối chiếu thêm với file import nữ gốc, URL/source ID, từng bước cũ và checksum file; không tạo hoặc gán thêm video nam.

Đây là biên tập hướng dẫn dựa trên video, có lưu bản trước/sau và quan sát cho từng ID; không khẳng định đã khôi phục văn bản của nhà cung cấp. Giữ số bước và góc 90 độ đã khôi phục trước đó; không tự đặt số lần/hiệp, tải trọng hoặc góc cơ thể.

| Nhóm bài | Nội dung đã xác minh |
| --- | --- |
| Band Pullover; Band Horizontal Shrug | Làm rõ neo cao hơn đầu và kéo về đùi ở pullover; shrug giữ khuỷu thẳng, chuyển động bả vai ra sau/ra trước, bỏ cụm chữ lỗi. |
| Mini Band Bent Arm Lateral Raise; Mini Band Bent Over Row | Hai khuỷu nâng/hạ cùng nhau, không luân phiên; row dùng chân trước giữ dây, tay tựa đùi và bổ sung pha kéo còn thiếu. |
| Band Goblet Squat; Band Squat | Tách rõ hai tay giữ trước ngực với hai tay ở hai bên; sửa chiều rộng chân và tham chiếu đùi song song sàn, giữ lời khuyên kiểm tra bằng gương. |
| Band Hip Adduction; Cable Standing Hip Adduction | Chân gần điểm neo gắn dây/cáp kéo vào trong, chân kia trụ. Bỏ yêu cầu cả hai chân cùng dang ra ngoài. |
| Band Standing Chest Press; Band Single Arm Pec Fly | Phân biệt đẩy hai tay ra trước với một tay vòng qua trước ngực; bỏ nhãn giải phẫu duỗi vai không phù hợp. |
| Band Internally Rotated Chest Fly | Neo phía sau ngang vai, bước một chân trước, nắm sấp, khép hai tay trước ngực rồi mở lại. Bỏ thiết lập đạp dây và động tác nâng ngang bị chép sai; không ép xoay thêm theo mô tả sai cũ. |
| Cable Decline Bench Press | Ngồi tựa ghế giữa hai ròng rọc cao hơn vai khi ngồi, đẩy chéo ra trước/xuống. Không suy ra góc ghế dốc xuống từ tên canonical. |
| Cable Bar Reverse Grip Pushdown | Nắm ngửa, không nắm sấp; cánh tay trên giữ hai bên thân, duỗi/gập khuỷu có kiểm soát. |
| Cable Quadruped Hip Abduction | Chống hai tay và một gối, chân tập duỗi phía sau rồi dang sang bên; chân tập không đặt xuống sàn khi trả. Không suy đoán điểm tiếp xúc của chồng tạ từ câu “cables touching back down”. |
| Neutral Chest Press; Machine Chest Press | Giữ riêng nắm trung tính và nắm sấp; sửa câu mâu thuẫn về duỗi khuỷu, giữ không quá duỗi và tựa lưng, có pha trở về. |
| Machine Plate Loaded Kneeling Hamstring Curl | Một gối trên đệm, thân trên tựa đệm trước, chân kia gập gối nâng cần; bỏ tư thế nằm và chỉ dẫn cả hai chân. |
| Cardio Ski Erg | Thay nguyên hướng dẫn nhảy ngang/burpee một chân bị chép nhầm bằng đứng hướng máy, hai tay kéo xuống khi gập hông/gối rồi đứng lên đưa tay trở lại. |

## Checklist đã hoàn thành

- [x] Lưu toàn inventory trước sửa tại `artifacts/localization/stage-14-before.json`, xác nhận nguồn khớp đợt trước và chưa có bản dịch của 18 ID.
- [x] Lưu quyết định tại `source-review-decisions-006.json`; manifest `source-restorations-007.json` giữ source ID/hash/timestamp, quan sát, giới/góc và checksum clip/ảnh, cùng bằng chứng import nữ cho ba ID.
- [x] Duyệt `priority-text-040.json`, đóng gói 18 bản Việt/48 bước tại `prepared-translations-040.json`.
- [x] Chạy toàn bộ `supabase/repairs/20261023_correct_band_machine_cable_cardio_instructions.sql`. Giao dịch có guard hash/timestamp và bản dịch mới phát sinh; chỉ tạm ngừng trigger timestamp nguồn rồi khôi phục trong cùng transaction. RLS và trigger xác thực bản dịch giữ hoạt động; các bảng bị cảnh báo RLS là bảng tạm tự hủy khi commit.
- [x] Chạy `verify-source-restoration.mjs` trên database thật, chỉ chốt `reviewed-translations-040.json` sau khi tất cả kiểm tra đạt.
- [x] Đối chiếu đầy đủ 1.946 nguồn: chỉ steps của 18 ID thay đổi; giữ tên, ID, category, nhóm cơ, media và timestamp. Toàn bộ 1.819 bản dịch trước đó không đổi, gồm tám revision nhãn độ khó.
- [x] Anonymous đọc đủ 1.837 bản duyệt còn hiệu lực. Giữ 291 lượt yêu thích và 289 bài admin ưu tiên; cả 289 bài có nội dung Việt.
- [x] Bộ đọc admin thực tế trả 109 thiếu + 1.836 duyệt + một bài gốc Việt, không draft/stale. Bộ lọc duyệt có 74 trang, trang cuối 11 bài, không bị cắt ở 1.000 dòng.
- [x] HTTP kiểm tra 33 trường hợp chi tiết theo giới có sẵn ở cả Anh/Việt: tên, toàn bộ bước, URL video và liên kết quay lại. Kiểm tra thêm 16 đường dẫn danh sách hồi quy.
- [x] Kiểm tra 31 trang danh sách thực sự chứa đủ 18 bài/33 trường hợp giới tính; dùng comparator trong code và dữ liệu yêu thích/admin thực tế. Giữ nguyên ID, thứ tự ưu tiên và media giữa hai ngôn ngữ, tên thẻ theo đúng locale.
- [x] Kiểm tra Ski Erg trên mobile CSS 390 × 844: đủ ba bước tiếng Việt, hai video có `readyState=4` và đang phát, không tràn ngang. Sau refresh vẫn tiếng Việt và video phát; đã trả tiếng Anh và kích thước trình duyệt ban đầu. Không thao tác lưu/bỏ yêu thích.
- [x] 101/101 test và lint đạt; dry-run manifest 040 trả 18 unchanged, 0 pending writes, không lỗi.

## Kết quả và công việc tiếp theo

Hiện **1.837/1.946 bài có nội dung Việt, còn 109 bài**. Database có 1.836 bản Việt và một bản Anh, tổng 5.643 bước dịch; số bước nguồn vẫn 6.017. Độ phủ Việt gồm 1.610 bài có media nam và 1.824 bài có media nữ, có phần giao nhau.

Hash toàn nguồn sau sửa: `50700506d09551c2d3107e3d028292427f807c23982552f81db6cd3864a474b8`.

Báo cáo đầy đủ trong `artifacts/localization/stage-14-after.json`, `stage-14-restoration-after.json`, `stage-14-admin-coverage-audit.json`, `stage-14-detail-pages-audit.json`, `stage-14-library-pages-audit.json`, `stage-14-translated-library-cards-audit.json` và `stage-14-browser-audit.json`. Ảnh kết quả: `stage-14-supabase-result.jpg`, `stage-14-ski-erg-mobile-vi.jpg`.

Hàng đợi `stage-14-remaining-source-review-queue.json` còn 109 ID: 93 bài có category, 16 bài chưa có category. Bốn cảnh báo tự động nằm trong hàng đợi này, không đại diện cho toàn bộ lỗi ngữ nghĩa. Lượt HTTP đợt này đạt; nguyên nhân lỗi dev 500 tạm thời đã ghi ở đợt trước chưa được xác định hay coi là đã sửa.

Không phát sinh ảnh/video trên R2, không thay code giao diện hoặc cấu hình production trong đợt này. Còn xác minh 109 nguồn, nghiệm thu UI/admin/hiệu năng và triển khai theo kế hoạch chung.
