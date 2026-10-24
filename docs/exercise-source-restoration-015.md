# Exercise source review 8.16

On 23 October 2026, five Yoga exercises were checked against their MuscleWiki pages and male/female videos. Video evidence includes screenshots at selected points in the movement; the source decisions record the URLs, observations, and screenshot checksums.

Four source records were corrected and their Vietnamese content was reviewed:

- `Crow Pose`: clarified the transition from shifting forward and rising onto the toes to placing the knees near the upper arms. The previous wording said to lift the feet while also coming onto tiptoes.
- `Headstand`: added the missing controlled transition into the inversion: tuck the knees, raise the legs, stack the ankles over the hips, hold, then lower with control.
- `Restful Cow Face Pose Legs`: clarified that the first side is held, the legs are released and extended, then the legs are crossed the other way for the second side.
- `Crescent Moon Pose Quad Stretch With Block`: rewrote the instructions by hand role so one hand supports on the block and the other holds the rear foot; the source had assigned both actions to the same hand.

`Scorpion Twist Pose` remains on hold. Its male and female clips show kneeling and prone/supine spinal positions rather than the named inversion and do not establish a reliable replacement sequence. Its source text and translation were left unchanged.

The SQL transaction changed only the `steps` field for the four corrected source records and inserted four reviewed Vietnamese translations. It preserved existing translations and all unrelated source fields, including IDs, media, category, favorites, and timestamps. The source hash changed from `3549a82e950e21b987b4bd41da6148ec9561b428696c095bd4c5db825d7c1cfd` to `4edd28f047f899f6c6621b626c30a68b53552c84168cc6d03216886af166f453`.

Live verification after the SQL run confirmed 1,925 reviewed translations (1,924 Vietnamese and one English), 5,939 translated steps, and 1,925 of 1,946 exercises with Vietnamese content, leaving 21. Yoga coverage is 66/73. Anonymous reads returned all 1,925 reviewed translations; the source scanner reported zero warnings. The 291 user favorites and 289 admin-featured exercises were unchanged. Importer dry-run for batch 049 reported four unchanged records and zero writes.

On localhost:3001, the four corrected exercises displayed their English and Vietnamese titles and complete instruction lists for male and female routes. The localization test set passed 41/41. One broader test sweep had an environment-only failure in `video-source-corrections.test.mjs`: its child-process launch returned `EPERM`; the other tests in that sweep passed. No application code or build was changed.

Files: [live verification](../artifacts/localization/stage-23-after.json), [expected counts](../artifacts/localization/stage-23-expected.json), [SQL repair](../supabase/repairs/20261023_correct_yoga_instructions_stage23.sql), [source decisions](../scripts/localization/data/source-review-decisions-015.json), [source corrections](../scripts/localization/data/source-restorations-016.json), [reviewed translations](../scripts/localization/data/reviewed-translations-049.json), and [remaining review queue](../artifacts/localization/stage-23-remaining-source-review-queue.json). Video screenshots are in `../artifacts/localization/stage-23-video-evidence/`; UI checks are in `../artifacts/localization/stage-23-ui-checks-vi.json` and `stage-23-ui-checks-en.json`. The SQL result screenshot is `../artifacts/localization/stage-23-supabase-result.png`.
