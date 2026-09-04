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

When Supabase is not configured, the dashboard starts with an empty local source list. To enable authentication and persistent CRUD, copy `.env.example` to `.env.local`, add the Supabase values and `ADMIN_EMAILS`, then run `20260903_create_exercises.sql` and `20260904_add_exercise_videos.sql` in order in the Supabase SQL editor. If you have a dataset JSON, place it at `data/musclewiki-exercises-collected.json` and run `npm run seed:exercises` to import it as Draft records.

The Supabase secret key is server-only and must never use the `NEXT_PUBLIC_` prefix or be exposed to the browser. The app prefers `SUPABASE_SECRET_KEY` (`sb_secret_...`) and still supports the legacy `SUPABASE_SERVICE_ROLE_KEY` name. For the public key, use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the older `NEXT_PUBLIC_SUPABASE_ANON_KEY` name is also supported.

Exercise demo videos are stored in the Supabase Storage bucket `exercise-media`; the exercise record stores the generated public URL, storage path, and duration. The migration creates this bucket with a 25MB limit for MP4, WebM, and MOV files. The admin validates videos at no more than 15 seconds and the public pages play them muted, inline, and on repeat.
