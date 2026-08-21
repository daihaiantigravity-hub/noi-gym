"use client";

import { useEffect, useState } from "react";

type MuscleMapProps = {
  isMale: boolean;
};

type BodyView = "front" | "back";

export default function MuscleMap({ isMale }: MuscleMapProps) {
  const bodyType = isMale ? "male" : "female";
  const [activeView, setActiveView] = useState<BodyView>("front");
  const [svgMarkup, setSvgMarkup] = useState<{ front: string; back: string } | null>(null);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      fetch(`/${bodyType}-fe.svg`).then((response) => response.text()),
      fetch(`/${bodyType}-be.svg`).then((response) => response.text()),
    ]).then(([front, back]) => {
      if (isCurrent) {
        setSvgMarkup({ front, back });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [bodyType]);

  const renderFigure = (markup: string | undefined, label: string) => (
    <figure className="muscle-map__figure">
      {markup ? (
        <div
          className="muscle-map__svg"
          role="img"
          aria-label={label}
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        <div className="muscle-map__loading" aria-hidden="true" />
      )}
    </figure>
  );

  return (
    <section className={`muscle-map muscle-map--${activeView}`} aria-label={`${isMale ? "Male" : "Female"} muscle map`}>
      <div className="muscle-map__labels">
        <span className="muscle-map__label">Front View</span>
        <span className="muscle-map__label">Back View</span>
        <div className="muscle-map__view-toggle" role="group" aria-label="Choose body view">
          <button
            className={activeView === "front" ? "muscle-map__view-button muscle-map__view-button--active" : "muscle-map__view-button"}
            type="button"
            aria-label="Show front view"
            aria-pressed={activeView === "front"}
            onClick={() => setActiveView("front")}
          >
            Front
          </button>
          <button
            className={activeView === "back" ? "muscle-map__view-button muscle-map__view-button--active" : "muscle-map__view-button"}
            type="button"
            aria-label="Show back view"
            aria-pressed={activeView === "back"}
            onClick={() => setActiveView("back")}
          >
            Back
          </button>
        </div>
      </div>
      <div className="muscle-map__figures">
        {renderFigure(svgMarkup?.front, `${isMale ? "Male" : "Female"} front body view`)}
        {renderFigure(svgMarkup?.back, `${isMale ? "Male" : "Female"} back body view`)}
      </div>
    </section>
  );
}
