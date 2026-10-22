import Link from "next/link";

export const metadata = {
  title: "Điều khoản sử dụng | Noi Gym",
  description: "Điều khoản áp dụng khi sử dụng thư viện bài tập Noi Gym.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link className="legal-back-link" href="/">
          ← Về Noi Gym
        </Link>
        <p className="legal-eyebrow">NOI GYM</p>
        <h1>Điều khoản sử dụng</h1>
        <p className="legal-updated">Cập nhật ngày 22 tháng 10 năm 2026</p>

        <section>
          <h2>Mục đích của Noi Gym</h2>
          <p>
            Noi Gym cung cấp thư viện bài tập để tham khảo, tìm kiếm và lưu lại nội dung phù hợp với nhu cầu
            cá nhân. Nội dung trên trang không thay thế tư vấn y tế hoặc hướng dẫn trực tiếp của chuyên gia.
          </p>
        </section>

        <section>
          <h2>Sử dụng an toàn</h2>
          <p>
            Bạn chịu trách nhiệm lựa chọn mức độ tập luyện phù hợp với sức khỏe và khả năng của mình. Hãy
            dừng tập và tìm tư vấn chuyên môn khi có đau, chóng mặt hoặc dấu hiệu bất thường.
          </p>
        </section>

        <section>
          <h2>Tài khoản và bài tập yêu thích</h2>
          <p>
            Bạn có thể đăng nhập bằng Google để lưu bài tập. Bạn chịu trách nhiệm bảo vệ quyền truy cập tài
            khoản Google của mình và không sử dụng dịch vụ theo cách gây gián đoạn hoặc xâm phạm người khác.
          </p>
        </section>

        <section>
          <h2>Thay đổi dịch vụ</h2>
          <p>
            Nội dung, tính năng và các điều khoản này có thể được cập nhật để cải thiện dịch vụ hoặc đáp ứng
            yêu cầu vận hành. Ngày cập nhật gần nhất luôn được ghi ở đầu trang.
          </p>
        </section>

        <section>
          <h2>Liên hệ</h2>
          <p>
            Email: <a href="mailto:daihai.antigravity@gmail.com">daihai.antigravity@gmail.com</a>
          </p>
        </section>

        <footer className="legal-footer">
          <Link href="/privacy">Chính sách quyền riêng tư</Link>
        </footer>
      </article>
    </main>
  );
}
