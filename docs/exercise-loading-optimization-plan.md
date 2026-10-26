# Kế hoạch tối ưu tải dữ liệu và hiển thị bài tập

Ngày lập: 26/10/2026. Cơ sở: kiểm tra mã nguồn và đo trực tiếp `https://noi-gym.vercel.app`.

Tài liệu này dùng để triển khai từng đợt và đánh dấu khi hoàn thành. Ngày 26/10/2026 đã triển khai các tối ưu dữ liệu, cache, điều hướng và khởi tạo video trong workspace; đã build và đối chiếu HTTP/trình duyệt local. Chưa triển khai hoặc nghiệm thu bản tối ưu trên production Vercel. Các mục `[x]` bổ sung trong đợt này là kết quả local, trừ khi ghi rõ môi trường khác.

## 1. Mục tiêu và phạm vi

- Giảm thời gian từ khi chọn nhóm cơ, dụng cụ hoặc trang đến khi thấy tên và hướng dẫn bài tập.
- Hiển thị phản hồi khi thao tác ngay, ảnh xem trước sớm và video bắt đầu phát nhanh hơn.
- Giữ 5 bài/trang, bộ lọc nam/nữ, Anh/Việt, phân trang và các route hiện tại.
- Giữ thứ tự ưu tiên: admin lưu ưu tiên → tổng lượt yêu thích → thứ tự dụng cụ → ngày cập nhật → tên nguồn.
- Trạng thái yêu thích cá nhân cập nhật ngay và không dùng chung giữa các tài khoản.
- Tất cả video hợp lệ trên trang hiện tại vẫn tự tải và tự phát khi trình duyệt cho phép, không cần cuộn tới từng video.
- Bảo toàn video gốc. Không xóa video, không nhân đôi toàn bộ thư viện R2 và không mặc định phải nâng gói dịch vụ.

Quy ước: `[ ]` chưa làm; `[-]` đang làm; `[x]` đã làm và có bằng chứng kiểm tra. Mỗi đợt ghi kết quả vào nhật ký cuối tài liệu. Chỉ tick công việc đã kiểm chứng; phân biệt hoàn thành local/preview với đã lên production.

## 2. Số đo ban đầu

| Trang, khách chưa đăng nhập | Lần đo đầu nhận được bài tập | Hai lần tải tiếp |
| --- | ---: | ---: |
| `/exercises/chest`, EN | 4,92 giây | 1,02–1,06 giây |
| `/exercises/rear-shoulders/barbell`, EN | 3,11 giây | 0,57–1,06 giây |
| `/exercises/chest?page=2`, EN | 2,70 giây | 1,01–1,11 giây |

- Khung trang thường bắt đầu phản hồi sau khoảng 0,3–0,4 giây; nội dung bài tập đến sau. Cần đo thời điểm có bài thật, không chỉ TTFB.
- Trình duyệt ở viewport mobile: danh sách ngực xuất hiện khoảng 1,4 giây; video đầu phát khoảng 3,5–4 giây trong hai cấu hình thử.
- 5 bài ngực có 10 video 1280×720. Ảnh xem trước khoảng 32 KB; bộ đo trình duyệt ghi nhận khoảng 5,4 MB dữ liệu media, gồm các Range request và phần đọc qua cache trình duyệt. Đây không phải số byte tính phí R2.
- Với cấu hình mô phỏng mạng 4 Mbps, mẫu ở khoảng 6,8 giây có 5/10 video đang chạy; khoảng 11,9 giây có 9/10; mẫu khoảng 16,9 giây có 10/10. Đây là các thời điểm lấy mẫu, không phải thời điểm phát chính xác của video cuối.
- Hai MP4 lấy mẫu đều có metadata `moov` sau `mdat`; chưa kết luận toàn bộ thư viện có cấu trúc này.
- Truy vấn mẫu ngực đọc 222 bài ứng viên, 289 dòng thống kê yêu thích và 282 dòng ưu tiên admin, rồi mới lấy nội dung 5 bài.
- Trang EN vẫn gọi truy vấn bản dịch dù 5 bài mẫu không cần bản dịch EN. Mỗi truy vấn này mất 211–442 ms khi đo từ máy kiểm tra đến Supabase; không phải số đo từ Vercel đến Supabase.

Các lượt trên là mẫu chẩn đoán, chưa đại diện p50/p95 của production. Lần tải đầu chưa được xác nhận cache miss bằng log nội bộ; không quy toàn bộ chênh lệch cho cold start. Header `x-vercel-cache: MISS` của HTML không chứng minh Next Data Cache cũng miss.

Bằng chứng tại `artifacts/performance/`:

- `production-http-20261026.json`: 24 lượt HTTP EN/VI và thời điểm nhận nội dung.
- `production-browser-20261026.json`: thời điểm hiển thị, phát video, request và long task.
- `supabase-phases-20261026.json`: thời gian, số dòng, dung lượng các truy vấn chỉ đọc.
- `mp4-boxes-20261026.json`: cấu trúc hai MP4 qua Range request.

## 3. Tiêu chí nghiệm thu

Đây là mục tiêu cần kiểm chứng, không phải mức cải thiện đã đạt hay cam kết trên mọi mạng. So sánh cùng route, dữ liệu, tài khoản, thiết bị và điều kiện mạng; lấy tối thiểu 20 lượt cho mỗi kịch bản chính dùng để báo cáo p50/p95.

