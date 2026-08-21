"use client";

import { useEffect, useState } from "react";

type IconName = "home" | "workouts" | "routines" | "tools" | "articles" | "build";
type Theme = "light" | "dark";

type NavigationItem = {
  label: string;
  icon: IconName;
};

const navigationItems: NavigationItem[] = [
  { label: "Home", icon: "home" },
  { label: "Workouts", icon: "workouts" },
  { label: "Routines", icon: "routines" },
  { label: "Tools", icon: "tools" },
  { label: "Articles", icon: "articles" },
  { label: "Build", icon: "build" },
];

function Icon({ name }: { name: IconName }) {
  const commonProps = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3.5 10.6 8.5-7 8.5 7" />
          <path d="M5.5 9.5v10.2h13V9.5M9.5 19.7v-5.6h5v5.6" />
        </svg>
      );
    case "workouts":
      return (
        <svg {...commonProps}>
          <path d="M7 8v8M4.5 10v4M17 8v8M19.5 10v4M7 12h10" />
          <path d="M3 11.5h1.5M19.5 11.5H21" />
        </svg>
      );
    case "routines":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h3M13.5 13H16M8 16.5h3" />
        </svg>
      );
    case "tools":
      return (
        <svg {...commonProps}>
          <path d="m14.6 6.4 3-3 .5 2.5 2.5.5-3 3" />
          <path d="m13.9 7.1-8.7 8.7a2.1 2.1 0 1 0 3 3l8.7-8.7" />
          <path d="m5.8 18.2-1.5 1.5M16.1 10.1l2 2" />
        </svg>
      );
    case "articles":
      return (
        <svg {...commonProps}>
          <path d="M6 3.5h8l4 4v13H6z" />
          <path d="M14 3.5v4h4M9 11h6M9 14.5h6M9 18h3.5" />
        </svg>
      );
    case "build":
      return (
        <svg {...commonProps}>
          <path d="m14.8 5.2 4-1.7 1.7 1.7-1.7 4-2.4.2-5.9 5.9" />
          <path d="m10.5 14.5-2 2M6.7 20.5l-3-3 3.4-3.4 3 3z" />
        </svg>
      );
  }
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M4.4 4.4l1.4 1.4M18.2 18.2l1.4 1.4M2.5 12h2M19.5 12h2M4.4 19.6l1.4-1.4M18.2 5.8l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.7 14.3A7.7 7.7 0 0 1 9.7 4.3 7.8 7.8 0 1 0 19.7 14.3Z" />
    </svg>
  );
}

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("Home");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <aside className="sidebar" aria-label="Dashboard navigation">
      <nav aria-label="Main navigation">
        <ul className="sidebar__nav">
          {navigationItems.map((item) => {
            const isActive = item.label === activeItem;

            return (
              <li key={item.label}>
                <button
                  className={`sidebar__item${isActive ? " sidebar__item--active" : ""}`}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  onClick={() => setActiveItem(item.label)}
                >
                  <Icon name={item.icon} />
                  <span className="sidebar__tooltip" role="tooltip">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__theme" aria-label="Appearance">
        <button
          className={`sidebar__theme-button${theme === "light" ? " sidebar__theme-button--active" : ""}`}
          type="button"
          aria-label="Use light theme"
          aria-pressed={theme === "light"}
          onClick={() => setTheme("light")}
        >
          <SunIcon />
        </button>
        <button
          className={`sidebar__theme-button${theme === "dark" ? " sidebar__theme-button--active" : ""}`}
          type="button"
          aria-label="Use dark theme"
          aria-pressed={theme === "dark"}
          onClick={() => setTheme("dark")}
        >
          <MoonIcon />
        </button>
      </div>
    </aside>
  );
}
