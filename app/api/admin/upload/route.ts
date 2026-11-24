import { NextResponse } from "next/server";
import sharp from "sharp";
import { currentAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Chưa chọn file." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Ảnh tối đa 10MB." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Chỉ nhận file ảnh." }, { status: 400 });
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input);
    const metadata = await image.metadata();
    const alreadyOptimized =
      metadata.format === "webp" &&
      (metadata.width ?? 0) <= 1800 &&
      (metadata.height ?? 0) <= 1800;

    // Admin UI already converts product photos to WebP in the browser.
    // Keep those bytes as-is to avoid a second lossy encode.
    const optimized = alreadyOptimized
      ? input
      : await image
          .rotate()
          .resize({
            width: 1800,
            height: 1800,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82 })
          .toBuffer();

    const path = `products/${crypto.randomUUID()}.webp`;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, optimized, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return NextResponse.json({
      path,
      url: data.publicUrl,
      originalSize: file.size,
      optimizedSize: optimized.byteLength,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể xử lý ảnh.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