| Chỉ số | Mục tiêu |
| --- | --- |
| Danh sách có dữ liệu trong cache, mạng kiểm tra bình thường | p50 ≤ 0,8 giây; p95 ≤ 1,5 giây |
| Danh sách chưa có dữ liệu trong cache, cùng điều kiện | p50 ≤ 2 giây; p95 ≤ 3 giây |
| Phản hồi thao tác chọn nhóm cơ/trang | Có trạng thái chờ trong khoảng 150 ms, không cần đợi database |
| Ổn định bố cục | CLS ≤ 0,1 trong các kịch bản nghiệm thu |
| Video đầu tiên, cùng điều kiện kiểm tra | Giảm ít nhất 25% so với baseline lặp lại trước khi sửa media |
| Toàn bộ video trang hiện tại | Tự phát đủ khi cho phép autoplay; thời gian video cuối không tăng đáng kể để đổi lấy video đầu nhanh hơn |
| Nội dung và cá nhân hóa | Đúng bài, thứ tự, total, ngôn ngữ và trạng thái yêu thích; không lẫn dữ liệu giữa tài khoản |

Không đặt thời gian tải hết 10 video thấp hơn giới hạn của dung lượng và băng thông. Đo riêng mạng bình thường, mô phỏng 4 Mbps và điện thoại thật.

## 4. Thứ tự triển khai

| Đợt | Ưu tiên | Kết quả cần đạt | Phụ thuộc |
| --- | --- | --- | --- |
| 0. Chuẩn hóa phép đo | P0 | Có baseline tái lập và phân tách từng phần chờ | Đã có khảo sát, cần bổ sung ma trận |
| 1. Cache nội dung và bản dịch | P0 | Trang tải lại không luôn chờ truy vấn bản dịch | Đợt 0 |
| 2. Truy vấn xếp hạng/phân trang | P0 | Giảm số lượt chờ và dữ liệu dư khi mở danh sách mới | Đợt 0; phối hợp cache đợt 1 |
| 3. Yêu thích và phiên đăng nhập | P0/P1 | Lưu cá nhân nhanh, giảm cache bị xóa rộng và chờ xác thực thừa | Đợt 1–2 |
| 4. Hiển thị và điều hướng | P1 | Phản hồi nhanh, không nhảy bố cục, prefetch có giới hạn | Đợt 1; đo cùng đợt 2–3 |
| 5. Video | P1 | Video bắt đầu sớm hơn, vẫn phát đủ, giữ nguồn gốc | Baseline media; không chặn đợt 1–4 |
| 6. Vùng server và CDN | P1, có điều kiện | Giảm độ trễ mạng nếu phép đo xác nhận hiệu quả | Xác minh cấu hình/domain hiện có |
| 7. Triển khai và đối soát | Sau từng đợt | Có số đo production và đường quay lại bản trước | Đợt tương ứng đã qua kiểm tra |

### Đợt 0 — Chuẩn hóa phép đo

- [x] Khảo sát luồng truy vấn, cache, ngôn ngữ, yêu thích và tải media.
- [x] Đo production bằng HTTP và Chromium, truy vấn Supabase riêng, kiểm tra hai MP4.
- [x] Chuẩn hóa script HTTP và Chromium trong `scripts/performance/`: đo bài xuất hiện trong DOM, cơ hội vẽ sau hai frame, ảnh đã decode, video đầu/cuối; đếm request, byte, long task và CLS. Cơ hội vẽ không được gọi là thời điểm compositor vẽ chính xác; số chưa quan sát được giữ `null`.
- [x] Bổ sung log tùy chọn cho `auth.refresh`, `list.read`, `ranking.query`, `content.query`, `translations.read`, `translations.query`; chỉ có tên pha cố định và số millisecond, không có token, cookie, email hoặc dữ liệu truy vấn.
- [-] Đo nhóm cơ thường, nhóm nâng cao/khớp, có/không dụng cụ, trang đầu/tiếp/cuối; đủ EN/VI, nam/nữ, khách/người dùng/admin. Đã có baseline local khách; ma trận đăng nhập và nghiệm thu production còn lại.
- [ ] Tạo cache lạnh có kiểm soát trên preview hoặc namespace thử nghiệm. Không xóa toàn bộ cache production để benchmark; tham số URL ngẫu nhiên không mặc nhiên tạo cache lạnh cho repository.
- [ ] Kiểm tra test baseline, cấu hình vùng Vercel/Supabase và đường truyền trước khi chốt so sánh.

Hoàn thành khi cùng một script đo được trước/sau và có số liệu riêng cho dữ liệu, UI và media. Không dùng build local để kết luận latency production.

### Đợt 1 — Cache nội dung công khai và bản dịch

Phạm vi chính: `lib/exercises/translations.ts`, `lib/exercises/cache.ts`, `lib/exercises/repository.ts`, `app/actions/translations.ts` và các luồng ghi nội dung.

