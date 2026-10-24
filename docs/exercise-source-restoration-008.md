# Đợt 8.9 — Hoàn tất bản Việt cho Dumbbells và Barbell

Ngày đối soát: 23/10/2026. Dự án Supabase: `noi-gym-v2` (`exhgtcaczbgdqfozwrvg`).

Đã sửa hướng dẫn nguồn theo video và nhập 22 bản Việt với 73 bước. Toàn bộ nhóm Dumbbells đạt 312/312 bài và Barbell đạt 208/208 bài có nội dung Việt. Tổng độ phủ hiện tại là **1.881/1.946 bài**, còn **65 bài** cần xác minh trước khi dịch. Đây chưa phải nghiệm thu toàn bộ tính năng ngôn ngữ.

## Checklist đã kiểm chứng

- [x] Chụp snapshot trước sửa: 1.946 nguồn, 1.859 bản dịch, 291 lượt lưu cá nhân và 289 bài admin ưu tiên.
- [x] Đọc đủ 22 nguồn còn thiếu trong hai nhóm: 16 Dumbbells, 6 Barbell; không có bản dịch cũ ở các ID này.
- [x] Đối chiếu cả hai góc của mọi giới có sẵn: 86 clip, 516 mẫu theo thứ tự thời gian, 54 mẫu bổ sung và bốn ảnh đầy đủ độ phân giải; tổng 574 khung hình đã xem.
- [x] Đối chiếu bài chỉ có nữ bằng ID/tên/steps và checksum file import gốc. Không suy diễn có video nam.
- [x] Lưu quan sát từng ID, nội dung trước/sau, hash, nguồn media và ngoại lệ số bước của Arnold Press.
- [x] Soát tên và toàn bộ 73 bước Việt theo nguồn đã sửa; giữ số, kiểu cầm, vị trí tải và điểm tựa đã xác minh.
- [x] Tạo và chạy SQL transaction đúng 22 nguồn + 22 bản Việt; kiểm tra nội dung dán trùng toàn bộ file trước khi chạy.
- [x] Đối soát database thật và quyền đọc anonymous rồi mới chốt `reviewed-translations-042.json`.
- [x] Đối soát toàn bộ nguồn: chỉ `steps` của 22 ID được duyệt thay đổi. Giữ nguyên 1.859 bản dịch trước, tên, description, media, category, ID và timestamp nguồn.
- [x] Giữ nguyên 291 lượt lưu cá nhân, 289 bài ưu tiên và toàn bộ nội dung Việt của các bài ưu tiên.
- [x] Kiểm tra HTTP 43 trường hợp chi tiết theo giới ở cả EN/VI, 16 đường dẫn danh sách hồi quy và 39 trang có đủ 22 bài mới/43 trường hợp theo giới.
- [x] Kiểm tra hàm đọc admin thực tế: không nháp/stale, 76 trang duyệt Việt, trang cuối năm bài; không bị cắt ở 1.000 dòng.
- [x] Kiểm tra mobile Arnold Press CSS 390 × 844: đúng tên/ba bước, đổi cờ và refresh giữ tiếng Việt, hai video đang phát, không tràn ngang. Trả lại tiếng Anh và viewport ban đầu.
- [x] 105/105 test, lint hai file kiểm thử và kiểm tra khoảng trắng đạt. Import dry-run: 22 unchanged, 0 pending writes.
- [ ] Xác minh/dịch 65 bài còn lại và nghiệm thu đầy đủ giao diện, thao tác lưu/duyệt admin, bản đồ, auth và hiệu năng.
- [ ] Nghiệm thu và bật bản dịch trên production theo kế hoạch chung.

## Các sửa đổi cần phân biệt

Đây là nội dung biên tập từ video, không phải văn bản nhà cung cấp được truy xuất lại hay khôi phục nguyên câu bị mất. Giữ nguyên tên tiếng Anh để bảo toàn định danh nguồn; các tên Việt mô tả đúng động tác và biến thể.

