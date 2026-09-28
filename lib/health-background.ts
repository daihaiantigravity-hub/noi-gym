import {
  getHealthBackground, getHealthMood, getHealthPreview, getMillisecondsUntilNextHealthMood,
  HEALTH_BACKGROUND_FADE_MS, HEALTH_PREVIEW_PARAM, HEALTH_PREVIEW_STORAGE_KEY, HEALTH_THEMES, type HealthMood,
} from "./health-mood";

/** One persistent viewport background; no scroll handler, polling, or per-card effects. */
export function startHealthBackground(layers: readonly [HTMLDivElement, HTMLDivElement]) {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const development = process.env.NODE_ENV === "development";
  let activeIndex = 0;
  let current: HealthMood | null = null;
  let pending: HealthMood | null = null;
  let animation: Animation | null = null;
  let timer: number | undefined;

  function setCanvas(mood: HealthMood) {
    root.dataset.healthMood = mood;
    root.style.setProperty("--health-canvas-color", HEALTH_THEMES[mood].bottom);
  }

  function apply(mood: HealthMood, immediate = false) {
    if (animation && !immediate) {
      pending = mood;
      return;
    }
    if (immediate) {
      animation?.cancel();
      animation = null;
      pending = null;
      activeIndex = 0;
      layers[0].style.backgroundImage = getHealthBackground(mood);
      layers[0].style.opacity = "1";
      layers[0].style.zIndex = "0";
      layers[1].style.opacity = "0";
      current = mood;
      setCanvas(mood);
      return;
    }
    if (mood === current) return;
    const outgoing = layers[activeIndex];
    const nextIndex = 1 - activeIndex;
    const incoming = layers[nextIndex];
    incoming.style.backgroundImage = getHealthBackground(mood);
    incoming.style.opacity = "0";
    incoming.style.zIndex = "1";
    outgoing.style.zIndex = "0";
    // Keep the outgoing layer opaque: fading both layers would briefly darken the screen.
    animation = incoming.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: HEALTH_BACKGROUND_FADE_MS, easing: "ease-in-out", fill: "forwards",
    });
    animation.onfinish = () => {
      incoming.style.opacity = "1";
      outgoing.style.opacity = "0";
      animation?.cancel();
      animation = null;
      activeIndex = nextIndex;
      current = mood;
      setCanvas(mood);
      const next = pending;
      pending = null;
      if (next) apply(next, reducedMotion.matches);
    };
  }

  function update() {
    window.clearTimeout(timer);
    const now = new Date();
    let stored: string | null = null;
    if (development) {
      try { stored = window.sessionStorage.getItem(HEALTH_PREVIEW_STORAGE_KEY); } catch { /* Storage may be blocked. */ }
    }
    const preview = getHealthPreview(window.location.search, stored, development);
    if (development && new URLSearchParams(window.location.search).has(HEALTH_PREVIEW_PARAM)) {
      try {
        if (preview) window.sessionStorage.setItem(HEALTH_PREVIEW_STORAGE_KEY, preview);
        else window.sessionStorage.removeItem(HEALTH_PREVIEW_STORAGE_KEY);
      } catch { /* Preview still works from the URL without storage. */ }
    }
    apply(preview ?? getHealthMood(now), current === null || reducedMotion.matches || typeof layers[0].animate !== "function");
    if (document.visibilityState !== "hidden" && !preview) {
      timer = window.setTimeout(update, getMillisecondsUntilNextHealthMood(now));
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") window.clearTimeout(timer);
    else update();
  }

  update();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("focus", update);
  window.addEventListener("pageshow", update);
  window.addEventListener("popstate", update);
  reducedMotion.addEventListener("change", update);
  return () => {
    window.clearTimeout(timer);
    animation?.cancel();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", update);
    window.removeEventListener("pageshow", update);
    window.removeEventListener("popstate", update);
    reducedMotion.removeEventListener("change", update);
  };
}
