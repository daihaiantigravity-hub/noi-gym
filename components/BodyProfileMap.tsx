"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import type { EquipmentIconName } from "./EquipmentIcon";
import { JOINT_TARGETS, getAdvancedRoute, getTargetRoute } from "@/lib/exercises/targets";

type BodyView = "front" | "back";
type BodyMapMode = "standard" | "advanced" | "joints";

const muscleSlugByGroup: Record<string, string> = {
  "front-shoulders": "shoulders",
  "rear-shoulders": "shoulders",
  "traps-middle": "traps",
};

const advancedParentSlugByGroup: Record<string, string> = {
  "medial-hamstrings": "hamstrings",
  "lateral-hamstrings": "hamstrings",
  "gluteus-maximus": "glutes",
  "gluteus-medius": "glutes",
  "medial-head-triceps": "triceps",
  "long-head-triceps": "triceps",
  "lateral-head-triceps": "triceps",
  "posterior-deltoid": "rear-shoulders",
  "lower-trapezius": "traps",
  "traps-middle": "traps",
};

type HotspotPosition = {
  left: number;
  top: number;
};

const jointMapPositions: Record<string, HotspotPosition[]> = {
  shoulders: [
    { left: 33, top: 22 },
    { left: 67, top: 22 },
  ],
  elbow: [
    { left: 19, top: 35 },
    { left: 81, top: 35 },
  ],
  wrist: [
    { left: 8, top: 44 },
    { left: 92, top: 44 },
  ],
  hips: [
    { left: 38, top: 44 },
    { left: 62, top: 44 },
  ],
  knees: [
    { left: 37, top: 73 },
    { left: 63, top: 73 },
  ],
  ankles: [
    { left: 35, top: 91 },
    { left: 65, top: 91 },
  ],
};

const bodyMapViewBox = { width: 676.49, height: 1203.49 };

function getHotspotPosition(position: HotspotPosition, viewBox = bodyMapViewBox) {
  const cx = (position.left / 100) * viewBox.width;
  const cy = (position.top / 100) * viewBox.height;

  return { cx, cy };
}

