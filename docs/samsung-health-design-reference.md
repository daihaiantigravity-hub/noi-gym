# Định hướng giao diện tham khảo Samsung Health

Tài liệu này ghi lại các nguyên tắc rút ra từ hai ảnh Samsung Health do chủ dự án cung cấp ngày 28/10/2026. Đây là nguồn tham khảo cho những lần thiết kế và chỉnh sửa UI của Noi Gym, cùng với các màn hình đang được sử dụng trong dự án. Quyết định cụ thể mới của người dùng luôn được ưu tiên.

Các mã màu dưới đây là **giá trị tham khảo ước lượng bằng quan sát ảnh**, không phải mã màu chính thức của Samsung hay giá trị đã lấy mẫu chính xác từ file gốc. Có thể tinh chỉnh theo màn hình thực tế và độ tương phản, nhưng cần giữ đúng vai trò, mức độ nổi bật và sự hài hòa của từng nhóm màu.

## Bảng màu tham khảo

| Vai trò | Màu gợi ý | Cách dùng trong ảnh |
| --- | --- | --- |
| Nền tối | `#000000`–`#090B0C` | Nền chung, giúp các thẻ được phân tách rõ. |
| Thẻ mặc định | `#151618`–`#1B1D20` | Phần lớn các thẻ có nền xám than gần như đồng nhất. |
| Nền nút hoặc icon phụ | `#25292F`–`#30343A` | Nút phụ, nền tròn phía sau icon, rãnh thanh tiến độ. |
| Chữ chính | `#F5F5F7` | Tên mục, giá trị và nội dung quan trọng. |
| Chữ phụ | `#A1A1AA` | Đơn vị, nhãn phụ, trạng thái và mô tả. |
| Xanh lá hoạt động | `#13CC70` | Bước chân, một số đoạn tiến độ và vòng hoạt động. |
| Xanh lá thẻ nổi bật | `#00A843` | Thẻ chỉ số bước chân được làm nổi bằng nền xanh toàn thẻ. |
| Xanh lá nhạt | `#91E5AD` | Phần tiến độ, nhãn và chữ trên một số bề mặt xanh. |
| Xanh dương | `#45A5F2` | Phân biệt chỉ số phút và một số vòng hoạt động. |
| Hồng | `#F34291` | Phân biệt chỉ số kcal và vòng hoạt động. |
| Cam | `#E98927` | Icon cho một số chỉ số; thẻ hoạt động nổi bật có nền cam đậm khoảng `#E86E0B`. |
| Tím | `#565081` | Nhãn hoặc thông tin liên quan đến giấc ngủ. |

Màu trong ảnh được dùng theo ngữ cảnh: ví dụ bước chân màu xanh, thời gian vận động màu xanh dương và kcal màu hồng. Không tự động gán một màu vào mọi nút, trạng thái đã chọn hay mọi chỉ số khác; trước tiên xác định ý nghĩa của thành phần và đối chiếu với những thành phần tương tự đang có.

Trong `app/globals.css`, các điểm nhấn đã dùng chung biến `--health-accent-green`, `--health-highlight-green` và `--health-accent-orange`. Ưu tiên dùng lại các biến này khi cùng vai trò màu thay vì khai báo một màu mới gần giống.

## Nguyên tắc bố cục và thành phần

- Ưu tiên nền tối và thẻ xám than đơn giản; tạo phân cấp bằng khoảng cách, kích thước chữ và nội dung, thay vì thêm nhiều lớp khung, viền hoặc bóng phát sáng.
- Thẻ có góc bo lớn, nhất quán. Với giao diện web mobile, có thể bắt đầu từ khoảng 20–28px; điều chỉnh theo kích thước thực tế của thẻ và các màn hình hiện có.
- Tiêu đề hoặc giá trị chính có trọng lượng rõ ràng; nhãn phụ nhỏ hơn và màu xám. Tránh đưa toàn bộ chữ về cùng một độ sáng hoặc kích thước.
- Icon đơn giản, dễ nhận ra; icon chỉ số có thể đặt trên nền tròn và dùng màu theo ngữ cảnh. Giữ kích thước và nét icon hài hòa với các icon hiện tại.
- Nút phụ thường có nền xám than dịu, bo tròn và chữ sáng. Nút chính cần dễ nhận biết, nhưng không cần dùng màu rực nếu nội dung không cần nhấn mạnh bằng màu đó.
- Các dải tiến độ và vòng màu gắn với chỉ số, mục tiêu hoặc trạng thái thực tế. Không tạo đồng hồ/vòng tiến độ trang trí có thể bị hiểu là dữ liệu thật khi chưa có dữ liệu tương ứng.
- Dùng màu rực có chọn lọc, tập trung ở chỉ số hoặc thẻ quan trọng; tránh làm nhiều thẻ, đường viền và trạng thái cùng nổi bật một lúc.
- Trên mobile, ưu tiên bố cục một cột, khoảng cách thoáng và nội dung tự xuống dòng. Nút tương tác cần có vùng chạm đủ lớn; trạng thái cần nhận biết được cả qua chữ/icon, không chỉ qua màu.

## Cách áp dụng trong Noi Gym

- Trang chủ, danh sách bài tập và chi tiết bài tập cần cùng ngôn ngữ thiết kế: nền tối, thẻ than, chữ sáng, chữ phụ xám và icon nhất quán. Tham khảo các thành phần đang dùng trước khi tạo mẫu mới.
- Dự án đã có nền thay đổi theo thời gian và các yêu cầu UI riêng được người dùng xác nhận. Giữ các quyết định hiện có, bao gồm cách đánh dấu ngày trong lịch, trừ khi người dùng yêu cầu thay đổi. Xem [health-background.md](health-background.md) khi làm việc với nền chung.
- Khi làm thẻ lịch tập hoặc trạng thái hôm nay, chọn màu dựa trên chức năng và yêu cầu cụ thể; có thể lấy xanh lá của thẻ chỉ số làm điểm nhấn, đồng thời kiểm tra chữ đủ dễ đọc trên nền.
- Không thêm hiệu ứng blur, animation hoặc nhiều lớp đổ bóng chỉ để giống ảnh nếu không cần thiết; cần chú ý trải nghiệm cuộn và phát video trên điện thoại.
- Đây là định hướng cho các thay đổi tiếp theo, không phải yêu cầu tự động thay màu hoặc thiết kế lại toàn bộ giao diện hiện tại.

## Kiểm tra khi chỉnh UI

1. So sánh với trang chủ, danh sách và chi tiết bài tập, đặc biệt là màu nền thẻ, tiêu đề, icon, trạng thái chọn và cách bo góc.
2. Xem trên desktop và mobile; kiểm tra chữ dài tiếng Việt/tiếng Anh, trạng thái rỗng, ngày nghỉ, nút đang xử lý và focus bằng bàn phím khi có liên quan.
3. Kiểm tra trực quan trên nền chủ đề hiện hành của dự án; tránh đánh giá màu chỉ trên một ô màu tách rời khỏi giao diện.
4. Khi đề xuất màu mới, ghi rõ vai trò của màu và liệu giá trị được lấy mẫu thực tế hay chỉ là ước lượng.
