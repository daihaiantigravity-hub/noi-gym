# Kế hoạch đăng nhập Google và yêu thích bài tập theo người dùng

Tài liệu này là checklist triển khai chính cho tính năng đăng nhập Google, danh sách bài tập yêu thích cá nhân và xếp hạng bài tập theo mức độ yêu thích của cộng đồng.

## Quy ước cập nhật

- `[ ]`: chưa thực hiện.
- `[-]`: đang thực hiện hoặc đang chờ cấu hình bên ngoài.
- `[x]`: đã hoàn thành và đã kiểm tra.
- Chỉ đánh dấu `[x]` khi thay đổi đã được kiểm tra theo tiêu chí của bước đó.
- Sau mỗi giai đoạn, cập nhật bảng trạng thái và nhật ký ở cuối tài liệu.
- Không ghi Client Secret, service role key hoặc token vào tài liệu hay Git.

## Mục tiêu hoàn thành

- Người chưa đăng nhập vẫn xem được danh sách bài tập và thứ tự phổ biến của cộng đồng.
- Người dùng đăng nhập bằng Google qua Supabase Auth.
- Icon hồ sơ cố định ở `app/page.tsx` được thay bằng icon đăng nhập khi chưa có phiên.
- Sau đăng nhập, góc phải hiển thị ảnh Google, kèm menu tài khoản và đăng xuất.
- Mỗi người chỉ đọc, lưu và xóa danh sách yêu thích của chính mình.
- Số lượt yêu thích được tổng hợp mà không công khai danh tính người đã lưu.
- Bài tập được xếp ưu tiên theo lựa chọn quản trị và tổng lượt yêu thích, có thứ tự ổn định khi phân trang.
- Tài khoản thông thường không có quyền truy cập khu vực admin.
- Luồng đăng nhập bằng mật khẩu và khôi phục mật khẩu của admin tiếp tục hoạt động.

## Quy tắc nghiệp vụ mặc định

- Người chưa đăng nhập bấm icon lưu sẽ được chuyển sang Google, sau đó quay lại đúng trang.
- Ý định lưu đang chờ sẽ được hoàn tất sau khi đăng nhập thành công.
- Mỗi cặp `user_id + exercise_id` chỉ được tính một lượt yêu thích.
- Thứ tự đề xuất mặc định:
  1. Bài được quản trị đánh dấu nổi bật.
  2. Tổng lượt yêu thích giảm dần.
  3. Thứ tự category hiện tại.
  4. Ngày cập nhật giảm dần.
  5. Tên bài tập tăng dần.
- Lượt yêu thích cá nhân của admin vẫn chỉ tính là một lượt. Trạng thái quản trị đề xuất được lưu riêng.
- Chỉ sử dụng scope Google `openid`, `email` và `profile`.

## Trạng thái tổng quan

| Giai đoạn | Nội dung | Trạng thái |
| --- | --- | --- |
| 0 | Khảo sát hiện trạng | Hoàn thành |
| 1 | Cấu hình Google và Supabase | Đang thực hiện — OAuth E2E đã đạt, chờ deploy trang pháp lý và xuất bản Audience |
| 2 | Nền tảng session và OAuth callback | Hoàn thành |
| 3 | Icon đăng nhập, avatar và menu tài khoản | Hoàn thành trên desktop; chờ kiểm tra mobile |
| 4 | API yêu thích cho người dùng | Đã triển khai |
| 5 | Đồng bộ yêu thích ở giao diện | Đã triển khai — chờ kiểm thử luồng lưu đang chờ |
| 6 | Trang danh sách yêu thích cá nhân | Hoàn thành |
| 7 | Tổng hợp lượt yêu thích và đề xuất của admin | Hoàn thành |
| 8 | Xếp hạng danh sách công khai | Hoàn thành |
| 9 | Kiểm thử, build và triển khai | Đang thực hiện |

## Giai đoạn 0 — Khảo sát hiện trạng

- [x] Xác định icon hồ sơ cố định tại `app/page.tsx`.
- [x] Xác nhận dự án đã dùng Supabase Auth với session cookie phía server.
- [x] Xác nhận đăng nhập mật khẩu hiện chỉ chấp nhận tài khoản admin.
- [x] Xác nhận callback hiện tại đang chuyển thành công đến `/auth/reset-password`.
- [x] Xác nhận bảng `user_favorite_exercises` đã có khóa chính `(user_id, exercise_id)`.
- [x] Xác nhận RLS chỉ cho người dùng đọc, thêm và xóa dữ liệu của chính mình.
- [x] Xác nhận API và hook yêu thích hiện đang phụ thuộc `/api/admin/favorite-exercises`.
- [x] Xác nhận thứ tự công khai hiện dựa trên lượt lưu gần nhất, chưa dựa trên tổng lượt yêu thích.
- [x] Xác nhận `proxy.ts` hiện chỉ làm mới session cho `/admin` và `/auth`.