| Bài/nhóm bài | Nội dung được xác minh và sửa |
| --- | --- |
| Bốn Curtsy Deficit Lunge | Thêm bước chéo chân ra sau; giữ riêng goblet trước ngực, hai tạ hai bên, front rack trước vai và thanh đòn trên lưng. Sửa các câu trả động tác nhầm tạ đơn thành thanh đòn. |
| High Bar Good Morning | Hoàn chỉnh hướng dẫn gập hông/lưng thẳng theo video; bỏ câu dở và khẳng định chưa xác minh về đệm/cột sống cổ. |
| Laying Curl | Tư thế nằm ngửa trên ghế, không phải ngồi; bổ sung đủ cuốn và hạ tạ. Không suy diễn góc ghế. |
| Thruster | Có squat trước khi dùng lực chân đẩy cả hai tạ qua đầu, không chỉ nhún nhẹ như push press. |
| Upright Row | Hai tạ tổng cộng, mỗi tay một tạ; khuỷu dẫn lên/ra ngoài, hạ có kiểm soát. Giữ chữ số 2 nhưng chủ động sửa ý nghĩa số lượng từ bốn tạ thành hai. |
| EZ Bar Spider Curl | Ngực tựa ghế dốc, tay cầm thanh EZ, không cầm ghế hoặc “bat”. |
| Figure Four Heels Elevated Hip Thrust | Chỉ có nữ; ảnh gốc xác nhận tạ đơn ngang hông, lưng trên tựa ghế, một bàn chân kê cao và cổ chân kia bắt chéo qua đùi trụ. |
| Weighted Pull Ups | Tạ đơn treo bằng đai/xích giữa hai chân, không kẹp giữa hai bàn chân. |
| Reverse Grip Bench Press | Cầm tạ đơn bằng tay ngửa, không tháo hoặc nâng thanh đòn khỏi giá. |
| Barbell Calf Jump | Nam giữ phần trước bàn chân trên sàn, nữ bật nhẹ rời sàn. Bỏ câu nguồn mâu thuẫn và yêu cầu dừng trên cao không khớp cả hai biến thể. |
| Neutral Seated Overhead Press | Ngồi tựa lưng, lòng bàn tay hướng nhau, đẩy qua đầu rồi hạ ngang vai. Bỏ khẳng định so sánh về khớp vai chưa xác minh. |
| Stability Ball Wall Squat | Bóng nằm giữa lưng dưới và tường; mỗi tay một tạ, không phải hai tạ mỗi tay. |
| Pushup to Renegade Row | Bổ sung chống đẩy trước kéo tạ luân phiên; ghi rõ biến thể nữ chống gối và nam chống mũi chân. |
| Landmine Single Leg Glute Bridge | Lưng trên tựa bục thấp, một chân trụ, chân kia nâng, hai tay giữ đầu thanh trên hông. |
| Staggered Waiters Bow | Giữ thanh cố định làm điểm tựa đùi, thêm mỗi tay một tạ đơn; không thay mọi chữ “bar” thành tạ đơn. |
| Block Conventional Deadlift | Trả bánh tạ về điểm kê cao, không xuống sàn; lưng giữ thẳng khi duỗi hông/gối. |
| Shoulder External Rotation | Khuỷu tựa mặt trong gối đang nâng; khoảng 90 độ giữ từ câu nguồn như hướng dẫn, không coi là góc đo từ video. |
| Heels Up Goblet Squat | Squat kê gót với tạ đơn trước ngực; bỏ toàn bộ câu xoay người khi quỳ không liên quan. |
| Alternating Arnold Press | Mở từ một bước chỉ ghi đứng thành ba bước: chuẩn bị, đẩy/xoay một tay, hạ/xoay lại/luân phiên; tay kia giữ tạ ngang vai. Đây là ngoại lệ số bước duy nhất của đợt này. |

Mọi bài còn lại giữ số bước trước/sau. Tổng bước nguồn tăng đúng hai: 6.017 → 6.019. Tổng bước trong các bản dịch duyệt tăng 73: 5.714 → 5.787. Không thêm mức tạ, số hiệp, số lần hoặc góc đo mới.

## Kết quả đối soát

