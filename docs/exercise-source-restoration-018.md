# Exercise source review 8.19

On 23 October 2026, `Reverse Prayer` was checked against its live MuscleWiki page and front and side demonstration views. The source describes interlacing the fingers behind the back, drawing the shoulder blades together, lifting the chest, and pressing the hands down. The video demonstrates the same sequence, so the English source was retained as written. The translation uses `Tư thế cầu nguyện ngược` and preserves the four-step sequence.

The database transaction inserted one reviewed Vietnamese translation and did not modify the exercise source. The source hash remained `56e734d40f05645ebe1bad237878431772388f0bb8464fd8082bb5948b425beb`.

Live verification confirmed 1,928 reviewed translations (1,927 Vietnamese and one English), 5,951 translated steps, and Vietnamese content for 1,928 of 1,946 exercises, leaving 18. Yoga coverage is 68/73. Anonymous reads returned all 1,928 reviewed translations, the source scanner reported zero warnings, and the 291 user favorites and 289 admin-featured exercises were unchanged. Importer dry-run for batch 052 reported one unchanged record and zero writes.

On localhost:3001, the title and all four steps appeared in English and Vietnamese for both male and female routes. The local UI was left in Vietnamese. The 41 relevant localization tests passed when run directly. No application code or build was changed.

Files: [live verification](../artifacts/localization/stage-26-after.json), [expected counts](../artifacts/localization/stage-26-expected.json), [SQL insert](../supabase/repairs/20261023_add_reverse_prayer_vi_translation_stage26.sql), [source review decision](../scripts/localization/data/source-review-decisions-019.json), [reviewed translation](../scripts/localization/data/reviewed-translations-052.json), [video observations](../artifacts/localization/stage-26-video-evidence/observations.json), [UI checks](../artifacts/localization/stage-26-ui-checks.json), and [remaining review queue](../artifacts/localization/stage-26-remaining-source-review-queue.json).
