/** Conservative inventory warnings, never guesses or repairs missing source content. */
export function getExerciseSourceIssues(content) {
  const steps = Array.isArray(content.steps) ? content.steps.filter((step) => typeof step === "string") : [];
  const issues = [];
  if (!steps.some((step) => step.trim())) issues.push("missing-instructions");
  if (steps.some((step) => /\b(?:roughly|approximately|about|between|and|or|should be|at(?: an?)?|for an?)\s*$/i.test(step)
    || /\balso make sure to\s*$/i.test(step)
    || /^degrees?\b/i.test(step.trim()) || /^counts?[.!]?$/i.test(step.trim()))) issues.push("possible-truncated-instructions");
  if (steps.some((step) => /\belbow on the inside of your elbow\b/i.test(step))) issues.push("ambiguous-body-reference");
  if (steps.some((step) => /\braise stay flat footed\b/i.test(step))) issues.push("contradictory-instructions");
  if (/\uFFFD|Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]/u.test(JSON.stringify([content.name, content.description, steps]))) issues.push("possible-encoding-error");
  return issues;
}
