# Khôi phục con số trong hướng dẫn bài tập — đợt 1

Trạng thái: **đã chạy SQL và đối soát database thành công ngày 23/10/2026**. Đợt này khôi phục đúng 40 bài và thêm 38 bản Việt, đưa độ phủ tại thời điểm đó lên **1.772/1.946 bài**, còn **174 bài**. Kết quả tiếp theo và độ phủ hiện tại nằm trong [kế hoạch chính](english-vietnamese-localization-plan.md) và [đợt 2](exercise-source-restoration-002.md).

## Nguyên nhân đã xác nhận

`convert-musclewiki-dom-to-import.mjs` dùng số xuất hiện ở bất kỳ vị trí nào để tách bước. Vì vậy số góc, khoảng cách và số lượng trong câu bị nhận nhầm thành số thứ tự, mất khỏi hướng dẫn và tạo thêm bước bị đứt.

Bản DOM thu thập trong dự án vẫn giữ đủ số. Parser cũ tái tạo đúng từng bản ghi bị lỗi; parser mới chỉ tách theo nhãn bước đứng riêng trên dòng, theo thứ tự 1, 2, 3… và giữ nguyên các con số trong câu.

Hai trường hợp đã đối chiếu thêm với trang nhà cung cấp:

| Bài | Nội dung xác nhận | Bước đang lưu → bước khôi phục |
| --- | --- | ---: |
| [Band Front Raise](https://musclewiki.com/exercise/band-front-raise) | Có số `2` trong lựa chọn số bàn chân | 3 → 2 |
| [Band Leg Press](https://musclewiki.com/exercise/band-leg-press) | Có khoảng cách `6` đến `12` inch | 4 → 2 |

Đã quét lại toàn bộ 1.946 bài theo cùng bằng chứng: 40 bài phù hợp điều kiện khôi phục chỉ con số và ranh giới bước; không có bản Việt đã duyệt nào thuộc nhóm 40 bài này. Các thay đổi khác như câu lặp hoặc thiếu điểm tựa không được đưa vào gói này.

## File đã chuẩn bị

- [SQL khôi phục và nhập bản dịch](../supabase/repairs/20261023_restore_numeric_exercise_steps.sql).
- [40 bản nguồn trước/sau và bằng chứng DOM](../scripts/localization/data/source-restorations-001.json): có ID, hash, timestamp, đường dẫn bản thu thập, URL nguồn và checksum nội dung.
- [38 bản Việt đã nhập và xác minh](../scripts/localization/data/reviewed-translations-035.json): 118 bước, đối chiếu trên nguồn đã khôi phục. File `prepared-translations-035.json` giữ lại làm bằng chứng chuẩn bị trước khi chạy SQL.
- Công cụ `scripts/localization/verify-source-restoration.mjs`: đã đọc đối soát database và chỉ tạo `reviewed-translations-035.json` sau khi tất cả kiểm tra đạt.

SQL cập nhật `steps` của đúng 40 bài và thêm đúng 38 bản Việt trong một transaction. Gói kiểm tra hash/timestamp trước khi ghi, dừng nếu dữ liệu đã thay đổi hoặc có bản dịch mới của admin. Chạy lại cùng file sẽ bỏ qua dữ liệu đã khớp.

Trigger tự đổi `exercises.updated_at` được tạm ngưng trong transaction và bật lại trước khi commit để giữ thứ tự bài. Các trigger kiểm tra bản dịch và đánh dấu stale vẫn hoạt động. Bước kiểm tra cuối buộc mọi cột bài tập ngoài `steps` phải giữ nguyên; nếu lỗi thì toàn bộ transaction rollback.

Hai bài được khôi phục số nhưng **chưa duyệt bản Việt**:

- `Mini Band Bent Arm Lateral Raise`: bước nâng cả hai khuỷu tay vẫn kết thúc bằng chỉ dẫn luân phiên.
- `Quads Stretch Variation Two`: câu đặt chân trước ở góc 90 độ chưa xác định rõ khớp tạo góc.

## Cách áp dụng

1. Mở SQL Editor của dự án **noi-gym-v2**, project `exhgtcaczbgdqfozwrvg`.
2. Tạo query mới, sao chép **toàn bộ** [file SQL](../supabase/repairs/20261023_restore_numeric_exercise_steps.sql) và nhấn **Run**.
3. Báo lại kết quả để tiếp tục kiểm tra database và giao diện. Kết quả dự kiến: `reviewed_total = 1772`, `reviewed_vi = 1771`, `reviewed_en = 1`.

Kết quả thực tế đã xác minh: **1.772 bản duyệt** gồm 1.771 bản Việt và 1 bản Anh, tổng 5.451 bước dịch. Cộng bài vốn có nguồn Việt: **1.772/1.946 bài có nội dung Việt**, còn 174 bài; cảnh báo tự động giảm từ 45 xuống 5. Tổng bước nguồn từ 6.069 còn 6.022 vì ghép lại các câu bị tách sai, không phải xóa hướng dẫn.

Hash toàn inventory sau khôi phục là `e8174a37ad27434ed2928fe4b4ce6b659537b352ece2ec0f6586a6c38835459c`, khớp chính xác inventory trước đó khi chỉ thay `steps` của 40 ID đã duyệt. Tất cả timestamp, media, category, ID và 1.734 bản dịch cũ giữ nguyên. Vẫn có 291 lượt lưu cá nhân và 289 bài admin ưu tiên. Anonymous đọc đủ 1.772 bản duyệt còn hiệu lực.

Kiểm tra HTTP/SSR trên localhost đạt 80 trường hợp chi tiết (40 bài × hai giới tính): 76 trường hợp dùng bản Việt mới và 4 trường hợp giữ nguồn cho hai bài chưa duyệt; tên, đủ từng bước, link quay về và URL video đúng. 16 trang danh sách giữ cùng ID/thứ tự/URL video giữa Anh/Việt. Hàm đọc admin trả đúng 174 bài thiếu, 1.771 bản Việt đã duyệt, 1 bài gốc Việt; bộ lọc đã duyệt có 71 trang, trang cuối 21 bài. Đây là kiểm tra HTTP và hàm dữ liệu, chưa phải kiểm tra trực quan/phát video bằng trình duyệt.

84/84 kiểm thử đạt sau khi chốt manifest 035. Importer chạy dry-run lại manifest: 38 unchanged, 0 pending writes, không có lỗi. Báo cáo tại `artifacts/localization/stage-8-restoration-after.json`, `stage-8-after.json`, `stage-8-library-pages-audit.json`, `stage-8-detail-pages-audit.json`, `stage-8-admin-coverage-audit.json`. Hàng đợi 174 bài còn lại: `artifacts/localization/stage-8-remaining-source-review-queue.json`.

## Checklist

- [x] Xác định và tái tạo lỗi parser từ bản thu thập gốc.
- [x] Sửa parser, bổ sung hồi quy số lượng/góc/khoảng cách và bước lặp.
- [x] Đối chiếu đủ 40 bản nguồn và chuẩn bị 38 bản Việt; giữ riêng hai câu còn mâu thuẫn.
- [x] Kiểm tra dữ liệu hiện tại bằng truy vấn chỉ đọc trước khi tạo SQL; chưa ghi database.
- [x] Chạy toàn bộ file SQL trên đúng dự án; người dùng xác nhận kết quả 1772/1771/1.
- [x] Kiểm tra hash sau khôi phục, timestamp/thứ tự, media, lượt lưu, quyền đọc công khai và số bản dịch.
- [x] Kiểm tra HTTP/SSR Anh/Việt trên localhost, chốt manifest 035 và cập nhật độ phủ thực tế trong kế hoạch chính.
- [ ] Kiểm tra trực quan và phát video trên trình duyệt/mobile theo checklist nghiệm thu chung.
