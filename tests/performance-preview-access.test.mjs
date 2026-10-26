import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { createPreviewAccess } from '../scripts/performance/preview-access.mjs';

const origin = 'https://preview.example.test';
const header = 'x-vercel-trusted-oidc-idp-token';
const token = 'test-only-opaque-project-oidc';
const environment = { VERCEL_PREVIEW_OIDC_TOKEN: token, VERCEL_PREVIEW_AUTH_ORIGIN: origin };
const flush = () => new Promise((resolve) => setImmediate(resolve));
class MockCdp extends EventEmitter {
  commands = [];
  async send(method, params) { this.commands.push({ method, params }); }
}

test('anonymous default preserves request options and does not intercept browser requests', async () => {
  const access = createPreviewAccess(origin, {});
  const options = { headers: { Accept: 'text/html' }, redirect: 'manual' };
  assert.equal(access.enabled, false);
  assert.equal(access.fetchOptions(`${origin}/exercises/chest`, options), options);
  const cdp = new MockCdp();
  await (await access.attachToCdp(cdp))();
  assert.deepEqual(cdp.commands, []);
});

test('preview credentials require an explicit exact HTTPS origin and both variables', () => {
  for (const invalid of [
    { VERCEL_PREVIEW_OIDC_TOKEN: token },
    { VERCEL_PREVIEW_AUTH_ORIGIN: origin },
    { ...environment, VERCEL_PREVIEW_AUTH_ORIGIN: `${origin}/` },
    { ...environment, VERCEL_PREVIEW_AUTH_ORIGIN: 'https://another.example.test' },
    { ...environment, VERCEL_PREVIEW_AUTH_ORIGIN: 'http://preview.example.test' },
    { ...environment, VERCEL_PREVIEW_AUTH_ORIGIN: 'invalid' },
    { ...environment, VERCEL_PREVIEW_OIDC_TOKEN: `${token}\r\nHeader: invalid` },
  ]) assert.throws(() => createPreviewAccess(origin, invalid), (error) => !error.message.includes(token));
});

test('HTTP applies token only to exact origin and refuses redirects', () => {
  const access = createPreviewAccess(origin, environment);
  const result = access.fetchOptions(`${origin}/exercises/chest`, { redirect: 'follow', headers: { Accept: 'text/html', [header.toUpperCase()]: 'old' } });
  assert.equal(result.redirect, 'error');
  assert.equal(result.headers[header], token);
  assert.equal(result.headers.Accept, 'text/html');
  assert.equal(Object.keys(result.headers).filter((name) => name.toLowerCase() === header).length, 1);
  for (const url of ['https://media.example.test/video.mp4', 'https://accounts.google.com', `${origin}.evil.test/`, 'http://preview.example.test/']) {
    assert.throws(() => access.fetchOptions(url, {}), /different origin/);
  }
  assert.equal(JSON.stringify(access).includes(token), false);
});

test('CDP access is scoped per request and external redirect hops never receive the token', async () => {
  const access = createPreviewAccess(origin, environment);
  const cdp = new MockCdp();
  const detach = await access.attachToCdp(cdp);
  assert.deepEqual(cdp.commands[0], { method: 'Fetch.enable', params: { patterns: [{ urlPattern: `${origin}/*`, requestStage: 'Request' }] } });
  cdp.emit('Fetch.requestPaused', { requestId: 'preview', request: { url: `${origin}/exercises/chest`, headers: { Accept: 'text/html' } } });
  cdp.emit('Fetch.requestPaused', { requestId: 'redirect', request: { url: 'https://vercel.com/sso-api', headers: { [header.toUpperCase()]: token, Accept: 'text/html' } } });
  cdp.emit('Fetch.requestPaused', { requestId: 'media', request: { url: 'https://media.example.test/video.mp4', headers: { Range: 'bytes=0-' } } });
  await flush();
  const requests = cdp.commands.filter((command) => command.method === 'Fetch.continueRequest');
  assert.equal(requests[0].params.headers.find((entry) => entry.name === header)?.value, token);
  assert.equal(JSON.stringify(requests[1]).includes(token), false);
  assert.equal(JSON.stringify(requests[2]).includes(token), false);
  assert.equal(cdp.commands.some((command) => command.method === 'Network.setExtraHTTPHeaders'), false);
  await detach();
  assert.equal(cdp.listenerCount('Fetch.requestPaused'), 0);
  assert.equal(cdp.commands.at(-1).method, 'Fetch.disable');
});

test('interception errors are redacted and fail the paused request closed', async () => {
  const cdp = new MockCdp();
  const send = cdp.send.bind(cdp);
  cdp.send = async (method, params) => {
    await send(method, params);
    if (method === 'Fetch.continueRequest') throw new Error(`Protocol transport contains ${token}`);
  };
  const errors = [];
  const detach = await createPreviewAccess(origin, environment).attachToCdp(cdp, (error) => errors.push(error.message));
  cdp.emit('Fetch.requestPaused', { requestId: 'failed', request: { url: `${origin}/`, headers: {} } });
  await flush();
  assert.deepEqual(errors, ['Preview access request interception failed.']);
  assert.equal(cdp.commands.some((command) => command.method === 'Fetch.failRequest' && command.params.requestId === 'failed'), true);
  await detach();
});