- [x] Đọc cookie ngôn ngữ ngoài hàm cache; truyền `locale`, ID chuẩn hóa và revision nguồn vào hàm đọc dữ liệu công khai. Regression test giữ thứ tự đầu ra và ánh xạ `source-*`/UUID.
- [x] Cache bản dịch reviewed và kết quả rỗng; dùng public client không cookie. Không cache lỗi mạng thành kết quả rỗng hoặc đưa session, client theo tài khoản hay `isSaved` vào cache chung.
- [x] Giữ kiểm tra Published, trạng thái duyệt, `source_hash` và số bước. Hash nguồn được tạo từ văn bản database trước khi bổ sung nội dung local, nên không ghép bản dịch với snapshot nguồn khác phiên bản và không làm mất fallback cũ.
- [x] Giữ đường đọc bản dịch EN cho bài nguồn Việt; cache kết quả EN rỗng thay vì bỏ truy vấn chỉ vì `locale === en`. Có test cho cả hai trường hợp.
- [x] Tách tag nội dung/bản dịch/ứng viên với ưu tiên xếp hạng. Các luồng tạo, sửa, xóa, đổi Published và duyệt bản dịch hết hiệu lực nội dung ngay.
- [x] Thêm endpoint refresh có xác thực và tích hợp `scripts/localization/import-translations.mjs`, kể cả khi batch chỉ ghi được một phần. SQL Editor và các script ghi trực tiếp khác dùng bước refresh thủ công tại mục 8.
- [x] Tất cả cache mới dùng TTL 60 giây. Việc sửa hoặc thu hồi nội dung dùng `{ expire: 0 }`, không chờ TTL hay stale-while-revalidate.
- [-] Regression test local đã kiểm tra EN/VI, nguồn Việt, fallback local, draft/stale, revision đổi và nguồn không Published. Còn nghiệm thu UI/preview và các luồng thu hồi nội dung thực tế sau deploy.

Hoàn thành khi lượt tải có cache không phải gọi Supabase chỉ để lặp lại việc đọc bản dịch; thay đổi nội dung vẫn được phản ánh đúng, dữ liệu riêng của người dùng không đi vào cache chung.

### Đợt 2 — Giảm các truy vấn nối tiếp và phân trang từ database

Phạm vi chính: `lib/exercises/repository.ts`, `lib/exercises/ranking.ts`, `lib/exercises/category-order.ts`; migration/RPC mới nếu cần.

- [x] Cache riêng ứng viên và thống kê ưu tiên; đọc hai cache song song từ ngoài callback cache rồi áp dụng comparator trong JavaScript. Cache ứng viên dùng chung giữa các trang; thống kê ưu tiên dùng chung giữa bộ lọc. Có test mô phỏng Next bỏ qua cache lồng nhau để tránh tối ưu chỉ đúng trong mock.
- [x] Đã đo lại HTTP local trước/sau: 20 mẫu cho từng case chính, kết quả ở mục 10; các lượt lặp đạt mục tiêu local. RPC được để lại vì chưa có bằng chứng cần thiết sau tối ưu nhỏ này. Chưa xác nhận p50 cache lạnh hoặc độ trễ production; không tạo migration/RPC hoặc thay schema.
- [ ] Nếu vẫn chậm, tạo RPC lọc, xếp hạng và lấy trang trong một lượt database; trả đúng trang cùng `total`, kể cả trang rỗng hoặc vượt phạm vi. Giữ đường đọc cũ để chuyển lại khi cần.
- [-] Regression test so sánh comparator hiện tại trên bộ 1.105 bài qua mọi trang; giữ tên nguồn để xếp hạng. Ứng viên được đọc theo ID tăng dần để phân trang ổn định, nên các bài hòa hoàn toàn theo comparator có thứ tự ID xác định thay cho thứ tự database trước đây chưa quy định. Còn đối chiếu snapshot toàn bộ dữ liệu thực tế; số đo HTTP so sánh hash nội dung/thứ tự/media/poster theo các route đã đo.
- [ ] RPC trả dữ liệu công khai qua server: lọc Published, giới hạn page size, tham số hóa bộ lọc. Ưu tiên RPC chỉ cho `service_role`, thu hồi quyền EXECUTE mặc định của PUBLIC/anon/authenticated; không mở rộng RLS bảng ưu tiên hay trả danh sách người đã lưu.
- [x] Thiếu service key dùng đường đọc không cache theo client hiện có; chỉ service client được đếm bảng yêu thích cũ khi bảng aggregate chưa tồn tại. Không dùng phần dữ liệu RLS riêng của một người làm tổng hệ thống. Lỗi đọc tạm thời không bị lưu thành bảng ưu tiên rỗng; đã có test phục hồi ở lượt đọc tiếp.
- [ ] Rút gọn projection công khai sau khi kiểm tra fallback media/poster: `source_snapshot` hiện còn được dùng ở một số đường map, không bỏ ngay.
- [ ] Đọc kế hoạch truy vấn bằng `EXPLAIN` trong môi trường phù hợp; chỉ thêm index khi có bằng chứng. Không mặc định thiếu index là nguyên nhân chính.
- [x] Test local bộ lọc giới tính/dụng cụ/target, total, trang rỗng/vượt phạm vi, không trùng/mất bài, hash nguồn trước fallback local và hơn 1.000 dòng ứng viên/target/thống kê. Đọc đủ từng trang PostgREST; chia `.in()` thành nhóm tối đa 100 ID.

Hoàn thành khi số lượt chờ giảm có số đo, kết quả danh sách tương đương và thời gian trang chưa có cache tiến gần mục tiêu. Với RPC, mục tiêu thường là một lượt lấy danh sách và tối đa một lượt bản dịch khi cache trống.

### Đợt 3 — Yêu thích và xác thực

Phạm vi chính: hai route API yêu thích, `lib/exercises/use-saved-exercise.ts`, `proxy.ts` và luồng kiểm tra quyền phía server.

