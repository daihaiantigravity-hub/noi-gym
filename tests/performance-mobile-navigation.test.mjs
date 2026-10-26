import assert from 'node:assert/strict';
import test from 'node:test';
import { assessSnapshot, maximumClsWindow } from '../scripts/performance/check-mobile-navigation.mjs';

const sample = () => ({
  language: 'vi', horizontalOverflowPx: 0, cls: 0,
  cards: [{ hasTitle: true }],
  videos: [{ errorCode: null, paused: false, ended: false, readyState: 4, currentTime: 3 }],
});

test('empty card/video arrays cannot pass mobile acceptance', () => {
  const value = sample();
  value.cards = []; value.videos = [];
  assert.deepEqual(assessSnapshot(value, 'vi'), ['missing-cards', 'missing-videos']);
});

test('all rendered videos must be playing, unended and error-free', () => {
  const value = sample();
  assert.deepEqual(assessSnapshot(value, 'vi'), []);
  for (const change of [{ paused: true }, { ended: true }, { readyState: 1 }, { currentTime: 0 }]) {
    value.videos = [{ ...sample().videos[0], ...change }];
    assert.ok(assessSnapshot(value, 'vi').includes('incomplete-autoplay'));
  }
  value.videos = [{ ...sample().videos[0], errorCode: 4 }];
  assert.ok(assessSnapshot(value, 'vi').includes('media-error'));
});

test('wrong language, horizontal overflow and missing title reject a populated page', () => {
  const value = { ...sample(), horizontalOverflowPx: 20, cards: [{ hasTitle: false }], cls: 0.11 };
  assert.deepEqual(assessSnapshot(value, 'en'), ['missing-card-titles', 'wrong-language', 'horizontal-overflow', 'layout-shift']);
});

test('CLS excludes recent input and separates one-second gap session windows', () => {
  const entries = [
    { startMs: 100, value: 0.05, recentInput: false },
    { startMs: 200, value: 0.07, recentInput: false },
    { startMs: 300, value: 0.9, recentInput: true },
    { startMs: 1400, value: 0.1, recentInput: false },
  ];
  assert.equal(maximumClsWindow(entries), 0.12000000000000001);
  assert.equal(maximumClsWindow([]), 0);
});
