"use client";

import { useHealthBackground } from "@/hooks/useHealthBackground";

export default function HealthBackground() {
  const [firstLayer, secondLayer] = useHealthBackground();
  return (
    <div aria-hidden="true" className="health-background">
      <div className="health-background__layer" ref={firstLayer} />
      <div className="health-background__layer health-background__layer--reserve" ref={secondLayer} />
    </div>
  );
}