Tiêu chí hoàn thành: các điểm cần thay đổi đã được định vị và không cần tạo lại bảng yêu thích hiện có.

## Giai đoạn 1 — Cấu hình Google và Supabase

### 1.1 Google Auth Platform

- [x] Cấu hình Branding với tên Noi Gym, website, chính sách quyền riêng tư, điều khoản và authorized domain.
- [-] Cấu hình Audience; ứng dụng đang ở chế độ Testing và cần hoàn tất đăng nhập E2E trước khi Publish.
- [x] Xác nhận Data Access chỉ có `openid`, email và profile.
- [x] Tạo OAuth Client loại **Web application**.
- [x] Thêm Authorized JavaScript origins:
  - `http://localhost:3001`
  - `https://noi-gym.vercel.app`
- [x] Thêm Authorized redirect URI do Supabase cung cấp:
  - `https://exhgtcaczbgdqfozwrvg.supabase.co/auth/v1/callback`
- [x] Lưu Client ID và Client Secret vào Supabase Dashboard, không lưu trong repository.

### 1.2 Supabase Auth

- [x] Bật Google provider trong Supabase Auth Providers.
- [x] Nhập đúng Google Client ID và Client Secret; đã kiểm tra luồng OAuth đi tới màn hình chọn tài khoản Google.
- [x] Đặt production Site URL là `https://noi-gym.vercel.app`.
- [x] Thêm Redirect URL `http://localhost:3001/auth/google/callback`.
- [x] Thêm Redirect URL `https://noi-gym.vercel.app/auth/google/callback`.
- [ ] Nếu dùng Vercel Preview, thêm mẫu URL preview với phạm vi phù hợp.
- [x] Kiểm tra email admin hiện có được liên kết đúng khi đăng nhập Google bằng cùng email; session trả `isAdmin: true` và mở được `/admin/exercises`.

Tiêu chí hoàn thành: Google trả người dùng qua Supabase và Supabase chấp nhận callback của localhost lẫn production.

## Giai đoạn 2 — Nền tảng session và OAuth callback

- [x] Đọc lại hướng dẫn Auth, Route Handler, cookie và Proxy trong phiên bản Next.js đang cài trước khi sửa code.
- [x] Tạo `/api/auth/session` để đọc session và đăng xuất qua cookie server; không đưa access token vào component.
- [x] Tạo route bắt đầu OAuth `app/auth/google/route.ts` và callback riêng `app/auth/google/callback/route.ts`.
- [x] Đổi authorization code thành session bằng `exchangeCodeForSession`.
- [x] Chỉ chấp nhận tham số `next` là đường dẫn nội bộ bắt đầu bằng `/`.
- [x] Xử lý callback lỗi hoặc người dùng hủy đăng nhập bằng thông báo rõ ràng.
- [x] Giữ nguyên callback và luồng khôi phục mật khẩu admin hiện tại.
- [x] Thêm helper lấy người dùng hiện tại, tách khỏi `getAdminUser()` và `requireAdmin()`.
- [x] Mở rộng matcher trong `proxy.ts` cho các trang công khai cần làm mới session.
- [x] Chỉ đưa các route cần session vào matcher, không bắt static assets và media.
- [x] Xác nhận role admin vẫn được kiểm tra phía server bằng `app_metadata` hoặc danh sách email cấu hình.

Tiêu chí hoàn thành: phiên Google tồn tại sau refresh, callback không tạo open redirect và người dùng thường không được nâng quyền admin.

## Giai đoạn 3 — Icon đăng nhập, avatar và menu tài khoản

