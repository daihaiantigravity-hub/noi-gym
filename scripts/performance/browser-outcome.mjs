// Separate a media failure from a sample that merely ran out of observation
// time. Neither is sufficient evidence to accept a release's autoplay behavior.
export function countPlayingVideos(videos) {
  return videos.filter((video) => !video.paused && video.currentTime > 0 && video.readyState >= 2).length;
}

export function classifyBrowserOutcome(result, expectedVideos = null) {
  const metrics = result.metrics;
  const mediaErrorCount = metrics?.videos?.filter((video) => video.errorCode != null).length ?? 0;
  if (mediaErrorCount) return { status: 'media-error', passed: false, mediaErrorCount };
  if (result.status !== 200 || !metrics || result.errors.length || !metrics.cardCount) {
    return { status: 'page-error', passed: false, mediaErrorCount: 0 };
  }
  if (expectedVideos != null && metrics.totalVideos !== expectedVideos) {
    return { status: 'incomplete', passed: false, reason: 'unexpected-video-count', expectedVideos, mediaErrorCount: 0 };
  }
  if (!metrics.totalVideos || metrics.startedVideos !== metrics.totalVideos
    || metrics.playingVideosAtCapture !== metrics.totalVideos || metrics.allVideosStartedMs == null) {
    return { status: 'incomplete', passed: false, reason: 'autoplay-not-complete-within-observation', mediaErrorCount: 0 };
  }
  return { status: 'passed', passed: true, mediaErrorCount: 0 };
}

export function browserOutcomeExitCode(outcomes) {
  if (!outcomes.length || outcomes.some((outcome) => outcome.status === 'media-error' || outcome.status === 'page-error')) return 1;
  return outcomes.every((outcome) => outcome.passed) ? 0 : 2;
}
