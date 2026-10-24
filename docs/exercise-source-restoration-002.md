# Sửa hướng dẫn theo video — đợt 2

Trạng thái: **đã áp dụng SQL và đối soát database thành công ngày 23/10/2026** trên dự án **noi-gym-v2** (`exhgtcaczbgdqfozwrvg`). Đã sửa hướng dẫn Anh của 12 bài admin ưu tiên và thêm 12 bản Việt, tổng 37 bước dịch.

Các số liệu bên dưới là kết quả tại thời điểm đợt 2. Hai gói tiếp theo đã sửa nhãn độ khó và thêm tám bản Việt; trạng thái mới nhất nằm tại [báo cáo đợt tiếp](exercise-source-restoration-003.md) và [kế hoạch chung](english-vietnamese-localization-plan.md).

## Kết quả

- **1.784/1.946 bài có nội dung Việt**, còn **162 bài** cần xác minh nguồn.
- 1.784 bản dịch duyệt còn hiệu lực: **1.783 Việt + 1 Anh**, tổng **5.488 bước**.
- **289/289 bài admin ưu tiên có nội dung Việt**; Smith Machine đạt **34/34**.
- `Cable Standing Incline Chest Fly` đã có ba bước Anh/Việt; toàn bộ 1.946 nguồn hiện có hướng dẫn, nhưng 162 bài còn lại vẫn cần xác minh ý nghĩa trước khi dịch.
- Nội dung Việt phủ 1.564 bài có media nam và 1.771 bài có media nữ, tính cả phần giao nhau.
- Cảnh báo tự động giảm 5 → 4; đây không phải tổng số lỗi ngữ nghĩa còn lại.

## Bằng chứng và phạm vi biên tập

Đã trích và đọc sáu khung hình theo thời gian của mỗi video nam/nữ, góc trước/bên: **48 clip, 288 khung hình**. Hai clip Smith nam thiếu thời lượng trong database, nên đọc thời lượng thực tế từ file video; bộ ảnh của hai clip này thể hiện sáu giây đầu. Manifest ghi riêng thời lượng và khoảng lấy mẫu, không coi các khung hình này là toàn bộ clip.

Các trang nguồn đọc được vẫn có lỗi tương tự bản đang lưu. Đây là **biên tập hướng dẫn dựa trên video nguồn**, không phải tuyên bố nhà cung cấp đã sửa văn bản. Bài Cable chưa có văn bản và trang nguồn chưa đọc được; ba bước được viết từ các hành động quan sát được trong cả bốn video, không gọi là khôi phục nguyên văn. Không thêm mức tạ, số hiệp/lần, góc ghế hoặc góc ròng rọc không có bằng chứng.

| Bài | Nội dung được làm rõ |
| --- | --- |
| Kettlebell Farmers March | Một tạ ấm mỗi tay; sửa câu ghi hai tạ trong mỗi tay. |
| Kettlebell Single Arm Farmers March | Giữ tạ cùng một bên, nâng gối luân phiên hướng về ngang hông; sửa mốc “gối lên ngang gối”. |
| Dumbbell Alternating Reverse Lunge | Khi chân trái bước ra sau, đùi phải ở phía trước mới là đùi hạ gần ngang sàn. |
| Cable Standing Incline Chest Fly | Hai tay nắm, cáp thấp hơn vai, chân trước/sau, đưa tay lên và vào trong rồi mở lại có kiểm soát. |
| Kettlebell Farmers Carry | Một tạ ấm mỗi tay, giữ phần hướng dẫn đi bộ. |
| Machine Assisted Narrow Pull Up | Tay nắm phía trong ở trên đầu, đầu gối trên đệm hỗ trợ; mốc kéo lên theo tay nắm. |
| Smith Machine Split Squat | Đầu gối sau gập khi hạ người, không đồng thời giữ chân sau thẳng. |
| Dumbbell Single Arm Step Up | Tạ đơn giữ bên người; sửa câu nhắc thanh tạ đòn trên vai. |
| Dumbbell Sumo Squat | Một tạ đơn cầm bằng hai tay ở giữa hai chân, giữ tạ khi hạ và đứng lên. |
| Dumbbell Single Arm Incline Chest Press | Ghế dốc lên, một tay đẩy tạ đơn; thay block hướng dẫn ghế phẳng/tạ đòn bị chép nhầm. |
| Dumbbell Waiters Bow | **Giữ thanh đòn cố định làm điểm tựa đùi**, bổ sung tạ đơn ở hai tay; không thay nhầm thanh đòn thành tạ đơn. |
| Barbell Supinated Pendlay Row | Giữ kiểu nắm ngửa trong cả lượt kéo/hạ; bỏ chỉ dẫn xoay kiểu nắm khi đang nâng thanh. |

