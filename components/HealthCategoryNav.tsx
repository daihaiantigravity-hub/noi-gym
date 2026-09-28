"use client";

import { useEffect, useRef } from "react";
import EquipmentIcon, { type EquipmentIconName } from "@/components/EquipmentIcon";
import { HEALTH_CATEGORY_ITEMS } from "@/lib/exercises/constants";

type HealthCategoryNavProps = {
  activeCategory: EquipmentIconName;
  onSelect: (category: EquipmentIconName) => void;
};

function revealCategory(nav: HTMLElement, button: HTMLButtonElement) {
  const navBounds = nav.getBoundingClientRect();
  const buttonBounds = button.getBoundingClientRect();
  const leftEdge = navBounds.left + nav.clientLeft + 4;
  const rightEdge = navBounds.left + nav.clientLeft + nav.clientWidth - 4;
  const offset = buttonBounds.left < leftEdge
    ? buttonBounds.left - leftEdge
    : buttonBounds.right > rightEdge
      ? buttonBounds.right - rightEdge
      : 0;

  if (offset === 0) return;

  // Move only the category strip, never the page or its vertical scroll position.
  nav.scrollBy({
    left: offset,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
}

export default function HealthCategoryNav({ activeCategory, onSelect }: HealthCategoryNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (navRef.current && activeButtonRef.current) {
      revealCategory(navRef.current, activeButtonRef.current);
    }
  }, [activeCategory]);

  return (
    <div className="health-category-nav-shell">
      <nav aria-label="Loại thiết bị tập luyện" className="health-category-nav" ref={navRef}>
        {HEALTH_CATEGORY_ITEMS.map((item) => {
          return (
            <button
              aria-label={item.label}
              aria-pressed={activeCategory === item.icon}
              className={`health-category-button${activeCategory === item.icon ? " health-category-button--active" : ""}`}
              key={item.icon}
              onClick={() => onSelect(item.icon)}
              onFocus={(event) => {
                if (navRef.current) revealCategory(navRef.current, event.currentTarget);
              }}
              ref={activeCategory === item.icon ? activeButtonRef : null}
              title={item.label}
              type="button"
            >
              <EquipmentIcon name={item.icon} />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