- [ ] Giữ cập nhật lạc quan của icon và hoàn tác khi API lỗi; dữ liệu cá nhân dùng cache riêng theo phiên hoặc `no-store`, không chia sẻ giữa người dùng.
- [x] Hai API yêu thích gọi invalidation ưu tiên; giữ cache ứng viên, nội dung và bản dịch. ID nội dung được chuẩn hóa nên cùng tập bài có thể dùng lại cache dù thứ tự yêu thích đổi.
- [-] Ưu tiên có TTL 60 giây và dùng stale-while-revalidate khi lưu/bỏ lưu. Comparator chạy ngoài cache nên không có thêm một tầng rank giữ số đếm cũ. Đây là cơ chế refresh theo lượt đọc, không phải cam kết mọi client nhận thứ hạng mới trong đúng 60 giây; còn đo end-to-end sau thao tác thật.
- [-] Giữ nhánh admin cập nhật `admin_featured_exercises` và chuyển sang invalidation ưu tiên. Còn nghiệm thu đăng nhập admin và hai tài khoản trên preview/production.
- [-] Public route `/exercises/` dùng `getSession()` chỉ để làm mới cookie, không dùng identity đó để cấp quyền; API/admin/auth vẫn xác minh bằng `getUser()` và kiểm tra quyền hiện có. Regression test đã kiểm tra phân nhánh và chuyển cookie; còn đo session thật, token hết hạn và Google callback trên preview.
- [ ] Kiểm tra hai tài khoản, khách, đăng xuất/đăng nhập lại, phiên hết hạn, Google callback và thao tác lưu đang chờ.

Hoàn thành khi thao tác lưu không khiến toàn bộ lượt duyệt sau đó quay về luồng chậm, trạng thái cá nhân và tổng xếp hạng cập nhật theo chính sách đã đo, quyền truy cập giữ đúng.

### Đợt 4 — Hiển thị và điều hướng

Phạm vi chính: `components/ExerciseLibraryLoading.tsx`, `ExerciseLibrary.tsx`, `ExercisePagination.tsx`, `BodyProfileMap.tsx`, các route exercises và CSS liên quan.

- [-] Skeleton đã dùng 5 card, bố cục hai ô media và khoảng trống gần card thật; hai mẫu Chromium mobile có CLS 0. Còn kiểm tra desktop và điện thoại thật.
- [-] Thêm phản hồi pending có `aria-busy`/status cho phân trang và chọn nhóm cơ. Test markup đã qua; Chromium local đo phân trang phản hồi 2,6 ms, có card mới sau 39,9 ms. Còn kiểm tra chọn nhóm cơ và thiết bị thật đầy đủ.
- [x] Prefetch theo ý định hover/focus/touch, hủy khi rời mục; debounce 160 ms, tối đa 3 lần/10 giây và không lặp route cùng locale trong 30 giây. Dùng kiểu API Next 16.3 đang cài; có test hủy, giới hạn, hết hạn và đổi ngôn ngữ.
- [x] Code chỉ prefetch route, không mount card/video trang chưa mở. Smoke test focus bàn phím tại local ghi 2 route request và 0 MP4 request; không tải trước video ngoài trang trong kịch bản đã đo.
- [-] Test phân trang giữ locale/filter/canonical URL. Chromium EN→VI tại trang 2 giữ 10/10 node video, cùng URL, 0 sự kiện `loadstart`, 10/10 vẫn phát và giữ trang 2. Còn navigation/back toàn ma trận và điện thoại thật.
- [ ] Đo CLS, long task và cuộn trên điện thoại thật. Chỉ giảm hiệu ứng blur trên vùng video nếu profiling cho thấy lợi ích rõ ràng.

Hoàn thành khi phản hồi thao tác nhanh, danh sách đúng, bố cục ổn định và không tăng tải nền quá mức.

### Đợt 5 — Video bắt đầu nhanh hơn, bảo toàn nguồn

Phạm vi chính: `components/LazyExerciseVideo.tsx`, công cụ kiểm tra/remux media và manifest ánh xạ object khi pilot đạt.

- [ ] Đo riêng ảnh, video đầu và video cuối; khảo sát cấu trúc MP4 của mẫu đại diện nam/nữ, front/side, nhiều kích thước. Không suy rộng từ hai file đã kiểm tra.
- [x] Video có `src`, `preload="auto"`, muted/autoplay ngay trong server markup; bỏ việc phải đợi poster hoặc hydration mới gán nguồn. Hai SSR test xác nhận cả trường hợp có/không poster.
- [-] Giữ poster đến `loadeddata`, hiện lại khi lỗi và giữ autoplay cho mọi video trên trang, không thêm điều kiện viewport. Hai mẫu browser local đều phát 10/10 video, không lỗi; mẫu 4 Mbps có video cuối chậm hơn khoảng 4% dù video đầu nhanh hơn. Cần đo lặp trước khi nghiệm thu đầy đủ media.
- [ ] Nếu thử ưu tiên khởi tạo video nhìn thấy trước, vẫn khởi tạo hết trang tự động và so sánh cả thời gian video cuối; không chấp nhận chỉ video đầu nhanh hơn còn phần lớn video chờ lâu hơn.
- [-] Đã chọn 12 ứng viên pilot từ manifest local, bao gồm nam/nữ, front/side và ba mức kích thước. Chưa kiểm tra cấu trúc của các ứng viên, chưa download/remux/upload. Còn xác nhận clip nào cần faststart và kiểm tra codec/thời lượng/hình/phát/seek.
- [-] Đã kiểm kê manifest cũ: khoảng 7,241 GB video+poster đã biết, pilot 12 clip gốc khoảng 8,68 MB. Đây không phải số sử dụng R2 hiện tại; còn xác nhận dung lượng live trước bất kỳ upload nào. Giữ nguyên video gốc và URL đang dùng.
- [ ] Chỉ mở rộng từng batch sau khi pilot chứng minh lợi ích về phát sớm/request; ghi trạng thái từng object. Faststart không hứa giảm dung lượng hoặc giảm công giải mã.

Hoàn thành pilot khi đủ 10/10 video hợp lệ ở trang kiểm tra tự phát không cần cuộn, chuyển ảnh → video không bị trống, chất lượng không đổi và có cách quay về URL gốc.

