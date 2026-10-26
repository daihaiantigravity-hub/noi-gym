import assert from 'node:assert/strict';
import test from 'node:test';
import { browserOutcomeExitCode, classifyBrowserOutcome, countPlayingVideos } from '../scripts/performance/browser-outcome.mjs';

function successfulSample() {
  return {
    status: 200, errors: [],
    metrics: {
      cardCount: 5, totalVideos: 10, startedVideos: 10, playingVideosAtCapture: 10,
      allVideosStartedMs: 3000, videos: Array.from({ length: 10 }, () => ({ errorCode: null })),
    },
  };
}

test('HTTP 200 without JS errors still fails when video sources are unsupported', () => {
  const result = successfulSample();
  result.metrics.videos.forEach((video) => { video.errorCode = 4; });
  result.metrics.startedVideos = 0;
  result.metrics.playingVideosAtCapture = 0;
  result.metrics.allVideosStartedMs = null;
  const outcome = classifyBrowserOutcome(result, 10);
  assert.equal(outcome.status, 'media-error');
  assert.equal(outcome.mediaErrorCount, 10);
  assert.equal(outcome.passed, false);
  assert.equal(browserOutcomeExitCode([outcome]), 1);
});

test('one failed source rejects an otherwise playing page', () => {
  const result = successfulSample();
  result.metrics.videos[9].errorCode = 3;
  assert.equal(classifyBrowserOutcome(result).status, 'media-error');
});

test('unfinished autoplay is incomplete rather than a proven source error', () => {
  const result = successfulSample();
  result.metrics.startedVideos = 9;
  result.metrics.playingVideosAtCapture = 9;
  result.metrics.allVideosStartedMs = null;
  const outcome = classifyBrowserOutcome(result, 10);
  assert.equal(outcome.status, 'incomplete');
  assert.equal(outcome.reason, 'autoplay-not-complete-within-observation');
  assert.equal(outcome.mediaErrorCount, 0);
  assert.equal(browserOutcomeExitCode([outcome]), 2);
});

test('release smoke does not pass if two expected video elements are missing', () => {
  const result = successfulSample();
  result.metrics.totalVideos = result.metrics.startedVideos = result.metrics.playingVideosAtCapture = 8;
  result.metrics.videos.splice(8);
  assert.equal(classifyBrowserOutcome(result).status, 'passed');
  const outcome = classifyBrowserOutcome(result, 10);
  assert.equal(outcome.status, 'incomplete');
  assert.equal(outcome.reason, 'unexpected-video-count');
  assert.equal(outcome.expectedVideos, 10);
});

test('all ten videos must still be playing when captured', () => {
  const result = successfulSample();
  assert.equal(classifyBrowserOutcome(result, 10).status, 'passed');
  assert.equal(browserOutcomeExitCode([classifyBrowserOutcome(result, 10)]), 0);
  result.metrics.playingVideosAtCapture = 9;
  assert.equal(classifyBrowserOutcome(result, 10).status, 'incomplete');
});

test('an unpaused video that has played but is now buffering does not count as currently playing', () => {
  const videos = Array.from({ length: 10 }, () => ({ paused: false, currentTime: 3, readyState: 4 }));
  assert.equal(countPlayingVideos(videos), 10);
  videos[9].readyState = 1;
  const result = successfulSample();
  result.metrics.playingVideosAtCapture = countPlayingVideos(videos);
  assert.equal(result.metrics.playingVideosAtCapture, 9);
  assert.equal(classifyBrowserOutcome(result, 10).status, 'incomplete');
});

test('page failures take precedence over incomplete samples in the process exit code', () => {
  const failed = classifyBrowserOutcome({ status: 401, errors: [], metrics: null });
  assert.equal(failed.status, 'page-error');
  assert.equal(browserOutcomeExitCode([{ status: 'incomplete', passed: false }, failed]), 1);
  assert.equal(browserOutcomeExitCode([]), 1);
});
