const clean = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

/** Only standalone, sequential DOM step labels delimit instructions. */
export function extractNumberedCardSteps(cardText, fallback = []) {
  const fallbackSteps = Array.isArray(fallback) ? fallback.map(clean).filter(Boolean) : [];
  const lines = String(cardText ?? "").replace(/\u00a0/g, " ").split(/\r?\n/);
  const steps = [];
  let parts = null;
  let expected = 1;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || /^Remove Ads$/i.test(line)) continue;
    if (new RegExp(`^${expected}[.)]?$`).test(line)) {
      if (parts) {
        const step = clean(parts.join(" "));
        if (!step) return fallbackSteps;
        steps.push(step);
      }
      parts = [];
      expected++;
    } else if (parts) {
      parts.push(line);
    }
  }
  if (parts) {
    const step = clean(parts.join(" "));
    if (step) steps.push(step);
    else return fallbackSteps;
  }
  return steps.length ? steps : fallbackSteps;
}