### Đợt 6 — Vùng server và CDN, làm riêng khi đủ thông tin

- [ ] Xác nhận vùng function Vercel và vùng Supabase từ cấu hình thực tế. Header đã thấy `hkg1 → iad1`, nhưng chưa xác nhận vùng database.
- [ ] Thử vùng function gần database/người dùng trên preview, đo cả EN/VI, có/không đăng nhập trước khi đổi production; không mặc định một vùng cụ thể sẽ nhanh hơn.
- [ ] Kiểm tra có domain phù hợp để gắn R2 không. `r2.dev` đang phục vụ media; custom domain mở khả năng Cloudflare Cache. Không mặc định phải mua domain hoặc nâng gói.
- [ ] Nếu triển khai CDN, dùng URL/version phù hợp và Cache-Control rõ ràng; kiểm tra Range/206, Content-Type, CORS, seek và cache hit thực tế. Có mapping quay về URL cũ.
- [ ] Đo lại sau từng thay đổi hạ tầng, tách kết quả khỏi các tối ưu mã để biết thay đổi nào có hiệu quả.

Đợt này không chặn việc hoàn tất các tối ưu dữ liệu/app. Nguồn tham khảo: [vùng Vercel Functions](https://vercel.com/docs/functions/configuring-functions/region), [R2 và Cloudflare Cache](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/), [FFmpeg faststart](https://ffmpeg.org/ffmpeg-formats.html#mov_002c-mp4_002c-ismv).

### Đợt 7 — Triển khai, nghiệm thu và quay lại bản trước

- [ ] Mỗi đợt có thay đổi nhỏ, mô tả tác động, bằng chứng kiểm tra chức năng và số đo trước/sau. Đọc tài liệu Next tại `node_modules/next/dist/docs/` trước khi sửa cơ chế cache/router.
- [x] 75 test liên quan đã pass; TypeScript và ESLint phạm vi sửa sạch. Production build local cuối đã thành công, gồm xử lý lỗi aggregate. Toàn bộ suite còn lỗi baseline `reviewed-exercise-content.test.mjs` được ghi tại mục 9, không báo toàn suite xanh.
- [x] Có `EXERCISE_DATA_CACHE_DISABLED=true` để đọc trực tiếp, giữ logic ngôn ngữ/bộ lọc và cơ chế phân trang an toàn. Không có migration, xóa schema hoặc thay đổi media trong đợt này.
- [ ] Kiểm tra preview trước production, bao gồm nguồn sửa, bản dịch bị thu hồi, phân trang, quyền truy cập và yêu thích hai tài khoản.
- [ ] Sau deploy, chạy lại cùng kịch bản production; kiểm tra thêm điện thoại thật và mạng hạn chế. Ghi commit/deployment, thời điểm, cache, thiết bị và tài khoản loại nào, không ghi thông tin nhạy cảm.
- [ ] Nếu sai dữ liệu, quyền truy cập hoặc media: quay lại đợt thay đổi tương ứng. Không gộp rollback app với xóa dữ liệu hoặc xóa video.
- [ ] Chỉ đánh dấu toàn bộ kế hoạch hoàn thành khi những đợt bắt buộc đã đạt tiêu chí trên production; các hạng mục hạ tầng chưa có điều kiện ghi rõ để sau, không tick thay.

## 5. Mốc bàn giao

1. **Mốc A — Danh sách nhanh hơn:** đợt 0–2. Ưu tiên thực hiện trước; báo số đo khi cache có/không có dữ liệu và giữ kết quả xếp hạng đúng.
2. **Mốc B — Thao tác mượt và dữ liệu cá nhân đúng:** đợt 3–4. Kiểm tra ngay sau lưu yêu thích, đổi ngôn ngữ, phân trang và đăng nhập.
3. **Mốc C — Video phát sớm:** đợt 5; đợt 6 thực hiện khi xác nhận đủ điều kiện. Không chờ xử lý toàn bộ thư viện video mới bàn giao mốc A/B.

Đợt 7 áp dụng cho từng mốc. Sau mỗi mốc, cập nhật tài liệu này và ghi rõ phần nào chỉ mới xong local/preview, phần nào đã đo trên production.

## 6. Nhật ký

| Ngày | Hạng mục | Trạng thái | Bằng chứng / phần còn lại |
| --- | --- | --- | --- |
| 26/10/2026 | Khảo sát và lập kế hoạch | Hoàn tất khảo sát ban đầu | Có HTTP/browser/Supabase/MP4 artifacts; chưa sửa mã ứng dụng, database, media hoặc cấu hình hạ tầng. Cần bổ sung phép đo lặp và tài khoản đăng nhập ở đợt 0. |
| 26/10/2026 | Cache dữ liệu, bản dịch và yêu thích | Đã triển khai, test local | Cache ứng viên/ưu tiên/nội dung/bản dịch độc lập, TTL 60 giây; hash nguồn giữ từ database; endpoint refresh và import checkpoint. Chưa triển khai production. |
| 26/10/2026 | UI, prefetch và video | Đã triển khai, có smoke test local | Skeleton 5 card, phản hồi pending, prefetch giới hạn, video tải ngay từ SSR. Hai mẫu phát 10/10, CLS 0; còn đo media lặp, tài khoản và điện thoại thật. |
| 26/10/2026 | Khảo sát pilot media | Chỉ đọc manifest local | `media-pilot-feasibility-local.json`: 12 ứng viên, chưa remux/upload; không thay R2/CDN/vùng server hoặc dữ liệu production. |
| 26/10/2026 | Build và đối chiếu | Build cuối thành công, chưa deploy | 75 test liên quan pass; 14 case route/locale giữ nguyên hash thứ tự/nội dung/media/poster. `local-comparison.json`, `matrix-comparison.json`, `browser-local-comparison.json`, `optimized-local-navigation.json`. |

## 7. Cấu trúc đã triển khai trong workspace

Luồng danh sách hiện tại: đọc ứng viên theo bộ lọc và aggregate ưu tiên song song → áp dụng comparator cũ trong JavaScript → chọn ID của trang → đọc cache nội dung của tập ID → đọc cache bản dịch theo ngôn ngữ và revision nguồn. Lượt chuyển trang dùng lại ứng viên/aggregate; EN/VI dùng lại dữ liệu nguồn. Chỉ nội dung của trang đang xem được hydrate.

Các cache độc lập đều có TTL 60 giây. Không lồng `unstable_cache` ưu tiên trong một cache rank khác: Next 16.3 bỏ qua lượt đọc cache lồng nhau, khiến cách đó không chia sẻ được aggregate như mong đợi. Bước sort nhẹ được tính ngoài callback cache, không cần cache thêm kết quả rank. Không có dữ liệu cá nhân, cookie, session hoặc trạng thái `isSaved` trong cache chung.

| Dữ liệu | Khóa chính | Invalidation |
| --- | --- | --- |
| Ứng viên | Nhóm cơ đã resolve hoặc mode/target, dụng cụ, giới tính; không chứa page | Nội dung thay đổi |
| Ưu tiên | Aggregate toàn bộ công khai | Lưu/bỏ lưu yêu thích, thay ưu tiên admin, nội dung thay đổi |
| Nội dung trang | Tập ID chuẩn hóa và giới tính | Nội dung thay đổi |
| Bản dịch | Locale, UUID/source ID chuẩn hóa, revision nguồn | Nội dung hoặc bản dịch thay đổi |

Source hash dùng văn bản database nguyên bản trước bước bổ sung hướng dẫn/poster local. Khi revision nguồn khác relation của bản dịch, giữ nội dung nguồn thay vì ghép hai phiên bản. Query lỗi không được cache như kết quả rỗng; nguồn không Published, draft/stale và bản dịch hash cũ vẫn bị loại.

`invalidateExerciseContent()` hết hiệu lực ngay cả nội dung, bản dịch, ứng viên và ưu tiên. `invalidateExerciseRanking()` chỉ đánh dấu ưu tiên cần refresh nền, giữ lại nội dung và ứng viên; tag rank cũ cũng được đánh dấu để tương thích các cache trước đây. TTL là lịch revalidation theo lượt đọc, không tự xóa cache đúng giây thứ 60 khi không có request.

Projection vẫn giữ `source_snapshot` để không mất fallback media/poster. RPC, index mới và `EXPLAIN` được để lại đến khi phép đo cho thấy cần thiết. Chưa thay schema, vùng Vercel/Supabase, domain/CDN, nội dung object R2 hoặc URL media.

## 8. Vận hành và refresh sau import/SQL

| Biến môi trường | Giá trị mặc định / vai trò |
| --- | --- |
| `EXERCISE_DATA_CACHE_DISABLED` | `false`; đặt `true` để bỏ qua các cache dữ liệu mới, đọc trực tiếp mà vẫn dịch và giữ bộ lọc |
| `EXERCISE_PERFORMANCE_LOG` | `false`; đặt `true` trên môi trường kiểm tra để ghi tên pha và thời gian, tắt lại khi xong |
| `EXERCISE_CACHE_REVALIDATE_SECRET` | Secret server-only tùy chọn, ít nhất 32 ký tự ngẫu nhiên, không khoảng trắng; cùng giá trị ở app và máy chạy CLI |
| `NEXT_PUBLIC_SITE_URL` | Origin app cần refresh; production dùng HTTPS, local cho phép HTTP `localhost`/loopback |

Không đặt secret dưới tiền tố `NEXT_PUBLIC_`, không gửi trong URL hoặc ghi vào artifact. CLI chỉ gửi tới origin cấu hình này, từ chối credential/path/query/hash trong URL và không theo redirect. Thay biến môi trường trên hosting cần áp dụng lại deployment theo quy trình của môi trường đó.

Sau SQL Editor hoặc script ghi trực tiếp vào exercise, translation, target hay thống kê, chạy:

```powershell
node scripts/cache/refresh-exercise-cache.mjs
```

CLI nạp `.env` theo cấu hình Next. Kết quả cần là `{"status":"refreshed"}`. Nếu chưa cấu hình secret, đăng nhập admin tại đúng origin rồi dùng DevTools Console:

```javascript
await fetch('/api/admin/exercise-cache', { method: 'POST' }).then(response => response.json())
```

Endpoint chỉ nhận POST; yêu cầu cookie admin cùng origin hoặc Bearer secret hợp lệ. Credential Bearer sai không được chuyển sang dùng cookie. Mọi phản hồi dùng `no-store`; lỗi không trả chi tiết provider. Sau refresh, kiểm tra lại bài đã đổi ở cả EN/VI.

`scripts/localization/import-translations.mjs --apply` tự refresh sau khi ghi, kể cả có lỗi ở một dòng phía sau. JSON summary và checkpoint chứa `cacheRefresh`: `refreshed`, `manual_required`, `failed` hoặc `not_required`. Dry-run và import không ghi dòng nào không gửi request refresh. `completedAt` của checkpoint thể hiện hoàn thành phần ghi, không thay thế việc kiểm tra `cacheRefresh`.

- Exit code `1`: import thất bại; các dòng đã ghi vẫn được refresh, kiểm tra checkpoint trước khi chạy lại.
- Exit code `2`: phần ghi hoàn tất nhưng refresh thất bại; sửa cấu hình hoặc kết nối rồi chạy CLI refresh riêng, không cần ghi lại dữ liệu.
- `manual_required`: thiếu origin/secret; phần ghi có thể thành công nhưng cần dùng bước admin refresh ở trên.

Rollback cache: đặt `EXERCISE_DATA_CACHE_DISABLED=true`, khởi động/deploy lại app, kiểm tra cùng route. Cơ chế này chỉ bỏ qua cache dữ liệu mới; để quay lại UI/video hoặc proxy trước đó, revert đúng thay đổi ứng dụng tương ứng. Không rollback bằng cách xóa bản dịch, yêu thích hoặc video.

## 9. Kiểm chứng local và cách đo lại

Đã pass 75 test liên quan: translation repository 13, localization workflows 18, public repository 12, cache/auth security 6, cache refresh/import 11, media SSR 2, pagination 6, prefetch 5, ranking 2. TypeScript `--noEmit --incremental false` và ESLint các file sửa đã sạch. Production build local cuối đã pass sau thay đổi xử lý lỗi aggregate, gồm compile và bước TypeScript của Next.

Smoke test endpoint bằng khách chưa đăng nhập: API yêu thích trả 401 và `private, no-store`; refresh GET trả 405, POST cùng origin chưa có quyền trả 403, Bearer sai trả 401; `/admin` chuyển hướng 307 về login. Đây là kiểm tra local, không thay thế nghiệm thu phiên đăng nhập thật.

Lỗi baseline tại `tests/reviewed-exercise-content.test.mjs` đã được rà soát ngày 26/10: test bỏ sót quyết định xác minh nguồn đúng và giữ nguyên của Reverse Prayer (`source-review-decisions-019.json`). Test đã kiểm tra thêm trạng thái review/xác minh DB, thời gian và hash nguồn chính xác; 6/6 đạt, không thay đổi hướng dẫn hoặc database. Các test tạo subprocess có thể bị sandbox Windows chặn `spawn EPERM`; khi chạy ngoài sandbox theo quyền đã duyệt, suite video-source qua 19/19. Việc chạy test trực tiếp một file bằng Node cũng tránh test worker khi file đó không cần subprocess.

Node dùng để kiểm tra: 20.20.2. Các lệnh dưới đây giả định `node` trên PATH là Node 20 tương thích dự án. Chạy production build local và bảo đảm server đang ở đúng port trước khi đo; giữ nguyên origin, route, tài khoản và điều kiện mạng khi so trước/sau.

```powershell
node scripts/performance/measure-http.mjs --origin http://localhost:3010 --label optimized-local --runs 20 --routes /exercises/chest,/exercises/rear-shoulders/barbell --languages en,vi
node scripts/performance/measure-browser.mjs --origin http://localhost:3010 --label optimized-local --runs 1 --routes /exercises/chest --languages vi --profiles mobile,mobile-4mbps
node scripts/performance/check-navigation.mjs --origin http://localhost:3010 --label optimized-local
node scripts/performance/compare-http.mjs --before artifacts/performance/baseline-local-http.json --after artifacts/performance/optimized-local-http.json --label local-comparison
node scripts/performance/audit-media-inventory.mjs
```

HTTP đo thời điểm nhận article thật trong stream; browser phân biệt DOM, cơ hội vẽ, ảnh và video. `--runs 1` của browser chỉ là smoke test, không đủ báo p50/p95. Tối thiểu 20 mẫu cho mỗi case dùng để báo percentile; không tự gọi lượt đầu là cache lạnh. Script không purge cache production hoặc dùng session đăng nhập lưu sẵn. So sánh HTTP kiểm tra hash thứ tự/nội dung/media/poster, không lưu HTML hay thông tin tài khoản.

Các npm script tương đương: `npm run test:exercise-loading` chạy 75 test liên quan; `npm run performance:http -- <options>` và `npm run performance:browser -- <options>` dùng hai bộ đo; `npm run cache:exercises:refresh` gọi CLI refresh. Lệnh HTTP trên cố định đúng 2 route × 2 ngôn ngữ × 20 lần = 80 lượt như baseline; lệnh browser dùng VI giống mẫu trước/sau.

Baseline hiện có: `baseline-local-http.json` (80 lượt), `baseline-matrix-http.json` (10 case), `baseline-local-browser.json` (2 mẫu). Ma trận local này chưa thay cho kiểm chứng cache lạnh có kiểm soát, signed-in/admin, điện thoại thật hoặc độ trễ từ Vercel tới database. Báo cáo `media-pilot-feasibility-local.json` chỉ đọc manifest lịch sử, không xác nhận dung lượng R2 live.

## 10. Kết quả đối chiếu local ngày 26/10/2026

<!-- LOCAL_MEASUREMENTS_START -->
HTTP production build local, khách chưa đăng nhập, 20 request liên tiếp mỗi case trước và sau. Đo thời điểm nhận đủ card đầu tiên trong stream, đơn vị millisecond; gồm cả lượt đầu, không gán nhãn cache lạnh cho lượt đầu:

| Route / ngôn ngữ | p50 trước | p50 sau | p95 trước | p95 sau |
| --- | ---: | ---: | ---: | ---: |
| `/exercises/chest`, EN | 231,0 | 12,8 | 813,4 | 23,1 |
| `/exercises/chest`, VI | 219,0 | 13,2 | 239,1 | 17,8 |
| `/exercises/rear-shoulders/barbell`, EN | 215,0 | 11,7 | 638,5 | 17,4 |
| `/exercises/rear-shoulders/barbell`, VI | 212,5 | 9,8 | 223,3 | 15,1 |

`local-comparison.json` và `matrix-comparison.json` xác nhận 14 case route/ngôn ngữ có hash thứ tự, nội dung, media và poster trước/sau giống nhau. Bộ chính có 80 lượt mỗi phiên bản; 10 case ma trận bổ sung là mẫu chức năng, không đủ percentile. Hai mẫu route chưa warm (`neck` khoảng 2.763→1.306 ms, `knees` khoảng 2.116→1.429 ms) chỉ có giá trị chẩn đoán, chưa chứng minh p50 cache lạnh.

Browser Chromium mobile tại `/exercises/chest`, VI, mỗi profile có một mẫu trước và một mẫu sau; đơn vị millisecond:

| Profile / chỉ số | Trước | Sau |
| --- | ---: | ---: |
| Mobile — cơ hội vẽ card đầu | 919,6 | 92,7 |
| Mobile — cơ hội vẽ poster đầu | 1.173,3 | 356,6 |
| Mobile — video đầu phát | 1.890,2 | 1.164,0 |
| Mobile — toàn bộ video đang phát | 2.296,7 | 2.058,8 |
| Mobile 4 Mbps — cơ hội vẽ card đầu | 786,6 | 770,1 |
| Mobile 4 Mbps — video đầu phát | 4.410,2 | 2.410,3 |
| Mobile 4 Mbps — toàn bộ video đang phát | 9.971,2 | 10.376,8 |

Cả hai profile đều phát 10/10 video không cần cuộn, CLS 0 và không có lỗi được ghi nhận. Mẫu mạng 4 Mbps có video cuối chậm hơn khoảng 4,1%; cần lặp lại trước khi kết luận phần media đạt tiêu chí. Bằng chứng: `browser-local-comparison.json`, `baseline-local-browser.json`, `optimized-local-browser.json`. Đây không phải percentile hoặc số đo production.

`optimized-local-navigation.json` đã pass: focus bàn phím tạo 2 route request, 0 MP4 request; pending sau 2,6 ms, card trang 2 sau 39,9 ms. Đổi EN→VI giữ trang 2, dùng lại 10/10 node video với cùng nguồn, không có `loadstart` mới và cả 10 video tiếp tục phát. Không có lỗi JavaScript trong mẫu.
<!-- LOCAL_MEASUREMENTS_END -->

Còn lại trước khi đóng kế hoạch: nghiệm thu preview/production; kiểm tra hai tài khoản, admin, token hết hạn và Google callback; điện thoại thật/CLS/cuộn; cache lạnh có kiểm soát và phép đo video lặp. Pilot faststart, live R2 usage, vùng server và CDN vẫn là phần riêng chưa triển khai. Không dùng độ trễ localhost để dự báo trực tiếp độ trễ người dùng trên Vercel.

## 11. Triển khai và đối chiếu production

Baseline ngày 26/10/2026 trước deploy: commit `363dd58ef0988210be209ec4863f005216fb5d4f`, deployment Vercel `43WA6WFpv52qtXWig2qtqPYhX5JA`. Đã chạy 80 lượt HTTP chính (20 mỗi case), 10 lượt ma trận và 4 mẫu browser ẩn danh. Không purge cache production. Tất cả HTTP 200; thứ tự, nội dung, URL video và poster khớp 14 case local.

| Route / ngôn ngữ | p50 trước (ms) | p95 trước (ms) |
| --- | ---: | ---: |
| Chest EN | 623,9 | 1266,7 |
| Chest VI | 570,0 | 1025,9 |
| Rear shoulders/barbell EN | 567,3 | 985,1 |
| Rear shoulders/barbell VI | 569,1 | 600,7 |

Lượt đầu Chest EN 6,17 giây, chưa gán là cache lạnh. Mobile bình thường đủ 10 video sau 2,62–2,67 giây; mạng 4 Mbps/CPU ×4 sau 8,77–10,03 giây. Bốn mẫu đều CLS 0 và không lỗi JS/video. Chỉ so sánh với lần đo production sau deploy cùng script và điều kiện.

Bằng chứng local: `artifacts/performance/production-before-summary-20261026.md`, `production-before-20261026-http.json`, `production-before-matrix-20261026-http.json`, `production-before-20261026-browser.json`. GitHub báo deployment hiện tại thành công; header request chỉ xác nhận vùng hkg1→iad1, không tự xác định deployment.

- [x] Baseline production hoàn tất trước khi thay đổi deployment.
- [x] Rà soát release: không cần migration/RPC hoặc biến môi trường mới để chạy bản tối ưu.
- [x] Sau sửa test baseline, chạy toàn bộ 21 file test: **151/151 pass**, không skip; Node 20.20.2. Log `full-suite-20261026.tap` và summary tương ứng trong artifacts/performance.
- [ ] Deploy nhánh Preview và kiểm tra đúng commit.
- [ ] Nghiệm thu Preview, gồm dữ liệu, video, điều hướng và quyền truy cập.
- [ ] Cập nhật production, đo lại và đối chiếu baseline.

Lưu ý Preview: `NEXT_PUBLIC_SITE_URL` phải đúng origin nếu nghiệm thu OAuth trên Preview, và Supabase cần cho phép redirect tương ứng. Không đổi cấu hình OAuth chỉ để vượt bảo vệ Preview; nếu chưa đủ phiên/tài khoản thì ghi rõ phần chưa kiểm chứng. Endpoint refresh qua CLI là tùy chọn, có thể dùng phiên admin cùng origin.
