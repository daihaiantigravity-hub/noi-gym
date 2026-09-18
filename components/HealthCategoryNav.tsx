"use client";

import EquipmentIcon, { type EquipmentIconName } from "@/components/EquipmentIcon";
import { HEALTH_CATEGORY_ITEMS } from "@/lib/exercises/constants";

type HealthCategoryNavProps = {
  activeCategory: EquipmentIconName;
  onSelect: (category: EquipmentIconName) => void;
};

export default function HealthCategoryNav({ activeCategory, onSelect }: HealthCategoryNavProps) {
  return (
    <div className="health-category-nav-shell">
      <nav aria-label="Các nhóm sức khỏe" className="health-category-nav">
        {HEALTH_CATEGORY_ITEMS.map((item) => {
          return (
            <button
              aria-label={item.label}
              aria-pressed={activeCategory === item.icon}
              className={`health-category-button${activeCategory === item.icon ? " health-category-button--active" : ""}`}
              key={item.icon}
              onClick={() => onSelect(item.icon)}
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
