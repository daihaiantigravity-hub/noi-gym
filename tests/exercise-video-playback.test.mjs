import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import * as jsxRuntime from 'react/jsx-runtime';
import ts from 'typescript';

const transpile = (file) => ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
}).outputText;
const source = transpile('../components/LazyExerciseVideo.tsx');
const messages = {};
vm.runInNewContext(transpile('../lib/i18n/messages.ts'), { exports: messages });
const namedError = (name) => Object.assign(new Error(name), { name });

// Execute the component's real event handlers/effects with persistent hook slots.
// This isolates media-event ordering and promises, not browser decoding or policy.
function harness({ language = 'en', play = () => Promise.resolve(), mobile = false } = {}) {
  let cursor = 0, children = [], properties = { src: 'https://media.example/one.mp4', poster: 'https://media.example/one.webp', label: 'Chest demo', className: 'video' };
  let intersectionCallback = null;
  let intersectionOptions = null;
  const slots = [], pendingEffects = [];
  const sameDeps = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  const hooks = {
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: initial };
      return [slots[index].value, (value) => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { deps, callback };
      return slots[index].callback;
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (sameDeps(slots[index]?.deps, deps)) return;
      pendingEffects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: effect() }; });
    },
  };
  const exports = {};
  class TestIntersectionObserver {
    constructor(callback, options) { intersectionCallback = callback; intersectionOptions = options; }
    observe() {}
    disconnect() {}
  }
  vm.runInNewContext(source, {
    exports, HTMLMediaElement: { HAVE_CURRENT_DATA: 2 },
    window: { matchMedia: () => ({ matches: mobile }) },
    IntersectionObserver: TestIntersectionObserver,
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return jsxRuntime;
      if (name === './LanguageProvider') return { useAppLanguage: () => ({ language }) };
      if (name === '@/lib/i18n/messages') return messages;
      throw new Error(`Unexpected import ${name}`);
    },
  });
  const video = {
    readyState: 0, muted: false, error: null, playCalls: 0, loadCalls: 0, pauseCalls: 0,
    getAttribute(name) { return name === 'src' ? properties.src : null; },
    play() { this.playCalls++; return play(this); },
    pause() { this.pauseCalls++; },
    load() { this.loadCalls++; this.error = null; this.readyState = 0; },
  };
  const api = {
    video,
    get intersectionOptions() { return intersectionOptions; },
    render(next = {}) {
      properties = { ...properties, ...next }; cursor = 0;
      children = exports.default(properties).props.children.filter(Boolean);
      api.element('video').props.ref(video);
      pendingEffects.splice(0).forEach((effect) => effect());
      return api;
    },
    element(type) { return children.find((child) => child.type === type); },
    emit(name) { api.element('video').props[name]({ currentTarget: video }); return api.render(); },
    setVisible(visible) { intersectionCallback?.([{ isIntersecting: visible }]); return api.render(); },
    async settle() { await new Promise((resolve) => setImmediate(resolve)); return api.render(); },
  };
  return api.render();
}

test('mobile automatically starts a demo near the viewport and pauses it when scrolled away', async () => {
  const state = harness({ mobile: true });
  await state.settle();
  assert.equal(state.intersectionOptions.rootMargin, '0px');
  assert.equal(state.video.playCalls, 0);
  assert.equal(state.element('video').props.autoPlay, false);
  state.setVisible(true);
  assert.equal(state.video.playCalls, 1);
  assert.equal(state.element('video').props.autoPlay, true);
  state.setVisible(false);
  assert.equal(state.video.pauseCalls, 1);
  assert.equal(state.element('video').props.autoPlay, false);
});

test('playing uncovers the video when loadeddata was never delivered', async () => {
  const state = harness();
  assert.ok(state.element('img'));
  state.video.readyState = 4;
  state.emit('onPlaying');
  assert.equal(state.element('img'), undefined);
  assert.equal(state.element('video').props['data-lazy-video-state'], 'playing');
  assert.equal(state.element('button'), undefined);
  await state.settle();
});

test('canplay can uncover a decoded frame without initiating another play request', async () => {
  const state = harness();
  state.video.readyState = 2;
  state.emit('onCanPlay');
  assert.equal(state.element('img'), undefined);
  assert.equal(state.video.playCalls, 1);
  await state.settle();
});

test('blocked autoplay provides a user-gesture Play action without reloading media', async () => {
  let blocked = true;
  const state = harness({ play: () => blocked ? Promise.reject(namedError('NotAllowedError')) : Promise.resolve() });
  await state.settle();
  const button = state.element('button');
  assert.equal(button.props.type, 'button');
  assert.equal(button.props['aria-label'], 'Play video: Chest demo');
  assert.equal(state.element('video').props['data-lazy-video-state'], 'blocked');
  blocked = false;
  button.props.onClick();
  assert.equal(state.video.playCalls, 2, 'play is called synchronously within the click');
  assert.equal(state.video.loadCalls, 0);
  state.emit('onPlaying');
  await state.settle();
  assert.equal(state.element('button'), undefined);
  assert.equal(state.element('img'), undefined);
});

test('a media error provides translated Retry and only an explicit click reloads the source', async () => {
  const state = harness({ language: 'vi' });
  await state.settle();
  state.video.error = { code: 4 };
  state.emit('onError');
  await state.settle();
  assert.equal(state.element('button').props['aria-label'], 'Thử lại video: Chest demo');
  assert.equal(state.video.loadCalls, 0);
  assert.equal(state.video.playCalls, 1);
  state.element('button').props.onClick();
  assert.equal(state.video.loadCalls, 1);
  assert.equal(state.video.playCalls, 2);
  state.video.readyState = 4;
  state.emit('onLoadedData');
  assert.equal(state.video.playCalls, 2, 'loadeddata shares the pending retry');
  state.emit('onPlaying');
  await state.settle();
  assert.equal(state.element('button'), undefined);
});

test('an aborted play request does not create a false unsupported-media state or a retry loop', async () => {
  const state = harness({ play: () => Promise.reject(namedError('AbortError')) });
  await state.settle();
  await state.settle();
  assert.equal(state.element('button'), undefined);
  assert.equal(state.video.playCalls, 1);
  assert.equal(state.video.loadCalls, 0);
});

test('a rejection from an old source cannot cover a newer playing video with an error action', async () => {
  const pending = [];
  const state = harness({ play: () => new Promise((resolve, reject) => pending.push({ resolve, reject })) });
  state.render({ src: 'https://media.example/two.mp4' });
  assert.equal(pending.length, 2);
  state.video.readyState = 4;
  state.emit('onPlaying');
  pending[1].resolve();
  pending[0].reject(namedError('NotAllowedError'));
  await state.settle();
  assert.equal(state.element('button'), undefined);
  assert.equal(state.element('img'), undefined);
  assert.equal(state.element('video').props.src, 'https://media.example/two.mp4');
  assert.equal(state.element('video').props['data-lazy-video-state'], 'playing');
});

test('loadeddata does not issue concurrent duplicate play requests', async () => {
  let resolve;
  const state = harness({ play: () => new Promise((done) => { resolve = done; }) });
  state.video.readyState = 4;
  state.emit('onLoadedData');
  state.emit('onLoadedData');
  assert.equal(state.video.playCalls, 1);
  resolve();
  await state.settle();
});
