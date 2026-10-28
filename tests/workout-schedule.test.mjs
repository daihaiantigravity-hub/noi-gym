import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadSchedule() {
  const exports = {};
  const source = fs.readFileSync(new URL("../lib/workout-schedule.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const constants = {};
  const constantsSource = fs.readFileSync(new URL("../lib/exercises/constants.ts", import.meta.url), "utf8");
  const constantsCompiled = ts.transpileModule(constantsSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(constantsCompiled.outputText, { exports: constants });
  vm.runInNewContext(compiled.outputText, {
    exports,
    require(name) {
      assert.equal(name, "@/lib/exercises/constants");
      return constants;
    },
  });
  return exports;
}

const schedule = loadSchedule();

test("weekday indexing follows the Monday-first schedule across Sunday and Monday", () => {
  assert.equal(schedule.getMondayFirstDayIndex(new Date(2026, 9, 26, 12)), 0);
  assert.equal(schedule.getMondayFirstDayIndex(new Date(2026, 9, 27, 12)), 1);
  assert.equal(schedule.getMondayFirstDayIndex(new Date(2026, 10, 1, 12)), 6);
});

test("Monday-first dates cross month and year boundaries using local calendar days", () => {
  const cases = [
    [new Date(2026, 10, 1, 23, 59), ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"]],
    [new Date(2027, 0, 1, 0, 1), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]],
  ];
  for (const [today, expected] of cases) {
    const originalTime = today.getTime();
    const dates = schedule.getMondayFirstWeekDates(today);
    const localKeys = Array.from(dates, (day) => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`);
    assert.deepEqual(localKeys, expected);
    assert.equal(today.getTime(), originalTime);
  }
});

test("the editable default has seven days and returns independent group arrays", () => {
  const first = schedule.createDefaultWorkoutSchedule();
  const second = schedule.createDefaultWorkoutSchedule();
  assert.equal(first.length, 7);
  assert.deepEqual(Array.from(first, ({ weekday }) => weekday), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(Array.from(first[6].muscleGroups), []);
  first[0].muscleGroups.push("Cardio");
  assert.ok(!second[0].muscleGroups.includes("Cardio"));
});

test("schedule validation accepts seven unique days and empty rest days", () => {
  const valid = schedule.createDefaultWorkoutSchedule();
  assert.equal(schedule.isValidWorkoutSchedule(valid), true);
  assert.equal(schedule.isValidWorkoutSchedule(valid.map((day) => ({ ...day, muscleGroups: [] }))), true);
});

test("schedule validation rejects missing, duplicate, unknown, or duplicate muscle data", () => {
  const valid = schedule.createDefaultWorkoutSchedule();
  assert.equal(schedule.isValidWorkoutSchedule(valid.slice(1)), false);
  assert.equal(schedule.isValidWorkoutSchedule(valid.map((day, index) => index === 6 ? { ...day, weekday: 1 } : day)), false);
  assert.equal(schedule.isValidWorkoutSchedule(valid.map((day, index) => index === 0 ? { ...day, muscleGroups: ["Unknown"] } : day)), false);
  assert.equal(schedule.isValidWorkoutSchedule(valid.map((day, index) => index === 0 ? { ...day, muscleGroups: ["Chest", "Chest"] } : day)), false);
});

test("normalization returns Monday through Sunday and treats missing saved rows as rest", () => {
  const normalized = schedule.normalizeWorkoutSchedule([{ weekday: 3, muscle_groups: ["Chest"] }]);
  assert.equal(normalized.length, 7);
  assert.deepEqual(Array.from(normalized[2].muscleGroups), ["Chest"]);
  assert.deepEqual(Array.from(normalized[0].muscleGroups), []);
  assert.deepEqual(Array.from(normalized[6].muscleGroups), []);
});

test("database migration enables RLS and binds every operation to the current user", () => {
  const sql = fs.readFileSync(new URL("../supabase/migrations/20261027_create_user_weekly_workout_schedules.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/i);
  assert.equal((sql.match(/auth\.uid\(\)/gi) ?? []).length, 6);
  assert.match(sql, /primary key \(user_id, weekday\)/i);
  for (const group of schedule.WORKOUT_SCHEDULE_GROUPS) {
    assert.ok(sql.includes(`'${group.replaceAll("'", "''")}'`), `Migration should permit the workout group ${group}`);
  }
});