Ví dụ nguồn đã đối chiếu: [Farmers March](https://musclewiki.com/exercise/kettlebell-farmers-march), [Single Arm Step Up](https://musclewiki.com/exercise/dumbbell-single-arm-step-up), [Supinated Pendlay Row](https://musclewiki.com/exercise/barbell-supinated-pendlay-row). Trang Cable và Waiters Bow chưa đọc được qua công cụ web; dùng video gắn với đúng ID/source URL đã thu thập.

## File và kiểm tra

- [Quyết định biên tập từng bài](../scripts/localization/data/source-review-decisions-002.json).
- [Nguồn trước/sau và bằng chứng](../scripts/localization/data/source-restorations-002.json): source ID/URL, hash trước/sau, timestamp, URL/storage path/checksum của 48 clip, khoảng lấy mẫu và checksum ảnh đối chiếu.
- [12 bản Việt đã nhập và xác minh](../scripts/localization/data/reviewed-translations-036.json). Bản `prepared-translations-036.json` giữ làm bằng chứng chuẩn bị.
- [Transaction SQL đã chạy](../supabase/repairs/20261023_correct_featured_exercise_instructions.sql): chỉ cập nhật `steps` của 12 ID và thêm 12 bản dịch, giữ timestamp xếp hạng, media, category và mọi trường khác.

Đã đối soát toàn inventory với snapshot trước sửa. Hash mới `c85fba7bcc50f328caa03845d35695238add1ae770f16a18a32eb30637290f26` khớp chính xác khi chỉ thay 12 block hướng dẫn được duyệt. **1.772 bản dịch cũ giữ nguyên**, không có draft/stale; anonymous đọc đúng 1.784 bản duyệt. Vẫn **291 lượt lưu cá nhân và 289 bài admin ưu tiên**.

HTTP/SSR đạt **24 trường hợp chi tiết** (12 bài × hai giới tính, đối chiếu cả Anh/Việt) và **16 trang danh sách**: tên, từng bước, link quay về, ID/thứ tự và URL video đúng. Một request trên phiên dev ban đầu trả 500 với lỗi đọc JSON; tải lại rồi chạy lại toàn bộ audit đạt. Hàm dữ liệu admin trả đúng 162 thiếu/1.783 duyệt/1 gốc Việt; bộ lọc đã duyệt có 72 trang, trang cuối 8 bài.

Đã kiểm tra trực tiếp trang Cable trên localhost:3001: ban đầu Server Action đổi cờ báo lỗi ở phiên dev; sau tải lại, các lượt VI → EN → VI → EN → VI đạt. Hai video R2 có `readyState = 4`, `paused = false`, thời gian phát tiến triển và URL không đổi giữa hai ngôn ngữ. Không sửa runtime hoặc khởi động lại server để đạt kết quả này. Việc kiểm tra trực quan của đợt này giới hạn ở bài mẫu, chưa thay thế nghiệm thu toàn bộ mobile/desktop.

Báo cáo trong `artifacts/localization/`: `stage-9-restoration-after.json`, `stage-9-after.json`, `stage-9-library-pages-audit.json`, `stage-9-detail-pages-audit.json`, `stage-9-admin-coverage-audit.json`, `stage-9-browser-guide-audit.json`. Hàng đợi hiện tại: `stage-9-remaining-source-review-queue.json`, gồm 162 bài với ID, hash/steps và lý do cần xác minh. Ảnh kết quả: `stage-9-supabase-result.jpg`, `stage-9-cable-guide-vi.jpg`.

## Checklist

- [x] Chọn đúng 12 bài admin ưu tiên còn thiếu bản Việt và chụp snapshot trước sửa.
- [x] Đọc bốn góc/giới tính của từng bài, ghi rõ quan sát và phần biên tập.
- [x] Chuẩn bị nguồn sửa và 12 bản Việt/37 bước, giữ riêng bản trước sửa.
- [x] 89/89 kiểm thử và lint gói sửa đạt trước khi áp dụng; chạy lại đạt sau khi chốt manifest 036.
- [x] Chạy SQL trên đúng project, giữ RLS và các trigger kiểm tra bản dịch.
- [x] Đối soát hash toàn inventory, timestamp, media, bản dịch cũ, quyền đọc công khai và lượt lưu.
- [x] Chốt manifest 036, kiểm tra SSR và hàm dữ liệu admin.
- [x] Kiểm tra mẫu trực tiếp: đổi Anh/Việt, đủ hướng dẫn, video vẫn phát; lưu ảnh kết quả.
- [x] Cập nhật kế hoạch chính và hàng đợi 162 bài còn lại.