export default function BodyProfileMap({ equipment = "featured" }: { equipment?: EquipmentIconName }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<BodyView>("front");
  const [activeMode, setActiveMode] = useState<BodyMapMode>("standard");
  const [svgMarkup, setSvgMarkup] = useState<{
    standard: { front: string; back: string };
    advanced: { front: string; back: string };
  } | null>(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      fetch("/male-aligned-fe-v2.svg"),
      fetch("/male-aligned-be-v2.svg"),
      fetch("/musclewiki-aligned-fe-v2.svg"),
      fetch("/musclewiki-aligned-be-v2.svg"),
    ])
      .then(async ([frontResponse, backResponse, advancedFrontResponse, advancedBackResponse]) => {
        if (!frontResponse.ok || !backResponse.ok || !advancedFrontResponse.ok || !advancedBackResponse.ok) {
          throw new Error("Unable to load body maps");
        }

        return {
          standard: {
            front: await frontResponse.text(),
            back: await backResponse.text(),
          },
          advanced: {
            front: (await advancedFrontResponse.text()).replaceAll("rgb(var(--bodymap-stroke))", "#484a68"),
            back: (await advancedBackResponse.text()).replaceAll("rgb(var(--bodymap-stroke))", "#484a68"),
          },
        };
      })
      .then((markup) => {
        if (isCurrent) {
          setSvgMarkup(markup);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setSvgMarkup(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  function handleMuscleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const muscleGroup = event.target.closest<SVGGElement>("g.bodymap");
    const groupId = muscleGroup?.id;

    if (!groupId) {
      return;
    }

    const categorySlug = equipment === "featured" ? undefined : equipment;

    if (activeMode === "advanced") {
      router.push(getAdvancedRoute(advancedParentSlugByGroup[groupId] ?? groupId, categorySlug));
      return;
    }

    const muscleSlug = muscleSlugByGroup[groupId] ?? groupId;
    router.push(categorySlug ? `/exercises/${muscleSlug}/${categorySlug}` : `/exercises/${muscleSlug}`);
  }

  const bodyLabel = activeView === "front" ? "Cơ trước" : "Cơ sau";
  const activeMarkup = activeMode === "advanced" ? svgMarkup?.advanced[activeView] : svgMarkup?.standard[activeView];
  const oppositeView: BodyView = activeView === "front" ? "back" : "front";
  const oppositeLabel = oppositeView === "front" ? "Cơ trước" : "Cơ sau";
  const oppositeMarkup = activeMode === "advanced" ? svgMarkup?.advanced[oppositeView] : svgMarkup?.standard[oppositeView];

  const modeItems: Array<{ id: BodyMapMode; label: string }> = [
    { id: "standard", label: "Standard" },
    { id: "joints", label: "Joints" },
    { id: "advanced", label: "Advanced" },

  ];
  const overlayTargets = activeMode === "joints" ? JOINT_TARGETS : [];
  const overlayPositions = jointMapPositions;
  const hotspotViewBox = bodyMapViewBox;

  return (
    <>
      {/* <section aria-label="Chọn vùng cơ thể" className="health-card quick-activity-card">
        <div className="quick-activity-card__items">
          <button
            aria-label="Hiển thị cơ trước"
            aria-pressed={activeView === "front"}
            className={`quick-activity-card__item${activeView === "front" ? " quick-activity-card__item--active" : ""}`}
            onClick={() => setActiveView("front")}
            type="button"
          >
            <span className="quick-activity-card__icon"><BodyViewIcon view="front" /></span>
            <span>Cơ trước</span>
          </button>
          <button
            aria-label="Hiển thị cơ sau"
            aria-pressed={activeView === "back"}
            className={`quick-activity-card__item${activeView === "back" ? " quick-activity-card__item--active" : ""}`}
            onClick={() => setActiveView("back")}
            type="button"
          >
            <span className="quick-activity-card__icon"><BodyViewIcon view="back" /></span>
            <span>Cơ sau</span>
          </button>
        </div>
      </section> */}

      <section aria-label="Chọn vùng cơ thể" className="health-card body-profiles-card">
        {/*
        <div className="body-profiles-card__header">
          <div>
            <h2 id="body-profiles-title">{activeMode === "standard" ? "Choose a muscle group" : activeMode === "advanced" ? "Advanced anatomy" : "Joint recovery"}</h2>
            <p>{modeDescription}</p>
          </div>
        </div>
        */}
        <div aria-label="Body map view" className="body-profile-mode-switcher" role="tablist">
          {modeItems.map((item) => (
            <button
              aria-selected={activeMode === item.id}
              className={`body-profile-mode-switcher__item${activeMode === item.id ? " body-profile-mode-switcher__item--active" : ""}`}
              key={item.id}
              onClick={() => setActiveMode(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="body-profiles-card__visuals">
          <figure className={`body-profile body-profile--${activeMode}`}>
            <button
              aria-label={`Chuyển nhanh sang xem ${oppositeLabel}`}
              className="body-profile__quick-switch"
              onClick={() => setActiveView(oppositeView)}
              title={`Chuyển nhanh sang xem ${oppositeLabel}`}
              type="button"
            >
              <div aria-hidden="true" className="body-profile__quick-switch-thumb">
                {oppositeMarkup && (
                  <div dangerouslySetInnerHTML={{ __html: oppositeMarkup }} />
                )}
              </div>
            </button>

            <div className="body-profile__image">
              <div className="body-profile__map-stage">
                <div
                  aria-label={`${bodyLabel}. ${activeMode === "standard" ? "Chọn một nhóm cơ để xem bài tập." : "Chọn một vùng trên ảnh để xem bài tập."}`}
                  className={`body-profile__svg${activeMode === "joints" ? " body-profile__svg--overlay" : ""}`}
                  onClick={activeMode === "joints" ? undefined : handleMuscleClick}
                  role="img"
                >
                  {activeMarkup && (
                    <div dangerouslySetInnerHTML={{ __html: activeMarkup }} />
                  )}
                </div>

                {activeMode === "joints" && activeMarkup ? (
                  <div aria-label="Các khớp" className="body-profile__hotspots body-profile__hotspots--joints" role="list">
                    <svg aria-hidden="true" className="body-profile__hotspot-overlay" preserveAspectRatio="xMidYMid meet" viewBox={`0 0 ${hotspotViewBox.width} ${hotspotViewBox.height}`}>
                      {overlayTargets.flatMap((target) => (overlayPositions[target.slug] ?? []).map((position, index) => {
                        const layout = getHotspotPosition(position, hotspotViewBox);
                        const href = getTargetRoute(target);

                        return (
                          <Link aria-label={`Mở bài tập ${target.label}`} className="body-profile__hotspot" href={href} key={`${target.slug}-${index}`} role="listitem">
                            <circle className="body-profile__hotspot-halo" cx={layout.cx} cy={layout.cy} r="25" />
                            <circle className="body-profile__hotspot-dot" cx={layout.cx} cy={layout.cy} r="13" />
                          </Link>
                        );
                      }))}
                    </svg>
                  </div>
                ) : null}
              </div>

            </div>
          </figure>
        </div>
      </section>
    </>
  );
}
