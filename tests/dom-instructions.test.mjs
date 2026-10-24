import assert from "node:assert/strict";
import test from "node:test";
import { extractNumberedCardSteps } from "../scripts/migration/dom-instructions.mjs";

test("DOM step labels preserve quantities, angles, ranges and numbers inside names", () => {
  assert.deepEqual(extractNumberedCardSteps("Barbell 30 Degree Shrug\nNovice\n1\nHold arms at roughly 30 degrees.\n2\nHold for 2 seconds then lower."), ["Hold arms at roughly 30 degrees.", "Hold for 2 seconds then lower."]);
  assert.deepEqual(extractNumberedCardSteps("Band Leg Press\nAdvanced\n1\nAnchor 6 to 12 inches above your head.\n2\nExtend your knees."), ["Anchor 6 to 12 inches above your head.", "Extend your knees."]);
  assert.deepEqual(extractNumberedCardSteps("Band Front Raise\nNovice\n1\nStand on one or 2 feet.\n2\nRaise your hands."), ["Stand on one or 2 feet.", "Raise your hands."]);
});

test("DOM parsing retains wrapped paragraphs, repeated steps and inline clock positions", () => {
  assert.deepEqual(extractNumberedCardSteps("Exercise\r\n1.\r\nKeep a neutral spine.\r\nContinue breathing.\r\n\r\n2)\r\nTouch 12, 1, ..., 6.\r\n3\r\nKeep a neutral spine.\r\nRemove Ads"), ["Keep a neutral spine. Continue breathing.", "Touch 12, 1, ..., 6.", "Keep a neutral spine."]);
});

test("unstructured card text uses explicit fallback instead of guessing at inline numbers", () => {
  assert.deepEqual(extractNumberedCardSteps("Exercise Beginner 1 Bend 90 degrees 2 Return.", ["Verified fallback."]), ["Verified fallback."]);
  assert.deepEqual(extractNumberedCardSteps("Exercise\n1\n2\nReturn.", ["Verified fallback."]), ["Verified fallback."]);
  assert.deepEqual(extractNumberedCardSteps("Exercise without numbered steps"), []);
  assert.deepEqual(extractNumberedCardSteps("Exercise without numbered steps", null), []);
});
