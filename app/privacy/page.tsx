import Link from "next/link";

export const metadata = {
  title: "Chính sách quyền riêng tư | Noi Gym",
  description: "Cách Noi Gym sử dụng dữ liệu đăng nhập Google và danh sách bài tập đã lưu.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link className="legal-back-link" href="/">
          ← Về Noi Gym
        </Link>
        <p className="legal-eyebrow">NOI GYM</p>
        <h1>Chính sách quyền riêng tư</h1>
        <p className="legal-updated">Cập nhật ngày 22 tháng 10 năm 2026</p>

        <section>
          <h2>Dữ liệu được sử dụng</h2>
          <p>
            Khi bạn đăng nhập bằng Google, Noi Gym nhận mã định danh tài khoản, tên, địa chỉ email và
            ảnh đại diện công khai để tạo phiên đăng nhập và hiển thị hồ sơ của bạn.
          </p>
        </section>

        <section>
          <h2>Bài tập đã lưu</h2>
          <p>
            Danh sách bài tập yêu thích được gắn với tài khoản của bạn. Noi Gym dùng tổng số lượt lưu để
            ưu tiên những bài tập được cộng đồng quan tâm; danh tính và email của người lưu không được công
            khai trong số liệu tổng hợp.
          </p>
        </section>

        <section>
          <h2>Lưu trữ và bảo vệ dữ liệu</h2>
          <p>
            Google cung cấp dịch vụ xác thực và Supabase lưu phiên đăng nhập cùng dữ liệu yêu thích. Noi Gym
            chỉ yêu cầu các quyền Google cơ bản gồm nhận dạng tài khoản, email và hồ sơ công khai.
          </p>
        </section>

        <section>
          <h2>Quyền lựa chọn của bạn</h2>
          <p>
            Bạn có thể bỏ lưu từng bài tập và đăng xuất bất kỳ lúc nào. Để yêu cầu hỗ trợ liên quan đến dữ
            liệu tài khoản, hãy liên hệ qua email bên dưới.
          </p>
        </section>

        <section>
          <h2>Liên hệ</h2>
          <p>
            Email: <a href="mailto:daihai.antigravity@gmail.com">daihai.antigravity@gmail.com</a>
          </p>
        </section>

        <footer className="legal-footer">
          <Link href="/terms">Điều khoản sử dụng</Link>
        </footer>
      </article>
    </main>
  );
}
