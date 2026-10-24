# Exercise translation completion

On 24 October 2026, the final nine exercises in the source-review queue received reviewed Vietnamese translations. The English source, source hash, media, IDs, categories, targets, and step order were preserved exactly; this batch changed translation rows only.

The translated exercises are `Gate Pose Rounding Spine Looking Up`, `Scorpion Twist Pose`, `Hamstring Stretch Supine Static`, `Hip Extension Into Side Flexion`, `Forearms Stretch Variation Two`, `Seated Ulnar Nerve Tensioner`, `Thread The Needle Hip Over Knees`, `Wild Thing Pose`, and `Hamstring Stretch Seated Single Leg Isometric`.

Live verification confirmed 1,946 reviewed translations: 1,945 Vietnamese and one English, with 6,020 translated steps. All 1,946 exercises now have Vietnamese content. Recovery, Yoga, Stretches, and the previously uncategorized group are fully covered; source warnings remain zero. Anonymous reads returned all 1,946 reviewed translations, and the 291 user favorites and 289 admin-featured exercises were unchanged.

All nine EN/VI detail routes returned HTTP 200 with the localized title, first instruction, and female media. The importer dry-run reported nine unchanged rows and zero pending writes after the guarded live insert.

Files: [live verification](../artifacts/localization/stage-31-after.json), [UI checks](../artifacts/localization/stage-31-ui-checks.json), [prepared translations](../scripts/localization/data/prepared-translations-057.json), [reviewed text](../scripts/localization/data/reviewed-text-058.json), [translation decisions](../scripts/localization/data/translation-review-decisions-024.json), and [empty remaining queue](../artifacts/localization/stage-31-remaining-source-review-queue.json).
