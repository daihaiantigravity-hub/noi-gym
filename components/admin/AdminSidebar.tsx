"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminIconName = "dashboard" | "dumbbell" | "upload" | "media" | "users" | "settings";

type AdminNavigationItem = {
  label: string;
  href?: string;
  icon: AdminIconName;
  comingSoon?: boolean;
};

const workspaceItems: AdminNavigationItem[] = [
  { label: "Tổng quan", href: "/admin", icon: "dashboard" },
  { label: "Bài tập", href: "/admin/exercises", icon: "dumbbell" },
  { label: "Import dữ liệu", href: "/admin/exercises/import", icon: "upload" },
];

const futureItems: AdminNavigationItem[] = [
  { label: "Thư viện media", icon: "media", comingSoon: true },
  { label: "Người dùng", icon: "users", comingSoon: true },
  { label: "Cài đặt chung", icon: "settings", comingSoon: true },
];

function Icon({ name }: { name: AdminIconName }) {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "dumbbell":
      return (
        <svg {...commonProps}>
          <path d="M7 8v8M4.5 10v4M17 8v8M19.5 10v4M7 12h10" />
          <path d="M3 11.5h1.5M19.5 11.5H21" />
        </svg>
      );
    case "upload":
      return (
        <svg {...commonProps}>
          <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" />
          <path d="M5 13.5v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        </svg>
      );
    case "media":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <circle cx="8.5" cy="9" r="1.4" />
          <path d="m5.5 17 4.2-4 3 2.5 2.4-2.1 3.4 3.6" />
        </svg>
      );
    case "users":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19.5c.5-3.3 2.3-5 5.5-5s5 1.7 5.5 5" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8M17 14.8c2.2.7 3.4 2.2 3.6 4.7" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3.1-1.3l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-1.3-3.1h-.2a1.8 1.8 0 0 1 0-3.6h.2a1.8 1.8 0 0 0 1.3-3.1l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3.1-1.3v-.2a1.8 1.8 0 0 1 3.6 0v.2a1.8 1.8 0 0 0 3.1 1.3l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 1.3 3.1h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.8 1.8 0 0 0-1.3 3.1Z" />
        </svg>
      );
  }
}

function NavigationGroup({
  label,
  items,
  activeHref,
}: {
  label: string;
  items: AdminNavigationItem[];
  activeHref?: string;
}) {
  return (
    <div className="admin-sidebar__group">
      <span className="admin-sidebar__group-title">{label}</span>
      <ul className="admin-sidebar__list">
        {items.map((item) => {
          const isActive = item.href === activeHref;
          const className = `admin-sidebar__item${isActive ? " admin-sidebar__item--active" : ""}${item.comingSoon ? " admin-sidebar__item--disabled" : ""}`;

          return (
            <li key={item.label}>
              {item.href ? (
                <Link className={className} href={item.href} aria-current={isActive ? "page" : undefined}>
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className={className} aria-disabled="true">
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  <small>Sắp có</small>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const activeHref = [...workspaceItems, ...futureItems]
    .filter((item): item is AdminNavigationItem & { href: string } => Boolean(item.href))
    .sort((first, second) => second.href.length - first.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;

  return (
    <aside className="admin-sidebar" aria-label="Điều hướng admin">
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__brand-mark">N</span>
        <div>
          <strong>NOI GYM</strong>
          <span>Admin workspace</span>
        </div>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Menu quản trị">
        <NavigationGroup label="Workspace" items={workspaceItems} activeHref={activeHref} />
        <NavigationGroup label="Mở rộng" items={futureItems} activeHref={activeHref} />
      </nav>

      <div className="admin-sidebar__footer">
        <Link className="admin-sidebar__back-link" href="/">
          <span aria-hidden="true">←</span>
          <span>Về giao diện người dùng</span>
        </Link>
        <span className="admin-sidebar__version">NOI GYM · ADMIN</span>
      </div>
    </aside>
  );
}
