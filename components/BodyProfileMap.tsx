"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import type { EquipmentIconName } from "./EquipmentIcon";
import { withExerciseGender } from "@/lib/exercises/gender";
import { JOINT_TARGETS, getAdvancedRoute, getTargetRoute } from "@/lib/exercises/targets";
import { usePersistedChoice } from "@/lib/use-persisted-choice";

type BodyView = "front" | "back";
type BodyMapMode = "standard" | "advanced" | "joints";
type BodyGender = "male" | "female";

const bodyViewChoices: readonly BodyView[] = ["front", "back"];
const bodyModeChoices: readonly BodyMapMode[] = ["standard", "joints", "advanced"];
const bodyGenderChoices: readonly BodyGender[] = ["male", "female"];

function GenderIcon({ gender }: { gender: BodyGender }) {
  return <span aria-hidden="true" className="body-profile-gender-toggle__avatar">{gender === "male" ? "🧔🏻" : "👩🏻"}</span>;
}

const muscleSlugByGroup: Record<string, string> = {
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
const femaleBodyMapViewBox = { width: 660.46, height: 1206.46 };

function getHotspotPosition(position: HotspotPosition, viewBox = bodyMapViewBox) {
  const cx = (position.left / 100) * viewBox.width;
  const cy = (position.top / 100) * viewBox.height;

  return { cx, cy };
}

export default function BodyProfileMap({ equipment = "featured" }: { equipment?: EquipmentIconName }) {
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());
  const [isPending, startTransition] = useTransition();
  const [activeView, setActiveView] = usePersistedChoice<BodyView>("noi-gym:home:body-view:v1", "front", bodyViewChoices);
  const [activeMode, setActiveMode] = usePersistedChoice<BodyMapMode>("noi-gym:home:body-mode:v1", "standard", bodyModeChoices);
  const [activeGender, setActiveGender] = usePersistedChoice<BodyGender>("noi-gym:home:gender:v1", "male", bodyGenderChoices);
  const [femaleMarkup, setFemaleMarkup] = useState<{
    standard: { front: string; back: string };
    advanced: { front: string; back: string };
  } | null>(null);
  const [femaleLoadFailed, setFemaleLoadFailed] = useState(false);
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

  useEffect(() => {
    if (activeGender !== "female" || femaleMarkup) return;
    let isCurrent = true;

    Promise.all([
      fetch("/female-fe.svg"),
      fetch("/female-be.svg"),
      fetch("/female-advanced-fe.svg"),
      fetch("/female-advanced-be.svg"),
    ])
      .then(async ([frontResponse, backResponse, advancedFrontResponse, advancedBackResponse]) => {
        if (!frontResponse.ok || !backResponse.ok || !advancedFrontResponse.ok || !advancedBackResponse.ok) {
          throw new Error("Unable to load female body maps");
        }
        return {
          standard: { front: await frontResponse.text(), back: await backResponse.text() },
          advanced: { front: await advancedFrontResponse.text(), back: await advancedBackResponse.text() },
        };
      })
      .then((markup) => {
        if (isCurrent) setFemaleMarkup(markup);
      })
      .catch(() => {
        if (isCurrent) setFemaleLoadFailed(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeGender, femaleMarkup]);

  function getGroupId(target: EventTarget | null) {
    if (!(target instanceof Element)) {
      return null;
    }

    return target.closest<SVGGElement>("g.bodymap")?.id ?? null;
  }

  function getMuscleRoute(groupId: string) {
    const categorySlug = equipment === "featured" ? undefined : equipment;
    const gender = activeGender === "female" ? activeGender : undefined;

    if (activeMode === "advanced") {
      return withExerciseGender(getAdvancedRoute(advancedParentSlugByGroup[groupId] ?? groupId, categorySlug), gender);
    }

    const muscleSlug = muscleSlugByGroup[groupId] ?? groupId;
    if (categorySlug === "recovery" && muscleSlug === "shoulders") return withExerciseGender(`/exercises/${muscleSlug}/recovery?view=category`, gender);
    return withExerciseGender(categorySlug ? `/exercises/${muscleSlug}/${categorySlug}` : `/exercises/${muscleSlug}`, gender);
  }

  function handleMusclePointerOver(event: ReactPointerEvent<HTMLDivElement>) {
    const groupId = getGroupId(event.target);
    if (!groupId) {
      return;
    }

    const route = getMuscleRoute(groupId);
    if (prefetchedRoutes.current.has(route)) {
      return;
    }

    prefetchedRoutes.current.add(route);
    router.prefetch(route);
  }

  function handleMuscleClick(event: ReactMouseEvent<HTMLDivElement>) {
    const groupId = getGroupId(event.target);
    if (!groupId || isPending) {
      return;
    }

    startTransition(() => {
      router.push(getMuscleRoute(groupId));
    });
  }

  const bodyLabel = activeView === "front" ? "Cơ trước" : "Cơ sau";
  const activeMarkup = activeGender === "female"
    ? femaleMarkup?.[activeMode === "advanced" ? "advanced" : "standard"][activeView]
    : activeMode === "advanced" ? svgMarkup?.advanced[activeView] : svgMarkup?.standard[activeView];
  const oppositeView: BodyView = activeView === "front" ? "back" : "front";
  const oppositeLabel = oppositeView === "front" ? "Cơ trước" : "Cơ sau";
  const oppositeMarkup = activeGender === "female"
    ? femaleMarkup?.[activeMode === "advanced" ? "advanced" : "standard"][oppositeView]
    : activeMode === "advanced" ? svgMarkup?.advanced[oppositeView] : svgMarkup?.standard[oppositeView];
  const mapIsInteractive = activeMode !== "joints";

  const modeItems: Array<{ id: BodyMapMode; label: string }> = [
    { id: "standard", label: "Standard" },
    { id: "joints", label: "Joints" },
    { id: "advanced", label: "Advanced" },

  ];
  const overlayTargets = activeMode === "joints" ? JOINT_TARGETS : [];
  const overlayPositions = jointMapPositions;
  const hotspotViewBox = activeGender === "female" ? femaleBodyMapViewBox : bodyMapViewBox;

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
        <div className="body-profile-toolbar">
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
          <button
            aria-label={`Đang hiển thị bản đồ cơ thể ${activeGender === "male" ? "nam" : "nữ"}. Nhấn để chuyển sang ${activeGender === "male" ? "nữ" : "nam"}.`}
            className={`body-profile-gender-toggle body-profile-gender-toggle--${activeGender}`}
            onClick={() => setActiveGender((gender) => gender === "male" ? "female" : "male")}
            title={`Chuyển sang bản đồ cơ thể ${activeGender === "male" ? "nữ" : "nam"}`}
            type="button"
          >
            <GenderIcon gender={activeGender} />
          </button>
        </div>

        <div className="body-profiles-card__visuals">
          <figure className={`body-profile body-profile--${activeMode} body-profile--${activeGender}`}>
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
                  aria-label={`${activeGender === "male" ? "Nam" : "Nữ"}, ${bodyLabel}. ${activeMode === "joints" ? "Chọn một khớp để xem bài tập." : "Chọn một vùng trên ảnh để xem bài tập."}`}
                  aria-busy={isPending}
                  className={`body-profile__svg${!mapIsInteractive ? " body-profile__svg--overlay" : ""}${isPending ? " body-profile__svg--pending" : ""}`}
                  onClick={mapIsInteractive ? handleMuscleClick : undefined}
                  onPointerOver={mapIsInteractive ? handleMusclePointerOver : undefined}
                  role="img"
                >
                  {activeMarkup && (
                    <div dangerouslySetInnerHTML={{ __html: activeMarkup }} />
                  )}
                  {activeGender === "female" && femaleLoadFailed && !activeMarkup && <span role="status">Không tải được bản đồ cơ thể nữ.</span>}
                  {isPending && (
                    <span className="body-profile__navigation-feedback" role="status">
                      <span aria-hidden="true" className="body-profile__navigation-spinner" />
                      Đang mở bài tập…
                    </span>
                  )}
                </div>

                {activeMode === "joints" && activeMarkup ? (
                  <div aria-label="Các khớp" className="body-profile__hotspots body-profile__hotspots--joints" role="list">
                    <svg aria-hidden="true" className="body-profile__hotspot-overlay" preserveAspectRatio="xMidYMid meet" viewBox={`0 0 ${hotspotViewBox.width} ${hotspotViewBox.height}`}>
                      {overlayTargets.flatMap((target) => (overlayPositions[target.slug] ?? []).map((position, index) => {
                        const layout = getHotspotPosition(position, hotspotViewBox);
                        const href = withExerciseGender(getTargetRoute(target), activeGender === "female" ? "female" : undefined);

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