| Chỉ số | Kết quả |
| --- | --- |
| Bản dịch duyệt | 1.881 = 1.880 Việt + 1 Anh |
| Nội dung Việt, kể cả nguồn gốc Việt | 1.881/1.946 |
| Bài còn thiếu Việt | 65 |
| Media dùng chung bản Việt | 1.652 bài có nam, 1.868 bài có nữ; có giao nhau |
| Admin ưu tiên có nội dung Việt | 289/289 |
| Anonymous đọc bản duyệt còn hiệu lực | 1.881 |
| Admin Việt | 65 thiếu, 1.880 duyệt, 1 gốc; 0 nháp/stale |
| Admin Anh | 1.945 gốc, 1 duyệt; 0 nháp/stale |
| Bộ quét cảnh báo tự động | 1 bài, không đại diện cho tổng 65 bài còn thiếu |
| Sửa nguồn tích lũy | Chín gói, 156 ID riêng biệt |

Hash snapshot toàn nguồn trước: `5190f7c1cdc5e2d119666c940412d4dc8893f6bddf721edbd45cb86ec902ecd5`.

Hash sau, khớp tuyệt đối snapshot dự kiến chỉ thay `steps`: `6adc9d3e7d83b5eb96b5ef48c2f9efb7d49c51d2546aae49371c2025b6ea0e22`.

SQL chỉ dùng bảng tạm `ON COMMIT DROP`; lời nhắc RLS của SQL Editor áp dụng cho những bảng tạm này. RLS các bảng ứng dụng và trigger kiểm tra bản dịch vẫn được giữ. Chỉ trigger timestamp bị tạm ngưng bên trong transaction rồi khôi phục để không làm thay đổi thứ tự ưu tiên. Hash, timestamp và phiên bản đã có được so khớp trước khi ghi; chạy lại không chèn trùng.

## Tệp bàn giao

- Quyết định nguồn: [source-review-decisions-008.json](../scripts/localization/data/source-review-decisions-008.json).
- Bằng chứng trước/sau và media: [source-restorations-009.json](../scripts/localization/data/source-restorations-009.json).
- Nội dung Việt: [priority-text-042.json](../scripts/localization/data/priority-text-042.json), [bản đã chuẩn bị](../scripts/localization/data/prepared-translations-042.json), [bản đã xác minh live](../scripts/localization/data/reviewed-translations-042.json).
- Transaction: [20261023_correct_dumbbell_barbell_instructions.sql](../supabase/repairs/20261023_correct_dumbbell_barbell_instructions.sql).
- Kiểm thử: [video-source-corrections.test.mjs](../tests/video-source-corrections.test.mjs), [reviewed-exercise-content.test.mjs](../tests/reviewed-exercise-content.test.mjs). Hai ngoại lệ cũ chỉ được duyệt khi hash khớp sửa nguồn có đủ bằng chứng video; bộ quét vẫn chặn câu gốc sai.
- Snapshot và báo cáo tại `artifacts/localization/stage-16-*`: `before`, `restoration-after`, `after`, `current-snapshot`, `remaining-source-review-queue`, `detail-pages-audit`, `library-pages-audit`, `translated-library-cards-audit`, `admin-coverage-audit`, `browser-audit`, `final-verification`.
- Ảnh kiểm chứng: `artifacts/localization/stage-16-arnold-press-mobile-vi.jpg` và `stage-16-sql-result.jpg`.

Các artifacts video/snapshot được lưu local, không upload thêm lên R2. Không build hoặc deploy trong đợt dữ liệu này. Localhost đang bật lớp đọc bản dịch nhận dữ liệu mới trực tiếp. Kiểm tra mobile là một mẫu; chưa thay thế nghiệm thu toàn bộ màn hình hoặc kiểm thử tương tác favorites/admin.

## Phần còn lại

| Nhóm | Đã có Việt / Tổng | Còn thiếu |
| --- | --- | --- |
| Bodyweight | 185/197 | 12 |
| Pilates | 43/49 | 6 |
| Recovery | 105/116 | 11 |
| Stretches | 47/52 | 5 |
| Yoga | 58/73 | 15 |
| Chưa có category | 116/132 | 16 |
| Tổng | | 65 |

Không tự gán category hoặc suy ra biến thể từ tên. Cảnh báo tự động còn lại là `Machine Horizontal Leg Press Calf Jump`; bài thuộc danh sách chưa phân loại, không thuộc 80 bài category Machine đã hoàn tất. Tiếp tục theo hàng đợi có ID/hash/lý do, kiểm tra nguồn/video trước khi duyệt. [Kế hoạch chung](english-vietnamese-localization-plan.md) vẫn để các hạng mục chưa nghiệm thu ở trạng thái đang làm.
