"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";

type BodyView = "front" | "back";

const muscleSlugByGroup: Record<string, string> = {
  "front-shoulders": "shoulders",
  "rear-shoulders": "shoulders",
  "traps-middle": "traps",
};

function BodyViewIcon({ view }: { view: BodyView }) {
  return (
    <svg aria-hidden="true" className="body-view-icon" viewBox="0 0 24 24">
      <circle cx="12" cy="4.5" fill="currentColor" r="1.8" />
      <path d="M12 7.2v6.2m0-4.2-3.2 2.6m3.2-2.6 3.2 2.6m-3.2 2.2-2.5 5m2.5-5 2.5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      {view === "back" && <path d="M10.4 8.7h3.2M10.5 11.1h3M10.8 13.3h2.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1" />}
    </svg>
  );
}

export default function BodyProfileMap() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<BodyView>("front");
  const [svgMarkup, setSvgMarkup] = useState<{ front: string; back: string } | null>(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      fetch("/male-fe.svg"),
      fetch("/male-be.svg"),
    ])
      .then(async ([frontResponse, backResponse]) => {
        if (!frontResponse.ok || !backResponse.ok) {
          throw new Error("Unable to load body maps");
        }

        return {
          front: await frontResponse.text(),
          back: await backResponse.text(),
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

    const muscleSlug = muscleSlugByGroup[groupId] ?? groupId;
    router.push(`/exercises/${muscleSlug}`);
  }

  const bodyLabel = activeView === "front" ? "Cơ trước" : "Cơ sau";
  const activeMarkup = svgMarkup?.[activeView];

  return (
    <>
      <section aria-label="Chọn vùng cơ thể" className="health-card quick-activity-card">
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
      </section>

      <section aria-labelledby="body-profiles-title" className="health-card body-profiles-card">
        <div className="body-profiles-card__header">
          <div>
            <h2 id="body-profiles-title">Body map</h2>
            <p>{bodyLabel}</p>
          </div>
        </div>
        <div className="body-profiles-card__visuals">
          <figure className="body-profile">
            <div className="body-profile__image">
              <div
                aria-label={`${bodyLabel}. Chọn một nhóm cơ để xem bài tập.`}
                className="body-profile__svg"
                onClick={handleMuscleClick}
                role="img"
              >
                {activeMarkup ? (
                  <div dangerouslySetInnerHTML={{ __html: activeMarkup }} />
                ) : (
                  <div aria-hidden="true" className="body-profile__loading" />
                )}
              </div>
            </div>
            {/* <figcaption>{bodyLabel}</figcaption> */}
          </figure>
        </div>
      </section>
    </>
  );
}
