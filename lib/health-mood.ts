type HealthTheme = {
  startHour: number;
  top: string;
  bottom: string;
  middle?: { color: string; position: number };
  glow: { color: string; x: number; y: number; radiusX: number; radiusY: number };
};

// App design choices, not official Samsung Health parameters. All times are device-local.
export const HEALTH_THEMES = {
  morning: { startHour: 5, top: "#0F3A5A", bottom: "#182430", glow: { color: "#705720", x: 0, y: 55, radiusX: 85, radiusY: 55 } },
  midday: { startHour: 10, top: "#14221D", bottom: "#14221D", glow: { color: "#846315", x: 50, y: 0, radiusX: 90, radiusY: 45 } },
  afternoon: { startHour: 14, top: "#13221D", bottom: "#13221D", glow: { color: "#4E472A", x: 50, y: 0, radiusX: 90, radiusY: 40 } },
  evening: { startHour: 17, top: "#0D264B", bottom: "#2B1D0D", middle: { color: "#15243A", position: 35 }, glow: { color: "#633D13", x: 55, y: 68, radiusX: 85, radiusY: 50 } },
  night: { startHour: 20, top: "#0B1826", bottom: "#101B20", glow: { color: "#17314A", x: 50, y: 0, radiusX: 90, radiusY: 40 } },
} as const satisfies Record<string, HealthTheme>;

export type HealthMood = keyof typeof HEALTH_THEMES;
export const HEALTH_MOODS = Object.keys(HEALTH_THEMES) as HealthMood[];
export const DEFAULT_HEALTH_MOOD: HealthMood = "night";
export const HEALTH_BACKGROUND_FADE_MS = 1000;
export const HEALTH_PREVIEW_PARAM = "healthTheme";
export const HEALTH_PREVIEW_STORAGE_KEY = "health-theme-preview";

export function isHealthMood(value: string | null | undefined): value is HealthMood {
  return Boolean(value && Object.hasOwn(HEALTH_THEMES, value));
}

export function getHealthMood(date: Date): HealthMood {
  const hour = date.getHours();
  return [...HEALTH_MOODS].reverse().find((mood) => hour >= HEALTH_THEMES[mood].startHour) ?? "night";
}

export function getMillisecondsUntilNextHealthMood(date: Date): number {
  const next = HEALTH_MOODS.find((mood) => HEALTH_THEMES[mood].startHour > date.getHours());
  const boundary = new Date(date);
  if (!next) boundary.setDate(boundary.getDate() + 1);
  boundary.setHours(HEALTH_THEMES[next ?? HEALTH_MOODS[0]].startHour, 0, 0, 0);
  return Math.max(1, boundary.getTime() - date.getTime());
}

export function getHealthBackground(mood: HealthMood): string {
  const theme: HealthTheme = HEALTH_THEMES[mood];
  const { color, x, y, radiusX, radiusY } = theme.glow;
  const rgb = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16)).join(", ");
  const middle = theme.middle ? `${theme.middle.color} ${theme.middle.position}%, ` : "";
  // The center is the requested target color, not a low-opacity tint over the whole screen.
  return `radial-gradient(ellipse ${radiusX}% ${radiusY}% at ${x}% ${y}%, ${color} 0%, rgba(${rgb}, 0.68) 25%, rgba(${rgb}, 0.24) 55%, rgba(${rgb}, 0) 100%), linear-gradient(180deg, ${theme.top} 0%, ${middle}${theme.bottom} 100%)`;
}

export function getHealthPreview(search: string, stored: string | null, development: boolean): HealthMood | null {
  if (!development) return null;
  const requested = new URLSearchParams(search).get(HEALTH_PREVIEW_PARAM);
  if (requested !== null) return isHealthMood(requested) ? requested : null;
  return isHealthMood(stored) ? stored : null;
}

// Runs in <head> before first paint. Only trusted, generated configuration enters this script.
export function getHealthBackgroundBootstrapScript(development: boolean): string {
  const themes = HEALTH_MOODS.map((mood) => ({
    mood, start: HEALTH_THEMES[mood].startHour, background: getHealthBackground(mood), bottom: HEALTH_THEMES[mood].bottom,
  }));
  return `(function() {
    var themes = ${JSON.stringify(themes)};
    var hour = new Date().getHours();
    var theme = themes[themes.length - 1];
    for (var i = 0; i < themes.length; i++) {
      if (hour >= themes[i].start) theme = themes[i];
    }
    if (${development}) {
      var key = ${JSON.stringify(HEALTH_PREVIEW_STORAGE_KEY)};
      var query = new URLSearchParams(location.search).get(${JSON.stringify(HEALTH_PREVIEW_PARAM)});
      var saved = null;
      try { saved = sessionStorage.getItem(key); } catch (error) {}
      var requested = query === null ? saved : query;
      var preview = themes.find(function(candidate) { return candidate.mood === requested; });
      if (preview) theme = preview;
      try {
        if (query !== null) {
          if (preview) sessionStorage.setItem(key, preview.mood);
          else sessionStorage.removeItem(key);
        }
      } catch (error) {}
    }
    var root = document.documentElement;
    root.dataset.healthMood = theme.mood;
    root.style.setProperty('--health-initial-background', theme.background);
    root.style.setProperty('--health-canvas-color', theme.bottom);
  })();`;
}