- [x] Tạo component `UserAuthButton` dùng chung.
- [x] Thay emoji hồ sơ tại `app/page.tsx` bằng component mới.
- [x] Hiển thị icon login khi chưa đăng nhập.
- [x] Thêm nhãn truy cập và tooltip “Đăng nhập bằng Google”.
- [x] Khóa thao tác và hiển thị trạng thái chờ trong lúc bắt đầu OAuth.
- [x] Sau đăng nhập, ưu tiên `avatar_url` hoặc `picture` từ Google metadata.
- [x] Thêm avatar fallback bằng chữ cái đầu nếu ảnh thiếu hoặc tải lỗi.
- [x] Render trực tiếp URL ảnh Google nhỏ với `referrerPolicy=no-referrer`, không cần mở hostname động trong `next/image`.
- [x] Thêm menu gồm tên, email, “Bài tập đã lưu”, liên kết admin khi có quyền và “Đăng xuất”.
- [x] Khi đăng xuất, xóa trạng thái yêu thích trong bộ nhớ client.
- [ ] Kiểm tra kích thước vùng bấm và bố cục trên mobile.

Tiêu chí hoàn thành: icon phản ánh đúng phiên đăng nhập, avatar không làm xê dịch header và thao tác được bằng bàn phím.

## Giai đoạn 4 — API yêu thích cho người dùng

- [x] Tạo endpoint người dùng tại `app/api/favorite-exercises/route.ts`.
- [x] `GET` trả danh sách exercise key của người hiện tại.
- [x] `PUT` lưu một bài tập Published cho người hiện tại.
- [x] `DELETE` bỏ lưu bài tập của người hiện tại.
- [x] Trả `401` nhất quán khi chưa đăng nhập.
- [x] Không nhận `user_id` từ request body.
- [x] Dùng Supabase client mang session người dùng để RLS được thực thi.
- [x] Tái sử dụng logic ánh xạ UUID và `source-*` thay vì sao chép không kiểm soát.
- [x] Giữ thao tác idempotent: lưu trùng không tạo thêm bản ghi.
- [x] Revalidate cache danh sách công khai sau khi lưu hoặc bỏ lưu.
- [x] Giữ API admin hoạt động và chuyển API này sang quản lý danh sách admin featured.

Tiêu chí hoàn thành: hai tài khoản khác nhau có danh sách riêng và không thể sửa dữ liệu của nhau.

## Giai đoạn 5 — Đồng bộ yêu thích ở giao diện

- [x] Chuyển `useSavedExercise` từ API admin sang API người dùng.
- [x] Nạp danh sách yêu thích một lần cho mỗi session, không gọi lại trên từng card.
- [x] Gắn snapshot cache phía client với ID người dùng hiện tại.
- [x] Reset cache khi đăng xuất; đăng nhập và đổi tài khoản đi qua full OAuth navigation nên tạo snapshot mới.
- [x] Giữ optimistic update và hoàn tác khi request thất bại.
- [x] Ngăn nhiều request khi người dùng bấm liên tục.
- [x] Khi chưa đăng nhập, lưu URL quay lại và exercise key đang chờ trong `sessionStorage`.
- [x] Sau callback thành công, hoàn tất một lần thao tác lưu đang chờ.
- [x] Xóa thao tác đang chờ sau khi thành công hoặc hết hạn sau 15 phút.
- [x] Hiển thị lỗi ngắn gọn, đúng tiếng Việt và không dùng thông báo “tài khoản quản trị”.

Tiêu chí hoàn thành: trạng thái icon lưu nhất quán trên các card, trang chi tiết và sau khi đăng nhập lại.

## Giai đoạn 6 — Trang danh sách yêu thích cá nhân

- [x] Tạo route `/favorites`.
- [x] Bảo vệ route bằng session người dùng; chưa đăng nhập thì chuyển sang Google với `next=/favorites`.
- [x] Truy vấn bài tập đã lưu của người hiện tại theo `created_at DESC`.
- [x] Hiển thị poster xem trước và không preload video trên trang bộ sưu tập để tránh tăng tải.
- [x] Cho phép bỏ lưu ngay trên trang.
- [x] Thêm empty state và nút quay về thư viện bài tập.
- [x] Thêm liên kết từ menu avatar.
- [x] Phân trang 12 bài mỗi trang; đã kiểm tra 289 bài chỉ render 12 card và có nút trang kế tiếp.

Tiêu chí hoàn thành: người dùng có thể xem và quản lý toàn bộ bài tập đã lưu của chính họ.

## Giai đoạn 7 — Tổng hợp lượt yêu thích và đề xuất của admin

### 7.1 Thống kê cộng đồng

