import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sắp ra mắt | Noi Gym",
};

export default function ComingSoonPage() {
  return (
    <div className="health-mood-surface coming-soon-page">
      <header className="coming-soon-page__header">
        <Link className="coming-soon-page__brand" href="/">Equix Health</Link>
      </header>

      <main className="coming-soon-page__main">
        <div className="coming-soon-page__content">
          <span className="coming-soon-page__eyebrow">Sắp ra mắt</span>
          <h1>Đang phát triển</h1>
          <p>Tính năng này đang được hoàn thiện.</p>
          <Link className="coming-soon-page__home" href="/">Về trang chủ</Link>
        </div>
      </main>
    </div>
  );
}
