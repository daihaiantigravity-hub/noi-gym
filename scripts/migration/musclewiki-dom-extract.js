// Paste this entire IIFE into Chrome DevTools while a MuscleWiki exercise
// listing is already open. It intentionally performs DOM-only extraction:
// there is no navigation, fetch, Playwright, or other network operation.
(() => {
  const clean = (value) => String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();

  const absoluteUrl = (value) => {
    if (!value) return "";
    try {
      return new URL(value, location.href).toString();
    } catch {
      return "";
    }
  };

  const isExerciseUrl = (value) => {
    try {
      return /^\/exercise\/[^/]+\/?$/i.test(new URL(value, location.href).pathname);
    } catch {
      return false;
    }
  };

  const isVisible = (element) => {
    if (!element || !(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0 && (rect.width > 0 || rect.height > 0);
  };

  const firstSrcsetUrl = (element) => {
    if (!element) return "";
    const srcset = element.getAttribute("srcset") || element.getAttribute("data-srcset") || "";
    return srcset
      .split(",")
      .map((candidate) => candidate.trim().split(/\s+/)[0])
      .find(Boolean) || "";
  };

  const backgroundUrls = (element) => {
    const backgroundImage = getComputedStyle(element).backgroundImage || "";
    return [...backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/gi)]
      .map((match) => match[1])
      .filter(Boolean);
  };

  const isUnrelatedMediaUrl = (value) => {
    if (!value || /^(?:data:|blob:|about:|javascript:)/i.test(value)) return true;
    return /(?:logo|qr[-_ ]?code|muscle[-_ ]?map|menu|navigation|advert|advertisement|banner|footer|tracking|pixel|favicon|ezoic|doubleclick|googlesyndication|adservice)/i.test(value);
  };

  const mediaType = (tagName, url) => {
    if (tagName === "video" || /\.(?:mp4|webm|mov|m3u8)(?:$|[?#])/i.test(url)) return "video";
    if (/\.gif(?:$|[?#])/i.test(url)) return "animated-image";
    return "image";
  };

  const inspectMediaElement = (element) => {
    const tag = element.tagName.toLowerCase();
    return {
      tag,
      src: element.getAttribute("src") || "",
      currentSrc: element.currentSrc || "",
      poster: element.getAttribute("poster") || "",
      srcset: element.getAttribute("srcset") || "",
      dataSrc: element.getAttribute("data-src") || "",
      dataSrcset: element.getAttribute("data-srcset") || "",
      backgroundImage: getComputedStyle(element).backgroundImage || "",
      sources: tag === "video"
        ? [...element.querySelectorAll("source")].map((source) => ({
            src: source.getAttribute("src") || "",
            currentSrc: source.currentSrc || "",
            srcset: source.getAttribute("srcset") || "",
            dataSrc: source.getAttribute("data-src") || "",
            dataSrcset: source.getAttribute("data-srcset") || "",
          }))
        : [],
    };
  };

  const inspectMediaElements = (container) => [
    ...container.querySelectorAll("video, img, picture, source"),
  ].map(inspectMediaElement);

  const extractMedia = (container) => {
    const items = [];
    const seen = new Set();
    const add = (tagName, value) => {
      const url = absoluteUrl(value);
      if (!url || isUnrelatedMediaUrl(url) || seen.has(url)) return false;
      seen.add(url);
      items.push({ index: items.length + 1, type: mediaType(tagName, url), url });
      return true;
    };

    // Walking DOM order preserves the order in which demonstration media is
    // rendered. Nested <source> nodes are handled by their parent media node.
    const elements = [container, ...container.querySelectorAll("*")];
    for (const element of elements) {
      const tag = element.tagName?.toLowerCase();
      if (!tag) continue;

      if (tag === "video") {
        const videoUrl = [
          element.currentSrc,
          element.getAttribute("src"),
          ...[...element.querySelectorAll("source")].flatMap((source) => [
            source.currentSrc,
            source.getAttribute("src"),
            source.getAttribute("data-src"),
            firstSrcsetUrl(source),
          ]),
        ].find((value) => {
          const url = absoluteUrl(value);
          return url && !isUnrelatedMediaUrl(url);
        });
        if (videoUrl) add("video", videoUrl);
        else add("img", element.getAttribute("poster"));
      } else if (tag === "img") {
        add("img", [
          element.currentSrc,
          element.getAttribute("src"),
          element.getAttribute("data-src"),
          firstSrcsetUrl(element),
        ].find(Boolean));
      } else if (tag === "picture") {
        const image = element.querySelector("img");
        const source = element.querySelector("source");
        add("img", [
          image?.currentSrc,
          image?.getAttribute("src"),
          image?.getAttribute("data-src"),
          firstSrcsetUrl(image),
          source?.getAttribute("src"),
          source?.getAttribute("data-src"),
          firstSrcsetUrl(source),
        ].find(Boolean));
      } else if (tag === "source") {
        // A <source> under <video> or <picture> is an alternative for its
        // parent and must not become a second demonstration item.
        if (!element.closest("video, picture")) {
          add("source", [
            element.currentSrc,
            element.getAttribute("src"),
            element.getAttribute("data-src"),
            firstSrcsetUrl(element),
          ].find(Boolean));
        }
      }

      for (const backgroundUrl of backgroundUrls(element)) add("img", backgroundUrl);
    }

    return items;
  };

  const detailLinksIn = (container) => [
    ...(isExerciseUrl(container.getAttribute?.("href")) ? [container] : []),
    ...container.querySelectorAll("a[href]"),
  ].filter((anchor) => isExerciseUrl(anchor.href));

  const containerScore = (element, depth) => {
    const links = [...new Set(detailLinksIn(element).map((link) => absoluteUrl(link.href)))];
    if (links.length !== 1) return Number.NEGATIVE_INFINITY;

    const tag = element.tagName.toLowerCase();
    const classAndId = `${element.className || ""} ${element.id || ""}`;
    const text = clean(element.innerText || element.textContent || "");
    let score = 0;
    if (tag === "article" || tag === "li") score += 40;
    if (/(?:exercise|card|tile|result|item)/i.test(classAndId)) score += 30;
    if (element.querySelector("video, img, picture, source")) score += 20;
    if (element.querySelector("h1, h2, h3, h4, h5, h6, [role='heading']")) score += 15;
    if (text.length >= 30 && text.length <= 2_000) score += 10;
    score -= depth;
    return score;
  };

  const findLikelyContainer = (anchor) => {
    const candidates = [];
    let element = anchor;
    let depth = 0;
    while (element && element !== document.body && depth < 12) {
      const score = containerScore(element, depth);
      if (Number.isFinite(score)) candidates.push({ element, score, depth });
      element = element.parentElement;
      depth += 1;
    }
    candidates.sort((left, right) => right.score - left.score || left.depth - right.depth);
    return candidates[0] || { element: anchor, score: 0, depth: 0 };
  };

  const valueAfterLabel = (text, labels) => {
    const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
    const labelPattern = labels
      .map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    for (let index = 0; index < lines.length; index += 1) {
      const sameLine = lines[index].match(new RegExp(`^(?:${labelPattern})\\s*:?\\s+(.+)$`, "i"));
      if (sameLine?.[1]) return clean(sameLine[1]);
      if (new RegExp(`^(?:${labelPattern})\\s*:?$`, "i").test(lines[index])) return lines[index + 1] || "";
    }
    return "";
  };

  const extractDifficulty = (container) => {
    const text = clean(container.innerText || "");
    const labeled = valueAfterLabel(text, ["difficulty", "level"]);
    if (labeled) return labeled;
    return ["Beginner", "Novice", "Intermediate", "Advanced"]
      .find((value) => text.split(/\r?\n/).some((line) => clean(line).toLowerCase() === value.toLowerCase())) ||
      text.match(/\b(Beginner|Novice|Intermediate|Advanced)\b/i)?.[1] || "";
  };

  const extractInstructions = (container) => {
    const roots = [
      ...container.querySelectorAll("[class*='instruction' i], [id*='instruction' i], [class*='step' i], [id*='step' i]"),
    ];
    const heading = [...container.querySelectorAll("h1, h2, h3, h4, h5, h6, strong, b")]
      .find((element) => /^(?:instructions?|steps?)$/i.test(clean(element.textContent)));
    if (heading?.parentElement) roots.push(heading.parentElement);

    for (const root of roots) {
      const items = [...root.querySelectorAll("ol li, ul li")].map((item) => clean(item.textContent)).filter(Boolean);
      if (items.length) return [...new Set(items)];
    }

    const text = clean(container.innerText || "");
    const numbered = [...text.matchAll(/(?:^|\s)\d+[.)]\s+(.+?)(?=\s+\d+[.)]\s+|$)/g)]
      .map((match) => clean(match[1]))
      .filter(Boolean);
    return [...new Set(numbered)];
  };

  const anchors = [...document.querySelectorAll("a[href]")]
    .filter((anchor) => isExerciseUrl(anchor.href) && isVisible(anchor));
  const byUrl = new Map();

  for (const anchor of anchors) {
    const sourceUrl = absoluteUrl(anchor.href);
    if (!sourceUrl || byUrl.has(sourceUrl)) continue;

    const choice = findLikelyContainer(anchor);
    const container = choice.element;
    if (!isVisible(container)) continue;
    const heading = container.querySelector("h1, h2, h3, h4, h5, h6, [role='heading']");
    const image = container.querySelector("img[alt]");
    const name = clean(heading?.textContent || anchor.textContent || image?.alt || "");
    if (!name) continue;

    byUrl.set(sourceUrl, {
      sourceUrl,
      name,
      container,
      score: choice.score,
      depth: choice.depth,
    });
  }

  const diagnostics = [...byUrl.values()].map((candidate) => ({
    sourceUrl: candidate.sourceUrl,
    name: candidate.name,
    container: {
      tag: candidate.container.tagName.toLowerCase(),
      id: candidate.container.id || "",
      className: typeof candidate.container.className === "string" ? candidate.container.className : "",
      score: candidate.score,
      depth: candidate.depth,
    },
    mediaElements: inspectMediaElements(candidate.container),
    extractedMedia: extractMedia(candidate.container),
  }));

  console.log(`Potential exercise containers: ${diagnostics.length}`);
  diagnostics.forEach((candidate, index) => {
    console.group(`Container ${index + 1}: ${candidate.name}`);
    console.log("detail URL:", candidate.sourceUrl);
    console.log("container:", candidate.container);
    console.log("candidate media elements:", candidate.mediaElements);
    console.log("extracted media:", candidate.extractedMedia);
    console.groupEnd();
  });

  const result = {
    sourcePage: location.href,
    capturedAt: new Date().toISOString(),
    exercises: diagnostics.map((candidate) => ({
      name: candidate.name,
      difficulty: extractDifficulty(byUrl.get(candidate.sourceUrl).container),
      instructions: extractInstructions(byUrl.get(candidate.sourceUrl).container),
      sourceUrl: candidate.sourceUrl,
      primaryMuscle: "Biceps",
      equipment: "Dumbbells",
      media: candidate.extractedMedia,
    })),
  };

  console.log(`Found ${result.exercises.length} exercises`);
  result.exercises.forEach((exercise, index) => {
    console.log(`Exercise ${index + 1}: ${exercise.name} - media: ${exercise.media.length}`);
  });

  const serialized = JSON.stringify(result, null, 2);
  copy(serialized);
})();
