# Exercise source review 8.15

On 23 October 2026, five Yoga exercises were reviewed against their public MuscleWiki pages and male/female video variants. The review saved 20 initial video screenshots and additional selected-step evidence for the two corrections.

Two source records and Vietnamese translations were corrected:

- `Table Top Pose Variation 3`: removed `Beginner`, which had been imported as an instruction although it is the difficulty badge. Corrected the final instruction so it returns to neutral tabletop instead of saying to lower hands that were already on the mat. The four translated steps now match the four instructions shown on the source page.
- `Crescent Moon Pose Quad Stretch`: corrected the impossible hand assignment. The rear-side hand holds the foot/ankle; the free hand or a block provides balance. Both male and female clips show the right-foot-forward lunge and the left hand holding the rear left foot.

Three candidates remain held because the sampled clips do not settle the conflicting details consistently across genders: `Gate Pose Rounding Spine Looking Up`, `Thread The Needle Hip Over Knees`, and `Wild Thing Pose`. Their source text and translations were left unchanged.

The transaction changed only the `steps` field on the two source rows and inserted two reviewed Vietnamese translations. It preserved their timestamps, media, category, and other fields. The source hash moved from `e444cd605435192a7810f9792e223ffb426e3d40d15e1e05768800a8cc57be5c` to `3549a82e950e21b987b4bd41da6148ec9561b428696c095bd4c5db825d7c1cfd`.

Live verification confirmed 1,921 reviewed translations (1,920 Vietnamese and one English), 5,921 translated steps, 1,921 exercises with Vietnamese content, and 25 still missing Vietnamese. Yoga coverage is 62/73. Anonymous reads returned all 1,921 reviewed translations; source warnings remain at zero. The 291 user favorites and 289 admin-featured exercises were unchanged. Importer dry-run reported two unchanged rows and zero writes.

The local detail page displayed both corrected titles and four Vietnamese steps, and English/Vietnamese content was checked for the male and female routes. The relevant localization tests passed 41/41. No application code or build was changed.

Files: [stage 22 expected counts](../artifacts/localization/stage-22-expected.json), [live verification](../artifacts/localization/stage-22-after.json), [SQL repair](../supabase/repairs/20261023_correct_yoga_instructions_stage22.sql), [source decisions](../scripts/localization/data/source-review-decisions-014.json), [source corrections](../scripts/localization/data/source-restorations-015.json), [reviewed translations](../scripts/localization/data/reviewed-translations-048.json), and video evidence in `../artifacts/localization/stage-22-video-evidence/`. Supabase result screenshot: `../artifacts/localization/stage-22-supabase-result.png`.
