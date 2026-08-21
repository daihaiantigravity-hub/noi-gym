"use client";

import { useState } from "react";

type EquipmentName =
  | "Featured"
  | "Barbell"
  | "Dumbbells"
  | "Bodyweight"
  | "Machine"
  | "Medicine Ball"
  | "Kettlebells"
  | "Stretches"
  | "Cables"
  | "Band"
  | "Plate"
  | "TRX"
  | "Yoga"
  | "Bosu Ball"
  | "Cardio"
  | "Smith Machine"
  | "Recovery"
  | "Pilates";

type ExerciseFiltersProps = {
  isMale: boolean;
  onGenderChange: (isMale: boolean) => void;
};

const equipmentItems: EquipmentName[] = [
  "Featured",
  "Barbell",
  "Dumbbells",
  "Bodyweight",
  "Machine",
  "Medicine Ball",
  "Kettlebells",
  "Stretches",
  "Cables",
  "Band",
  "Plate",
  "TRX",
  "Yoga",
  "Bosu Ball",
  "Cardio",
  "Smith Machine",
  "Recovery",
  "Pilates",
];

function GenderIcon({ female = false }: { female?: boolean }) {
  return (
    <svg className="filter-gender-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="4" />
      {female ? <path d="M10 14v7M7 18h6" /> : <path d="m13 7 5-5M14.5 2H18v3.5" />}
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

function EquipmentIcon({ name }: { name: EquipmentName }) {
  const commonProps = {
    width: 27,
    height: 27,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.45,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "Featured":
      return (
        <svg {...commonProps}>
          <path d="M7 13v6M4.5 14.5v3M25 13v6M27.5 14.5v3M7 16h18" />
          <rect x="9" y="11.5" width="4" height="9" rx="1" />
          <rect x="19" y="11.5" width="4" height="9" rx="1" />
        </svg>
      );
    case "Barbell":
      return (
        <svg {...commonProps}>
          <path d="M4 16h24M7 11v10M10 9v14M22 9v14M25 11v10" />
          <path d="M12 13h8" />
        </svg>
      );
    case "Dumbbells":
      return (
        <svg {...commonProps}>
          <circle cx="21" cy="10" r="5" />
          <path d="m17.5 13.5-5.5 5.5M8 20l4 4M5.5 17.5l4 4M14 16l4 4" />
          <path d="M19 8.5h4M21 6.5v7" />
        </svg>
      );
    case "Bodyweight":
      return (
        <svg {...commonProps}>
          <circle cx="16" cy="6" r="2.5" />
          <path d="M16 9v8M12.5 12.5h7M14 17l-2 8M18 17l2 8" />
        </svg>
      );
    case "Machine":
      return (
        <svg {...commonProps}>
          <path d="M7 24V11M7 11h13M20 11v13M4 24h23M10 17h7M10 14v7" />
          <path d="M21 7h4v4h-4zM4 9h4v3H4z" />
        </svg>
      );
    case "Medicine Ball":
      return (
        <svg {...commonProps}>
          <circle cx="16" cy="16" r="10" />
          <path d="M11.5 8.2c3 2.2 5.2 2.7 8.9 2M8.8 20.5c2.4-1.7 4.8-2.1 8.2-1.2" />
        </svg>
      );
    case "Kettlebells":
      return (
        <svg {...commonProps}>
          <path d="M10 13V9a6 6 0 0 1 12 0v4M8 13h16l1.5 9H6.5z" />
          <path d="M13 8h6" />
        </svg>
      );
    case "Stretches":
      return (
        <svg {...commonProps}>
          <circle cx="19" cy="6" r="2" />
          <path d="m17.5 8-5 5-5-1M12.5 13l5 5M12.5 13 9 24M17.5 18l6 5M7.5 12l-3 5" />
        </svg>
      );
    case "Cables":
      return (
        <svg {...commonProps}>
          <path d="M16 7v17M16 7 7 24M16 7l9 17M11 16h10M7 24h-3M25 24h3" />
          <circle cx="16" cy="6" r="2" />
        </svg>
      );
    case "Band":
      return (
        <svg {...commonProps}>
          <path d="M5 12c4-6 7 6 11 0s7 6 11 0" />
          <path d="M5 18c4-6 7 6 11 0s7 6 11 0" />
          <path d="M5 12v6M27 12v6" />
        </svg>
      );
    case "Plate":
      return (
        <svg {...commonProps}>
          <ellipse cx="16" cy="16" rx="8" ry="12" />
          <ellipse cx="16" cy="16" rx="3" ry="7" />
          <path d="M7 16h18" />
        </svg>
      );
    case "TRX":
      return (
        <svg {...commonProps}>
          <path d="M16 4v5M8 25l8-16 8 16M11 19l10 0M8 25h-3M24 25h3" />
          <path d="m12 12-3 4M20 12l3 4M8 16l-3 5M24 16l3 5" />
        </svg>
      );
    case "Yoga":
      return (
        <svg {...commonProps}>
          <path d="M5 21c3-5 7-5 10 0M9 17c-2-2-2-5 0-7M14 21h13M19 21c-1-5 1-8 5-10" />
          <circle cx="10" cy="7" r="2" />
        </svg>
      );
    case "Bosu Ball":
      return (
        <svg {...commonProps}>
          <path d="M5 19a11 11 0 0 1 22 0H5Z" />
          <path d="M4 23h24M9 23v2M23 23v2" />
        </svg>
      );
    case "Cardio":
      return (
        <svg {...commonProps}>
          <path d="M16 25S5 18.5 5 11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7.5-7 11.6-7 11.6Z" />
          <path d="M7.5 14h4l1.5-3 2.5 6 1.5-3h4" />
        </svg>
      );
    case "Smith Machine":
      return (
        <svg {...commonProps}>
          <path d="M8 5v22M24 5v22M6 27h20M10 11h12M9 15h14M11 20h10" />
          <path d="M13 11v12M19 11v12" />
        </svg>
      );
    case "Recovery":
      return (
        <svg {...commonProps}>
          <path d="M23 11a8 8 0 0 0-13-3L7 10M9 7v4h4M9 21a8 8 0 0 0 13-3l3-2M23 25v-4h-4" />
          <path d="M16 11v6M13 14h6" />
        </svg>
      );
    case "Pilates":
      return (
        <svg {...commonProps}>
          <circle cx="21" cy="7" r="2" />
          <path d="m19.5 9-5 6-5-1M14.5 15l5 7M14.5 15 10 25M9.5 14l-4 6M4 25h24" />
        </svg>
      );
  }
}

function EquipmentOption({
  name,
  checked,
  onChange,
}: {
  name: EquipmentName;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`equipment-option${checked ? " equipment-option--checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="equipment-option__checkbox" aria-hidden="true" />
      <span className="equipment-option__icon">
        <EquipmentIcon name={name} />
      </span>
      <span className="equipment-option__label">{name}</span>
    </label>
  );
}

export default function ExerciseFilters({ isMale, onGenderChange }: ExerciseFiltersProps) {
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentName[]>(["Featured"]);

  function toggleEquipment(name: EquipmentName) {
    setSelectedEquipment((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  return (
    <aside className="exercise-filters" aria-label="Exercise filters">
      <div className="exercise-filters__controls" role="group" aria-label="Choose body type">
        <button
          className={isMale ? "exercise-filters__gender-button exercise-filters__gender-button--active" : "exercise-filters__gender-button"}
          type="button"
          aria-label="Show male exercises"
          aria-pressed={isMale}
          onClick={() => onGenderChange(true)}
        >
          <GenderIcon />
          <span>Male</span>
        </button>
        <button
          className={!isMale ? "exercise-filters__gender-button exercise-filters__gender-button--active" : "exercise-filters__gender-button"}
          type="button"
          aria-label="Show female exercises"
          aria-pressed={!isMale}
          onClick={() => onGenderChange(false)}
        >
          <GenderIcon female />
          <span>Female</span>
        </button>
      </div>

      <div className="exercise-filters__body">
        <div className="exercise-filters__heading">
          <h2>Equipment</h2>
          <button
            className="exercise-filters__collapse"
            type="button"
            aria-label={isEquipmentOpen ? "Collapse equipment filters" : "Expand equipment filters"}
            aria-expanded={isEquipmentOpen}
            onClick={() => setIsEquipmentOpen((current) => !current)}
          >
            <MinusIcon />
          </button>
        </div>

        {isEquipmentOpen && (
          <div className="equipment-grid">
            {equipmentItems.map((name) => (
              <EquipmentOption
                key={name}
                name={name}
                checked={selectedEquipment.includes(name)}
                onChange={() => toggleEquipment(name)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="exercise-filters__footer" aria-hidden="true" />
    </aside>
  );
}
