# Background theo giờ địa phương

Chỉ sửa bảng `HEALTH_THEMES` trong `lib/health-mood.ts` khi cần đổi màu, giờ,
tâm hoặc bán kính vùng sáng. Các mốc bắt đầu bao gồm chính mốc đó; night
bao gồm 20:00–05:00. Đây là cấu hình thiết kế của app, không phải thông số
chính thức của Samsung Health.

`HealthBackground` được gắn một lần trong root layout. Hai lớp gradient cố định
theo viewport chuyển opacity trong 1 giây; không chạy animation lúc nền ổn định,
không nghe sự kiện scroll, không phụ thuộc chiều dài nội dung và không chặn chạm.
Header trong suốt; card và nội dung giữ style hiện có. Trang chi tiết dùng nền
chung, không còn gắn lớp nền lấy màu từ video.

Script trong head chọn màu bằng giờ thiết bị trước lần vẽ đầu tiên; server chỉ
cung cấp nền night dự phòng nếu JavaScript bị tắt. Sau hydration, một timer đợi
mốc tiếp theo. Khi quay lại tab/app, focus hoặc khôi phục từ BFCache, giờ được
tính lại. Reduced motion đổi màu ngay, không crossfade.

## Ép theme trong development

Chạy `npm run dev`, mở một trong các URL:

- `http://localhost:3001/?healthTheme=morning`
- `http://localhost:3001/?healthTheme=midday`
- `http://localhost:3001/?healthTheme=afternoon`
- `http://localhost:3001/?healthTheme=evening`
- `http://localhost:3001/?healthTheme=night`

Tham số cũng dùng được trên trang danh sách/chi tiết. Theme ép được lưu trong
sessionStorage của tab để giữ màu khi chuyển trang. Mở `?healthTheme=auto` để
xóa chế độ ép và quay về giờ thực. Production luôn bỏ qua chế độ ép theme.
Nếu storage bị chặn, ép theme trực tiếp bằng URL vẫn hoạt động.

## Kiểm tra

`npm run test:health-background` kiểm tra palette, mốc giờ, bootstrap, preview,
timer, foreground, hai lớp opacity, cleanup và reduced motion. Chạy thêm
`npm run lint` và `npm run build`.

Checklist kiểm tra trực quan (cần trình duyệt, không thay thế bằng unit test):

1. Xem đủ 5 URL trên viewport 320×568, 390×844, 430×932 và desktop.
2. Cuộn đầu/giữa/cuối trang chủ, danh sách và chi tiết: vùng sáng đứng yên so
   với màn hình, không lặp theo section; header không có nền màu riêng.
3. Morning chỉ ấm bên trái; midday/afternoon hết sáng trước nửa dưới; evening
   trên lạnh dưới ấm; night không có vàng/cam.
4. Kiểm tra thiết bị có notch/safe area, cả hai chiều màn hình; nền phủ kín,
   nội dung và các nút vẫn đọc/bấm được, không đổi style card/menu.
5. Kiểm tra lúc qua mốc giờ và khi quay lại tab đã ẩn: crossfade 1 giây, không
   lóe đen. Bật reduced motion để xác nhận chuyển tức thì.