- [x] Tạo migration cho `exercise_favorite_stats`.
- [x] Dùng `exercise_id` làm khóa chính và khóa ngoại đến `exercises`.
- [x] Thêm `favorite_count` không âm và `updated_at`.
- [x] Tạo trigger tăng số đếm sau khi thêm yêu thích.
- [x] Tạo trigger giảm số đếm sau khi xóa yêu thích.
- [x] Bảo đảm trigger chạy trong cùng transaction với thao tác yêu thích.
- [x] Backfill số đếm từ toàn bộ dữ liệu `user_favorite_exercises` hiện có.
- [x] Thêm hàm `reconcile_exercise_favorite_stats()` để đối soát và sửa số đếm khi cần.
- [x] Chỉ cho phía công khai đọc dữ liệu tổng hợp; không công khai user ID hoặc email.

### 7.2 Quản trị đề xuất

- [x] Tạo bảng `admin_featured_exercises`.
- [x] Chỉ admin được thêm và xóa bài đề xuất qua API dùng service role sau kiểm tra `requireAdmin()`.
- [x] Chuyển 289 trạng thái ưu tiên admin hiện có sang cấu trúc mới.
- [x] Trang admin quản lý `admin_featured_exercises`; thao tác lưu bằng tài khoản admin cập nhật cả yêu thích cá nhân và featured.
- [x] Xác nhận một lượt yêu thích của admin chỉ cộng một vào thống kê cộng đồng.

Tiêu chí hoàn thành: số lượt yêu thích được cập nhật tự động và quyền đề xuất của admin không làm sai ý nghĩa dữ liệu cộng đồng.

## Giai đoạn 8 — Xếp hạng danh sách công khai

- [x] Thay logic `favoriteRanks` theo thời điểm lưu bằng tổng `favorite_count`.
- [x] Kết hợp trạng thái admin featured theo quy tắc nghiệp vụ đã chọn.
- [x] Áp dụng thứ tự mới cho mọi nhánh truy vấn nhóm cơ và target hiện có.
- [x] Giữ thứ tự ổn định bằng category, ngày cập nhật và tên.
- [x] Áp dụng thứ tự trước khi cắt trang để phân trang không bị sai.
- [x] Không tải danh sách user ID về trình duyệt để tính thứ tự.
- [x] Giữ cache server cho dữ liệu xếp hạng dùng chung.
- [x] Revalidate đúng cache tag khi yêu thích hoặc featured thay đổi.
- [x] Danh sách xếp hạng được tạo ở server và dùng chung cho anonymous lẫn người đã đăng nhập.
- [x] Giữ sort trong Node cho quy mô hiện tại; đã cô lập comparator để có thể chuyển sang SQL/RPC khi danh mục tăng lớn.

Tiêu chí hoàn thành: bài nhiều lượt yêu thích hơn đứng trước bài ít lượt trong cùng tầng ưu tiên và cùng bộ lọc.

## Giai đoạn 9 — Kiểm thử, build và triển khai

### 9.1 Kiểm thử chức năng

- [x] Anonymous xem được thư viện và thứ tự cộng đồng; HTTP kiểm tra trả `200`.
- [ ] Anonymous bấm lưu, đăng nhập Google và quay lại đúng trang.
- [x] Avatar Google xuất hiện, menu hiển thị đúng tên/email và session tồn tại sau OAuth callback.
- [ ] Người dùng đăng xuất thành công và cache cá nhân được xóa.
- [ ] User A không đọc hoặc thay đổi favorites của User B.
- [ ] Tài khoản thường bị từ chối ở `/admin`.
- [x] Tài khoản admin đăng nhập Google vẫn được nhận diện đúng quyền; đã mở được `/admin/exercises` và tải 1.946 bài tập.
- [x] Lưu trùng không làm tăng count hai lần nhờ khóa chính `(user_id, exercise_id)` và upsert `ignoreDuplicates`.
- [ ] Bỏ lưu giảm đúng một count và không xuống dưới 0.
- [ ] OAuth bị hủy hoặc callback lỗi không làm hỏng session hiện có.
- [ ] Luồng đăng nhập mật khẩu và khôi phục mật khẩu admin không bị ảnh hưởng.

### 9.2 Kiểm thử danh sách và hiệu năng

- [x] Xếp hạng đúng với dữ liệu mẫu có featured và nhiều mức favorite count.
- [x] Mọi truy vấn lọc giới tính, nhóm cơ, dụng cụ và target dùng chung comparator mới.
- [x] Chuyển trang áp dụng sau khi sắp xếp; test phân trang hiện có đạt.
- [x] Không phát sinh request favorites riêng cho từng exercise card; hook dùng một promise và snapshot module dùng chung.
- [ ] Scroll danh sách không chậm thêm đáng kể.
- [x] Ảnh preview và video vẫn xuất hiện trong kiểm tra giao diện local.
- [ ] Giao diện avatar, menu và icon lưu hoạt động trên mobile.

