# Exercise media migration

This project can serve exercise videos from Cloudflare R2 while keeping Supabase for Auth and the database. Existing database rows do not need to be rewritten: every stored media item already has a stable `storagePath`, and the server derives its public URL from `R2_PUBLIC_BASE_URL` when R2 is configured.

The migration command only copies and verifies objects. It has no delete operation.

## 1. Create the primary R2 bucket

Create a Cloudflare R2 Standard bucket named `noi-gym-exercise-media`. Attach a public custom domain when possible; an `r2.dev` public URL is also sufficient for a migration test.

Create an R2 API token limited to Object Read & Write for this bucket. Add these values to `.env.local`:

```dotenv
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=noi-gym-exercise-media
R2_PUBLIC_BASE_URL=https://media.example.com
R2_MIGRATED_EXERCISE_GENDERS=male
EXERCISE_MEDIA_UNAVAILABLE_PATHS=
```

The browser uploads videos directly to a signed R2 URL. Configure bucket CORS with the production origin and the local development origin:

```json
[
  {
    "AllowedOrigins": ["https://your-production-domain.example", "http://localhost:3001"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["content-type", "cache-control"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 2. Add an optional independent backup

Any S3-compatible target works. For Backblaze B2, create a private bucket and an application key limited to read/write access for that bucket:

```dotenv
MEDIA_BACKUP_S3_ENDPOINT=https://s3.region.backblazeb2.com
MEDIA_BACKUP_S3_REGION=region
MEDIA_BACKUP_S3_BUCKET_NAME=noi-gym-exercise-media-backup
MEDIA_BACKUP_S3_ACCESS_KEY_ID=
MEDIA_BACKUP_S3_SECRET_ACCESS_KEY=
```

When these variables are absent, the migration verifies only R2. When all are present, every source object must verify against both R2 and the backup before it is counted as complete.

## 3. Inventory, copy, and verify

Use Node.js 20 or newer for the migration scripts and the AWS SDK.

### Rebuild from the preserved MuscleWiki sources

When Supabase Storage is restricted by `exceed_storage_size_quota`, the repository can rebuild the
bucket from the original MuscleWiki URLs preserved in the local migration datasets. First generate a
local inventory without uploading anything:

```powershell
npm run migrate:media:musclewiki:r2
```

The command defaults to male media so a resumed run cannot start copying female media by accident.
Run a small verified male sample, then the complete male transfer:

```powershell
npm run migrate:media:musclewiki:r2:male -- --apply --limit 4 --concurrency 2
npm run migrate:media:musclewiki:r2:male -- --apply --concurrency 12
```

Female media remains on Supabase while `R2_MIGRATED_EXERCISE_GENDERS=male`. Transfer it explicitly
with `--gender female`; add `female` to the environment variable only after its own copy and checksum
verification are complete. After both verified transfers, use `R2_MIGRATED_EXERCISE_GENDERS=male,female`.

If a source video is unavailable from both the original URL and Supabase, add its comma-separated
storage path to `EXERCISE_MEDIA_UNAVAILABLE_PATHS`. The application preserves its poster and hides
the broken video URL.

Every uploaded video is downloaded from R2 and compared to the source with SHA-256. Progress is
resumable through `artifacts/media-migration/musclewiki-r2-manifest.jsonl`; the current totals and any
unavailable source URLs are written to the gender-specific `musclewiki-r2-male-summary.json` or
`musclewiki-r2-female-summary.json`. A target object with different bytes is reported and is never
overwritten.

This route reconstructs the expected exercise media paths without changing Supabase. A SQL inventory
of the current project confirmed that the 19 unavailable original URLs were never present in the
Supabase bucket, so they are marked unavailable instead of being routed to a broken fallback.

The same inventory found 15 older noncanonical objects under `exercises/`. Fourteen MP4 files match
verified canonical exercise videos by exercise, angle, duration, and exact byte size; their original
UUID paths were recreated from those canonical bytes on R2 and verified again with SHA-256. One
unreferenced 9,937-byte JPG remains only in Supabase and must be retained until Storage access is
restored.

### Copy the exact Supabase objects

Supabase Storage must be available long enough to list and download the source bucket. Start with one object:

```powershell
npm run migrate:media:r2 -- --limit 1
npm run migrate:media:r2 -- --apply --limit 1
```

The first command is read-only. The second command performs the copy and then downloads the target object to compare its SHA-256 with the source.

After the sample passes, copy the complete bucket:

```powershell
npm run migrate:media:r2 -- --apply --concurrency 4
```

The command is resumable. It writes two local files under `artifacts/media-migration/`:

- `manifest.jsonl`: path, byte size, MIME type, SHA-256, source metadata, and verification result for every target.
- `summary.json`: discovered, verified, resumed, uploaded, and failed counts.

An existing target object is never overwritten. If its size or bytes differ from the Supabase object, the command reports a failure and continues with other objects.

## 4. Cut over the application

The application switches only the genders listed in `R2_MIGRATED_EXERCISE_GENDERS` to R2 when
`R2_PUBLIC_BASE_URL` is present. New admin uploads still use R2. Before deploying those variables:

1. Confirm `failedObjects` is empty in `summary.json`.
2. Compare the exact Supabase and R2 inventories, including manually uploaded non-MuscleWiki files.
3. Test male and female front/side videos through the public R2 URL.
4. Keep the Supabase objects unchanged through the first production verification period.

Removing `R2_PUBLIC_BASE_URL` rolls video delivery back to the URLs stored in Supabase. New admin uploads use R2 only when the complete R2 credential set and public base URL are configured; otherwise they retain the current Supabase upload path.

## 5. Restore Auth and the database without changing the restricted project

The verified local backup is stored in
`artifacts/media-migration/supabase-backup-2026-10-14/`. It contains 1,946 exercises, 628 target
links, the combined schema, typed JSON, source CSV batches, and SHA-256 hashes in `manifest.json`.

Create a separate Supabase project, run `schema.sql` in its SQL Editor, then create
`.env.restore.local` locally:

```dotenv
RESTORE_SUPABASE_URL=https://new-project-ref.supabase.co
RESTORE_SUPABASE_SECRET_KEY=replace_with_the_new_project_secret_key
```

Validate the local backup without contacting Supabase:

```powershell
npm run restore:supabase:backup
```

Restore only after the new schema is ready:

```powershell
npm run restore:supabase:backup -- --apply
```

The restore command refuses to write to the restricted source project, refuses a nonempty target,
inserts in bounded batches, and verifies the final row counts. Afterward, update the application's
Supabase URL, publishable key, secret key, and admin user. R2 configuration remains unchanged.

## 6. Retention

Keep the checksum manifest outside the repository together with a copy of `.env.local` in the project's secure credential store. Do not remove any Supabase object until R2 and the independent backup both contain the complete verified set and the production application has passed playback checks.
