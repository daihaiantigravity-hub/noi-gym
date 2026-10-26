// Optional Vercel project OIDC access. The token stays in a closure and is never
// included in benchmark options, artifacts, URLs or command-line arguments.
const TOKEN_HEADER = 'x-vercel-trusted-oidc-idp-token';

export function createPreviewAccess(origin, environment = process.env) {
  const token = environment.VERCEL_PREVIEW_OIDC_TOKEN;
  const authorizedOrigin = environment.VERCEL_PREVIEW_AUTH_ORIGIN;
  if (!token && !authorizedOrigin) {
    return {
      enabled: false,
      fetchOptions: (_url, options) => options,
      attachToCdp: async () => async () => {},
    };
  }
  if (!token || !authorizedOrigin) throw new Error('Preview access requires both environment variables.');
  let configured;
  try { configured = new URL(authorizedOrigin); } catch { throw new Error('Invalid preview access origin.'); }
  if (configured.protocol !== 'https:' || configured.origin !== authorizedOrigin || authorizedOrigin !== origin) {
    throw new Error('Preview access origin must exactly match the benchmark HTTPS origin.');
  }
  if (token !== token.trim() || /[\r\n]/.test(token)) throw new Error('Invalid preview access token format.');

  const matchesOrigin = (url) => {
    try { return new URL(url).origin === origin; } catch { return false; }
  };
  const cleanHeaders = (headers) => Object.fromEntries(Object.entries(headers ?? {}).filter(([name]) => name.toLowerCase() !== TOKEN_HEADER));

  return {
    enabled: true,
    fetchOptions(url, options) {
      if (!matchesOrigin(url)) throw new Error('Preview access cannot be sent to a different origin.');
      return {
        ...options,
        headers: { ...cleanHeaders(options.headers), [TOKEN_HEADER]: token },
        // Custom auth headers must never follow redirects to SSO or another host.
        redirect: 'error',
      };
    },
    async attachToCdp(cdp, onError = () => {}) {
      let closing = false;
      const onPaused = (event) => {
        const headers = cleanHeaders(event.request.headers);
        if (matchesOrigin(event.request.url)) headers[TOKEN_HEADER] = token;
        // CDP Fetch header overrides apply to this request only, not redirect
        // hops. Scope interception to the preview origin so R2/Google never
        // receive this token. Unlike Playwright routing this preserves caching
        // and does not buffer streamed HTML before displaying it.
        void cdp.send('Fetch.continueRequest', {
          requestId: event.requestId,
          headers: Object.entries(headers).map(([name, value]) => ({ name, value: String(value) })),
        }).catch(() => {
          if (!closing) onError(new Error('Preview access request interception failed.'));
          void cdp.send('Fetch.failRequest', { requestId: event.requestId, errorReason: 'Aborted' }).catch(() => {});
        });
      };
      cdp.on('Fetch.requestPaused', onPaused);
      try {
        await cdp.send('Fetch.enable', { patterns: [{ urlPattern: `${origin}/*`, requestStage: 'Request' }] });
      } catch {
        cdp.off('Fetch.requestPaused', onPaused);
        throw new Error('Could not enable scoped preview access.');
      }
      return async () => {
        closing = true;
        try { await cdp.send('Fetch.disable'); } catch { /* Browser may already have closed. */ }
        cdp.off('Fetch.requestPaused', onPaused);
      };
    },
  };
}