### 9.3 Kiểm tra mã nguồn và rollout

- [x] Chạy lint bằng Node 20: không có lỗi; còn cảnh báo unused cũ trong `app/page.tsx`.
- [x] Chạy TypeScript `tsc --noEmit`.
- [x] Chạy test redirect OAuth, ranking, pagination và health background: 17 test đạt.
- [x] Chạy production build Next.js 16.3.1 thành công.
- [x] Review migration và chạy trên dự án Supabase `noi-gym-v2` đang Healthy.
- [x] Áp dụng migration production và đối soát `289 favorite_rows = 289 aggregate_total = 289 featured_exercises`.
- [ ] Kiểm tra cấu hình Google/Supabase production lần cuối.
- [ ] Deploy Vercel.
- [ ] Smoke test trên `https://noi-gym.vercel.app`.
- [ ] Theo dõi lỗi Auth, lỗi API và số đếm favorites sau deploy.

Tiêu chí hoàn thành: toàn bộ trường hợp chính đạt yêu cầu trên localhost và production, không có lỗi build hoặc lỗi phân quyền.

## Các file dự kiến thay đổi hoặc tạo mới

- `app/page.tsx`
- `app/auth/google/callback/route.ts`
- `app/auth/google/route.ts`
- `app/api/auth/session/route.ts`
- `app/api/favorite-exercises/route.ts`
- `app/favorites/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `components/auth/UserAuthButton.tsx`
- `lib/auth/redirect.ts`
- `lib/user-auth.ts`
- `lib/admin-auth.ts` hoặc helper auth người dùng mới
- `lib/exercises/use-saved-exercise.ts`
- `lib/exercises/favorites.ts`
- `lib/exercises/repository.ts`
- `proxy.ts`
- `next.config.ts` nếu dùng `next/image` cho Google avatar
- migration mới trong `supabase/migrations/`
- CSS tương ứng với header, menu và trang favorites
- test liên quan đến Auth, RLS và thứ tự bài tập

Danh sách này có thể thay đổi khi triển khai, nhưng mọi thay đổi phạm vi phải được ghi vào nhật ký bên dưới.

## Nhật ký thực hiện

| Ngày | Giai đoạn | Trạng thái | Kết quả hoặc bằng chứng |
| --- | --- | --- | --- |
| 2026-10-21 | 0 | Hoàn thành | Đã khảo sát Auth, callback, RLS, API favorites, hook client, Proxy và logic xếp hạng hiện tại. |
| 2026-10-21 | 2–6 | Đã triển khai | Đã thêm OAuth routes, session API, login/avatar UI, favorites API, pending save và trang `/favorites` phân trang 12 bài. |
| 2026-10-21 | 7–8 | Hoàn thành | Đã áp dụng migration vào `noi-gym-v2`; đối soát 289 favorites, 289 tổng lượt và 289 bài admin featured. |
| 2026-10-21 | 9 | Đang thực hiện | TypeScript đạt, lint không lỗi, 17 test đạt, production build đạt; anonymous API trả 401, thư viện public trả 200, `/favorites` anonymous chuyển sang Google. |
| 2026-10-21 | 1 | Bị chặn một phần | Supabase Site URL và 2 Redirect URLs đã lưu. Google Cloud yêu cầu chủ tài khoản chấp nhận điều khoản và bật 2-Step Verification trước khi tạo OAuth Client. |
| 2026-10-22 | 1 | Đang thực hiện | Đã tạo dự án Google Cloud `noi-gym`, cấu hình Branding, ba scope cơ bản, OAuth client web và bật Google Provider trên Supabase `noi-gym-v2`. Đã xử lý lỗi `missing OAuth secret`; localhost đã đi tới màn hình chọn tài khoản Google. |
| 2026-10-22 | 1–3, 6, 9 | Kiểm thử E2E đạt | Đã sửa callback OAuth dùng redirect URI chính xác và cookie HTTP-only lưu `next`. Đăng nhập Google localhost thành công; session nhận đúng Đại Hải, ảnh Google và quyền admin. Menu tài khoản, `/favorites` với 289 bài và `/admin/exercises` với 1.946 bài đều tải đúng. |
