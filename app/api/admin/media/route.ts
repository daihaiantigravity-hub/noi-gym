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

export const runtime = "nodejs";

const storageConfigError = "Upload video chưa được bật. Hãy cấu hình Supabase và chạy migration Storage mới.";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Không thể tạo phiên upload video";
  const status = message.includes("quyền") ? 403 : 500;
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
      return NextResponse.json({ error: "Chỉ hỗ trợ video MP4, WebM hoặc MOV." }, { status: 400 });
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_EXERCISE_VIDEO_SIZE) {
      return NextResponse.json({ error: "Video không được vượt quá 25MB." }, { status: 400 });
    }
    if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_EXERCISE_VIDEO_DURATION_SECONDS) {
      return NextResponse.json({ error: "Video phải dài hơn 0 và tối đa 15 giây." }, { status: 400 });
    }

    const storagePath = `exercises/${crypto.randomUUID()}.${exerciseVideoExtension(type)}`;
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(EXERCISE_MEDIA_BUCKET).createSignedUploadUrl(storagePath);

    if (error || !data) throw new Error(error?.message || "Không thể tạo signed upload URL");

    const { data: publicUrl } = supabase.storage.from(EXERCISE_MEDIA_BUCKET).getPublicUrl(storagePath);
    return NextResponse.json({
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
