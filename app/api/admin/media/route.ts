import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  exerciseVideoExtension,
  EXERCISE_MEDIA_BUCKET,
  isExerciseVideoType,
  MAX_EXERCISE_VIDEO_DURATION_SECONDS,
  MAX_EXERCISE_VIDEO_SIZE,
} from "@/lib/exercises/media";
import { createSupabaseAdminClient, isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/server";
import { getExerciseMediaPublicUrl } from "@/lib/exercises/media-server";
import { createR2ExerciseMediaUpload, isR2Configured } from "@/lib/storage/r2";

export const runtime = "nodejs";

const storageConfigError = "Video uploads are not enabled. Configure Supabase and run the latest Storage migration.";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to create a video upload session";
  const status = message.includes("permission") ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
      return NextResponse.json({ error: storageConfigError }, { status: 503 });
    }

    await requireAdmin();

    const payload = (await request.json()) as {
      type?: unknown;
      size?: unknown;
      duration?: unknown;
    };
    const type = typeof payload.type === "string" ? payload.type : "";
    const size = typeof payload.size === "number" ? payload.size : Number(payload.size);
    const duration = typeof payload.duration === "number" ? payload.duration : Number(payload.duration);

    if (!isExerciseVideoType(type)) {
      return NextResponse.json({ error: "Only MP4, WebM, or MOV videos are supported." }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_EXERCISE_VIDEO_SIZE) {
      return NextResponse.json({ error: "Videos cannot exceed 25 MB." }, { status: 400 });
    }
    if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_EXERCISE_VIDEO_DURATION_SECONDS) {
      return NextResponse.json({ error: "Videos must be longer than 0 seconds and no longer than 15 seconds." }, { status: 400 });
    }

    const storagePath = `exercises/${crypto.randomUUID()}.${exerciseVideoExtension(type)}`;

    if (isR2Configured()) {
      const upload = await createR2ExerciseMediaUpload({ storagePath, contentType: type });
      return NextResponse.json({
        provider: "r2",
        path: storagePath,
        signedUrl: upload.signedUrl,
        uploadHeaders: upload.headers,
        url: getExerciseMediaPublicUrl(storagePath),
        size,
        type,
        duration,
      });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(EXERCISE_MEDIA_BUCKET).createSignedUploadUrl(storagePath);

    if (error || !data) throw new Error(error?.message || "Unable to create a signed upload URL");

    const { data: publicUrl } = supabase.storage.from(EXERCISE_MEDIA_BUCKET).getPublicUrl(storagePath);
    return NextResponse.json({
      provider: "supabase",
      path: storagePath,
      token: data.token,
      signedUrl: data.signedUrl,
      url: publicUrl.publicUrl,
      size,
      type,
      duration,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
