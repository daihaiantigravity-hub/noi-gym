import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

function load(relativePath, imports, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  });
  vm.runInNewContext(outputText, {
    exports, ...globals,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected import ${name}`);
      return imports[name];
    },
  });
  return exports;
}

const signedIn = {
  user: { id: "user-a", email: "a@example.test", name: "User A", avatarUrl: null },
  isAdmin: false,
};

function endpoint({ configured = true, session = null, getError = null, signOutError = null, throwAt = null } = {}) {
  const state = { clientCalls: 0, signOutCalls: 0 };
  state.route = load("../app/api/auth/session/route.ts", {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/admin-auth": { isAdminUser: () => false },
    "@/lib/supabase/server": {
      isSupabaseConfigured: () => configured,
      createSupabaseServerClient: async () => {
        state.clientCalls++;
        if (throwAt === "client") throw new Error("private client details");
        return { auth: {
          getSession: async () => {
            if (throwAt === "get") throw new Error("private provider details");
            return { data: { session }, error: getError };
          },
          signOut: async () => {
            state.signOutCalls++;
            if (throwAt === "signOut") throw new Error("private provider details");
            return { error: signOutError };
          },
        } };
      },
    },
  });
  return state;
}

function assertPrivate(response) {
  assert.equal(response.headers.get("cache-control"), "private, no-store");
}

test("session GET keeps anonymous and account responses out of shared caches", async () => {
  for (const session of [null, { user: { ...signedIn.user, user_metadata: { full_name: "User A" } } }]) {
    const response = await endpoint({ session }).route.GET();
    assert.equal(response.status, 200);
    assertPrivate(response);
    assert.deepEqual(await response.json(), session ? signedIn : { user: null, isAdmin: false });
  }
});

test("unconfigured auth remains anonymous and logout succeeds without constructing a client", async () => {
  const state = endpoint({ configured: false });
  const get = await state.route.GET();
  const logout = await state.route.DELETE();
  assertPrivate(get); assertPrivate(logout);
  assert.equal(get.status, 200); assert.equal(logout.status, 200);
  assert.deepEqual(await logout.json(), { signedOut: true });
  assert.equal(state.clientCalls, 0);
});

test("session check failures are sanitized and do not claim the user signed out", async () => {
  for (const failure of [{ getError: { message: "private provider details" } }, { throwAt: "get" }, { throwAt: "client" }]) {
    const response = await endpoint(failure).route.GET();
    assert.equal(response.status, 503);
    assertPrivate(response);
    assert.deepEqual(await response.json(), { error: "Unable to check your sign-in status." });
  }
});

test("logout reports provider errors instead of falsely confirming sign-out", async () => {
  for (const failure of [{ signOutError: { status: 503, message: "private provider details" } }, { throwAt: "signOut" }, { throwAt: "client" }]) {
    const response = await endpoint(failure).route.DELETE();
    assert.equal(response.status, 503);
    assertPrivate(response);
    assert.deepEqual(await response.json(), { error: "Unable to sign out. Please try again." });
  }
});

test("logout only confirms success after the provider finishes successfully", async () => {
  const state = endpoint();
  const response = await state.route.DELETE();
  assert.equal(response.status, 200);
  assertPrivate(response);
  assert.deepEqual(await response.json(), { signedOut: true });
  assert.equal(state.signOutCalls, 1);
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function componentHarness() {
  const slots = [];
  const effects = [];
  const requests = [];
  const state = { resets: 0, refreshes: 0 };
  let cursor = 0;
  const imports = {
    react: {
      useRef(value) {
        const index = cursor++;
        return slots[index] ?? (slots[index] = { current: value });
      },
      useState(initial) {
        const index = cursor++;
        slots[index] ??= { value: initial };
        return [slots[index].value, (value) => {
          slots[index].value = typeof value === "function" ? value(slots[index].value) : value;
        }];
      },
      useEffect(callback, deps) {
        const index = cursor++;
        const previous = slots[index];
        if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { deps, cleanup: callback() };
        });
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: "a" },
    "next/navigation": { useRouter: () => ({ refresh: () => state.refreshes++ }) },
    "@/lib/exercises/use-saved-exercise": { resetSavedExercises: () => state.resets++ },
    "@/components/LanguageProvider": { useAppLanguage: () => ({ language: "en" }) },
    "@/lib/i18n/messages": {
      getMessages: () => new Proxy({}, { get: (_, key) => key }),
      translate: (_language, key, values) => `${key}: ${values.name}`,
    },
  };
  const { default: Component } = load("../components/auth/UserAuthButton.tsx", imports, {
    AbortController, DOMException, URL,
    window: { location: { href: "https://app.example.test/exercises/chest" }, setTimeout, clearTimeout },
    document: { addEventListener() {}, removeEventListener() {} },
    fetch(url, options) {
      const pending = deferred();
      // Deliberately allow late responses even after abort: the response body
      // may already be resolving when the user clicks Sign out.
      requests.push({ url, options, ...pending });
      return pending.promise;
    },
  });
  function render() {
    cursor = 0;
    const tree = Component({ initialSession: signedIn });
    effects.splice(0).forEach((effect) => effect());
    return tree;
  }
  function find(predicate, node = render()) {
    if (!node || typeof node !== "object") return null;
    if (predicate(node)) return node;
    const children = Array.isArray(node.props?.children) ? node.props.children : [node.props?.children];
    for (const child of children) {
      const match = find(predicate, child ?? null);
      if (match) return match;
    }
    return null;
  }
  function startLogout() {
    find((node) => node.props?.className === "health-avatar health-avatar--profile").props.onClick();
    return find((node) => node.type === "button" && node.props.children === "signOut").props.onClick();
  }
  render();
  return {
    state, requests, find, startLogout,
    isSignedIn: () => Boolean(find((node) => node.props?.className === "health-avatar health-avatar--profile")),
    logoutButton: () => find((node) => node.type === "button" && node.props.children === "signOut"),
    alert: () => find((node) => node.props?.role === "alert"),
  };
}

test("a delayed initial session response cannot restore the avatar after successful logout", async () => {
  const view = componentHarness();
  const logout = view.startLogout();
  assert.equal(view.requests[0].options.signal.aborted, true);
  view.requests[1].resolve(Response.json({ signedOut: true }));
  await logout;
  assert.equal(view.isSignedIn(), false);
  view.requests[0].resolve(Response.json(signedIn));
  await flush();
  assert.equal(view.isSignedIn(), false);
  assert.equal(view.state.resets, 1); assert.equal(view.state.refreshes, 1);
});

test("initial session completion cannot re-enable Sign out while logout is pending", async () => {
  const view = componentHarness();
  const logout = view.startLogout();
  view.requests[0].resolve(Response.json(signedIn));
  await flush();
  assert.equal(view.logoutButton().props.disabled, true);
  view.requests[1].resolve(Response.json({ signedOut: true }));
  await logout;
  assert.equal(view.isSignedIn(), false);
});

test("failed logout retains the avatar and saved exercises and offers a retry", async () => {
  const view = componentHarness();
  const logout = view.startLogout();
  view.requests[1].resolve(Response.json({ error: "Unavailable" }, { status: 503 }));
  await logout;
  assert.equal(view.isSignedIn(), true);
  assert.equal(view.logoutButton().props.disabled, false);
  assert.equal(view.alert().props.children, "signOutFailed");
  assert.equal(view.state.resets, 0); assert.equal(view.state.refreshes, 0);
  view.requests[0].reject(new Error("stale session request failure"));
  await flush();
  assert.equal(view.alert().props.children, "signOutFailed");
  const retry = view.logoutButton().props.onClick();
  view.requests[2].resolve(Response.json({ signedOut: true }));
  await retry;
  assert.equal(view.isSignedIn(), false);
  assert.equal(view.state.resets, 1);
});
