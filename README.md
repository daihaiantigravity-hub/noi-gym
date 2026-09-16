This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin exercise dashboard

The exercise manager lives at `/admin/exercises`. It supports creating, editing, publishing, and importing exercise records from the JSON files in `data/`.

When Supabase is not configured, the dashboard starts with an empty local source list. To enable authentication and persistent CRUD, copy `.env.example` to `.env.local`, add the Supabase values and `ADMIN_EMAILS`, then run `20260903_create_exercises.sql`, `20260904_add_exercise_videos.sql`, and `20260916_create_exercise_targets.sql` in order in the Supabase SQL editor. If you have a dataset JSON, place it at `data/musclewiki-exercises-collected.json` and run `npm run seed:exercises` to import it as Draft records.

For the manually captured Biceps/Dumbbells DOM dataset, run `npm run prepare:musclewiki-import` first. The converter writes an import-compatible dataset to `scripts/migration/data/musclewiki-exercises-collected.json`; `npm run seed:exercises` prefers that generated file and falls back to `data/musclewiki-exercises-collected.json`. Other MuscleWiki groups can use the converter's `--input`, `--checkpoint`, `--output`, `--primary-muscle`, and `--equipment` options.

After seeding, run `npm run upload:musclewiki-media` to download, validate, and upload the captured MP4 videos to the `exercise-media` Supabase Storage bucket and link them to the imported records. Use `npm run upload:musclewiki-media -- --dry-run --limit 1` to validate a sample without changing Supabase.

The home body map also supports MuscleWiki's `Advanced` anatomy and `Joints` views. The crawl artifact for these routes is stored at `scripts/migration/data/musclewiki-target-crawl.json`. After applying the target migration, run `npm run import:musclewiki-targets` to upsert the 23 advanced and 6 joint mappings without duplicating shared exercises. New target exercises are written to `scripts/migration/data/musclewiki-target-new-import.json`; run `npm run upload:musclewiki-targets` to upload their MP4 demos when needed.

Example for Chest/Dumbbells: `node scripts/migration/convert-musclewiki-dom-to-import.mjs --input scripts/migration/data/musclewiki-chest-dumbbells.json --checkpoint scripts/migration/data/musclewiki-chest-dumbbells.checkpoint.json --output scripts/migration/data/musclewiki-chest-dumbbells-import.json --primary-muscle Chest --equipment Dumbbells`, then run `npm run seed:exercises -- --dataset scripts/migration/data/musclewiki-chest-dumbbells-import.json` and `npm run upload:musclewiki-media -- --dataset scripts/migration/data/musclewiki-chest-dumbbells-import.json`.

The Supabase secret key is server-only and must never use the `NEXT_PUBLIC_` prefix or be exposed to the browser. The app prefers `SUPABASE_SECRET_KEY` (`sb_secret_...`) and still supports the legacy `SUPABASE_SERVICE_ROLE_KEY` name. For the public key, use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the older `NEXT_PUBLIC_SUPABASE_ANON_KEY` name is also supported.

Exercise demo videos are stored in the Supabase Storage bucket `exercise-media`; the exercise record stores the generated public URL, storage path, and duration. The migration creates this bucket with a 25MB limit for MP4, WebM, and MOV files. The admin validates videos at no more than 15 seconds and the public pages play them muted, inline, and on repeat.

## MuscleWiki migration scraper

The Playwright scraper for all paginated dumbbell biceps exercises writes `scripts/migration/data/musclewiki-biceps-dumbbells.json` and keeps resumable state in the adjacent `.checkpoint.json` file:

```bash
npm run migrate:musclewiki:biceps-dumbbells
```

For a visible browser with a persistent profile, run:

```bash
npm run migrate:musclewiki:biceps-dumbbells:browser
```

The browser profile is stored in `scripts/migration/browser-profile/musclewiki/` and is ignored by Git. If MuscleWiki presents a challenge or no exercise cards, the browser stays open and the scraper periodically checks for manual verification; it never interacts with the challenge. Use `--fresh` to discard those two exact data/checkpoint files and start over.

### Manual DOM capture

When MuscleWiki blocks repeated automated browsing, browse the desired listing page manually in normal Chrome, open DevTools Console, and paste `scripts/migration/musclewiki-dom-extract.js`. This diagnostic extractor reads only the currently rendered DOM, never navigates or makes network requests, prints candidate containers and media elements, and copies the resulting JSON to the clipboard with `copy(...)`. It does not open detail pages; run it once per manually opened listing page and combine the copied `exercises` arrays if the source has multiple pages.
