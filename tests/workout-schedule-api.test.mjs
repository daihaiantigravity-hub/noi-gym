import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadRoute(state) {
  const exports = {};
  const source = fs.readFileSync(new URL("../app/api/user/workout-schedule/route.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const scheduleModule = {};
  const scheduleSource = fs.readFileSync(new URL("../lib/workout-schedule.ts", import.meta.url), "utf8");
  const scheduleCompiled = ts.transpileModule(scheduleSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(scheduleCompiled.outputText, {
    exports: scheduleModule,
    require: () => ({ EXERCISE_MUSCLES: ["Abdominals", "Biceps", "Calves", "Chest", "Glutes", "Hamstrings", "Lats", "Lower back", "Obliques", "Quads", "Shoulders", "Triceps"] }),
  });

  class AuthenticationRequiredError extends Error {}
  const supabase = {
    from(table) {
      assert.equal(table, "user_weekly_workout_schedules");
      const query = {
        select() { return this; },
        eq(column, value) { state.filters.push([column, value]); return this; },
        order() { return this; },
        upsert(rows, options) { state.upsert = { rows, options }; return this; },
        then(resolve) { resolve({ data: state.rows, error: state.dbError }); },
      };
      return query;
    },
  };

  vm.runInNewContext(compiled.outputText, {
    exports,
    Request,
    Date,
    require(name) {
      if (name === "next/cache") return { revalidatePath: (path) => state.revalidated.push(path) };
      if (name === "next/server") return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) } };
      if (name === "@/lib/workout-schedule") return scheduleModule;
      if (name === "@/lib/user-auth") return { AuthenticationRequiredError, requireUser: async () => {
        if (!state.authenticated) throw new AuthenticationRequiredError();
        return { user: { id: state.userId }, supabase };
      } };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return exports;
}

function createState() {
  return { authenticated: true, userId: "user-1", rows: [], filters: [], revalidated: [], upsert: null, dbError: null };
}

function validSchedule() {
  return Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, muscleGroups: index === 6 ? [] : ["Chest"] }));
}

test("GET returns the authenticated user's rows with private no-store headers", async () => {
  const state = createState();
  state.rows = [{ weekday: 1, muscle_groups: ["Chest"] }];
  const response = await loadRoute(state).GET();
  assert.equal(response.status, 200);
  assert.equal(response.body.schedule.length, 7);
  assert.deepEqual(Array.from(response.body.schedule[0].muscleGroups), ["Chest"]);
  assert.match(response.headers["Cache-Control"], /private, no-store/);
  assert.deepEqual(state.filters, [["user_id", "user-1"]]);
});

test("PUT upserts all seven days for the authenticated user and revalidates home", async () => {
  const state = createState();
  const response = await loadRoute(state).PUT(new Request("https://app.example.test/api/user/workout-schedule", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: validSchedule() }),
  }));
  assert.equal(response.status, 200);
  assert.equal(state.upsert.rows.length, 7);
  assert.ok(state.upsert.rows.every((row) => row.user_id === "user-1"));
  assert.equal(state.upsert.options.onConflict, "user_id,weekday");
  assert.deepEqual(state.revalidated, ["/", "/schedule/edit"]);
});

test("PUT rejects malformed or incomplete schedules before database writes", async () => {
  const state = createState();
  const response = await loadRoute(state).PUT(new Request("https://app.example.test/api/user/workout-schedule", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: validSchedule().slice(1) }),
  }));
  assert.equal(response.status, 400);
  assert.equal(state.upsert, null);
});

test("GET and PUT require a signed-in user", async () => {
  const state = createState();
  state.authenticated = false;
  const route = loadRoute(state);
  assert.equal((await route.GET()).status, 401);
  const response = await route.PUT(new Request("https://app.example.test/api/user/workout-schedule", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schedule: validSchedule() }),
  }));
  assert.equal(response.status, 401);
  assert.equal(state.upsert, null);
});
