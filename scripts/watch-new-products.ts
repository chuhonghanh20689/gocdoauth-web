import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import sharp from "sharp";
import { google } from "googleapis";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN?.trim();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY?.trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Thiếu SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY."
  );
}

if (
  !GOOGLE_CLIENT_ID ||
  !GOOGLE_CLIENT_SECRET ||
  !GOOGLE_REFRESH_TOKEN ||
  !GOOGLE_API_KEY
) {
  throw new Error(
    "Thiếu GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN hoặc GOOGLE_API_KEY."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SHEETS = [
  {
    categorySlug: "perfumes",
    categoryName: "Nước hoa",
    spreadsheetId: "1cHL7fBMdqiItfClY0xu6JsnIVcDiwfAh5-32hwpyxTI",
    range: "list!A:I",
  },
  {
    categorySlug: "watches",
    categoryName: "Đồng hồ",
    spreadsheetId: "1q8w0dzsva7oGbIiEWF4QPyazOIFyDm_YWLr9DHPWCKs",
    range: "list!A:H",
  },
] as const;

type SheetConfig = (typeof SHEETS)[number];

type ProductRow = {
  rowNumber: number;
  no: number | null;
  sku: string;
  description: string;
  brand: string;
  code: string;
  cost: number | null;
  price: number | null;
  volume: string | null;
  photos: string;
};

type Category = { id: string; slug: string; name: string };
type Brand = { id: string; slug: string; name: string };
type DriveImage = { id: string; name: string; mimeType: string };

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function parseVnd(value: unknown): number | null {
  const raw = text(value);
  if (!raw) return null;

  const digits = raw.replace(/[^0-9-]/g, "");
  if (!digits || digits === "-") return null;

  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function parseVolume(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;

  if (/ml$/i.test(raw)) return raw;

  const numeric = Number(raw.replace(/,/g, "."));
  if (Number.isFinite(numeric)) return `${numeric}ml`;

  return raw;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function getColumn(row: unknown[], headers: string[], name: string): unknown {
  const index = headers.findIndex(
    (h) => h.trim().toLowerCase() === name.trim().toLowerCase()
  );
  return index >= 0 ? row[index] : "";
}

function deriveProductName(
  description: string,
  sku: string,
  code: string
): string {
  const firstLine = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine || code || sku;
}

function extractDriveFolderId(url: string): string | null {
  if (!url) return null;

  const folderMatch = url.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  const idMatch = url.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return idMatch?.[1] ?? null;
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function makeGoogleClients() {
  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  if (!auth) throw new Error("Không tạo được Google OAuth client.");

  return {
    sheets: google.sheets({
      version: "v4",
      auth,
      key: GOOGLE_API_KEY,
    }),
    drive: google.drive({
      version: "v3",
      auth,
      key: GOOGLE_API_KEY,
    }),
  };
}

async function getSheetRows(
  sheets: ReturnType<typeof makeGoogleClients>["sheets"],
  config: SheetConfig
): Promise<ProductRow[]> {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: config.range,
  });

  const values = result.data.values ?? [];
  if (values.length < 2) return [];

  const headers = values[0].map((v) => text(v));
  const rows: ProductRow[] = [];

  values.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const noRaw = text(getColumn(row, headers, "No"));
    const sku = text(getColumn(row, headers, "SKU"));
    const description = text(getColumn(row, headers, "Description"));
    const brand = text(getColumn(row, headers, "Brand"));
    const code = text(getColumn(row, headers, "Code"));
    const cost = parseVnd(getColumn(row, headers, "Cost"));
    const price = parseVnd(getColumn(row, headers, "Price"));
    const volume = parseVolume(getColumn(row, headers, "Dung tích"));
    const photos = text(getColumn(row, headers, "Photos"));

    if (!sku && !description && !brand && !code && !price && !photos) return;

    rows.push({
      rowNumber,
      no: noRaw ? Number(noRaw) || null : null,
      sku,
      description,
      brand,
      code,
      cost,
      price,
      volume,
      photos,
    });
  });

  return rows;
}

async function getOrCreateCategory(
  sb: SupabaseClient,
  config: SheetConfig
): Promise<Category> {
  const { data, error } = await sb
    .from("categories")
    .select("id,slug,name")
    .eq("slug", config.categorySlug)
    .limit(1);

  if (error) throw error;
  if (data?.[0]) return data[0] as Category;

  const { data: created, error: createError } = await sb
    .from("categories")
    .insert({
      name: config.categoryName,
      slug: config.categorySlug,
      sort_order: config.categorySlug === "watches" ? 1 : 2,
      is_active: true,
    })
    .select("id,slug,name")
    .single();

  if (createError) throw createError;
  return created as Category;
}

async function getOrCreateBrand(
  sb: SupabaseClient,
  categoryId: string,
  brandName: string
): Promise<Brand> {
  const brandSlug = slugify(brandName);

  const { data, error } = await sb
    .from("brands")
    .select("id,slug,name")
    .eq("category_id", categoryId)
    .eq("slug", brandSlug)
    .limit(1);

  if (error) throw error;
  if (data?.[0]) return data[0] as Brand;

  const { data: created, error: createError } = await sb
    .from("brands")
    .insert({
      name: brandName,
      slug: brandSlug,
      category_id: categoryId,
      is_active: true,
      sort_order: 0,
    })
    .select("id,slug,name")
    .single();

  if (createError) throw createError;
  return created as Brand;
}

async function getExistingSkus(
  sb: SupabaseClient,
  categoryId: string,
  skus: string[]
): Promise<Set<string>> {
  const unique = [...new Set(skus.filter(Boolean))];
  const existing = new Set<string>();

  // Current sheets are small, so one query is enough. Keep chunks for safety
  // if the sheets grow much larger later.
  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500);

    const { data, error } = await sb
      .from("products")
      .select("sku")
      .eq("category_id", categoryId)
      .in("sku", chunk);

    if (error) throw error;

    for (const row of data ?? []) {
      if (row.sku) existing.add(String(row.sku).trim());
    }
  }

  return existing;
}

async function createProduct(
  sb: SupabaseClient,
  category: Category,
  brand: Brand,
  row: ProductRow,
  config: SheetConfig
): Promise<{ id: string; name: string }> {
  const name = deriveProductName(row.description, row.sku, row.code);
  const slug = slugify(`${brand.name}-${name}-${row.sku}`) || slugify(row.sku);

  const payload = {
    category_id: category.id,
    brand_id: brand.id,
    sku: row.sku,
    name,
    price: row.price,
    cost: row.cost,
    currency: "VND",
    description: row.description,
    details: row.code ? `Mã sản phẩm: ${row.code}` : "",
    volume: config.categorySlug === "perfumes" ? row.volume : null,
    condition: "",
    status: "published",
    featured: false,
    sort_order: row.no ?? 0,
    slug,
  };

  const { data, error } = await sb
    .from("products")
    .insert(payload)
    .select("id,name")
    .single();

  if (error) throw error;

  return data as { id: string; name: string };
}

async function listImagesRecursive(
  drive: ReturnType<typeof makeGoogleClients>["drive"],
  folderId: string,
  visited = new Set<string>()
): Promise<DriveImage[]> {
  if (visited.has(folderId)) return [];
  visited.add(folderId);

  const files: DriveImage[] = [];
  let pageToken: string | undefined;

  do {
    const result = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType)",
      pageSize: 1000,
      pageToken,
      orderBy: "name_natural",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const file of result.data.files ?? []) {
      if (!file.id || !file.mimeType) continue;

      if (isImageMime(file.mimeType)) {
        files.push({
          id: file.id,
          name: file.name ?? file.id,
          mimeType: file.mimeType,
        });
      } else if (file.mimeType === "application/vnd.google-apps.folder") {
        files.push(...(await listImagesRecursive(drive, file.id, visited)));
      }
    }

    pageToken = result.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

async function downloadAndOptimizeImage(
  drive: ReturnType<typeof makeGoogleClients>["drive"],
  fileId: string
): Promise<Buffer> {
  const result = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );

  const input = Buffer.from(result.data as ArrayBuffer);

  return sharp(input)
    .rotate()
    .resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
}

async function importImages(
  sb: SupabaseClient,
  drive: ReturnType<typeof makeGoogleClients>["drive"],
  productId: string,
  productName: string,
  photosUrl: string
): Promise<number> {
  const folderId = extractDriveFolderId(photosUrl);
  if (!folderId) {
    throw new Error(`Link Photos không phải Google Drive folder hợp lệ: ${photosUrl}`);
  }

  const files = await listImagesRecursive(drive, folderId);

  if (!files.length) {
    throw new Error(`Folder Photos không có ảnh: ${photosUrl}`);
  }

  const imageRows: Array<{
    product_id: string;
    storage_path: string;
    alt: string;
    sort_order: number;
  }> = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];

    process.stdout.write(
      `    ảnh ${index + 1}/${files.length}: ${file.name} ... `
    );

    try {
      const buffer = await downloadAndOptimizeImage(drive, file.id);
      const storagePath = `imports/drive/${file.id}.webp`;

      const { error: uploadError } = await sb.storage
        .from("product-images")
        .upload(storagePath, buffer, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "31536000",
        });

      if (uploadError) throw uploadError;

      imageRows.push({
        product_id: productId,
        storage_path: storagePath,
        alt: productName,
        sort_order: index,
      });

      console.log("OK");
    } catch (error) {
      console.log(
        `BỎ QUA (${error instanceof Error ? error.message : String(error)})`
      );
    }
  }

  if (!imageRows.length) {
    throw new Error(`Không import được ảnh nào cho SKU ${productName}.`);
  }

  const { error: insertError } = await sb
    .from("product_images")
    .insert(imageRows);

  if (insertError) throw insertError;

  return imageRows.length;
}

async function deleteProductCompletely(
  sb: SupabaseClient,
  productId: string
): Promise<void> {
  await sb.from("product_images").delete().eq("product_id", productId);

  const { error } = await sb.from("products").delete().eq("id", productId);
  if (error) throw error;
}

async function importNewRow(
  sb: SupabaseClient,
  drive: ReturnType<typeof makeGoogleClients>["drive"],
  config: SheetConfig,
  category: Category,
  row: ProductRow
): Promise<number> {
  if (!row.sku) throw new Error("Thiếu SKU.");
  if (!row.brand) throw new Error("Thiếu Brand.");

  if (config.categorySlug === "perfumes" && !row.volume) {
    throw new Error("Nước hoa thiếu Dung tích.");
  }

  if (!row.photos) {
    throw new Error("Thiếu link Photos.");
  }

  // Re-check immediately before insert so a duplicate cannot be created
  // if another workflow/manual import ran at the same time.
  const { data: duplicate, error: duplicateError } = await sb
    .from("products")
    .select("id")
    .eq("category_id", category.id)
    .eq("sku", row.sku)
    .limit(1);

  if (duplicateError) throw duplicateError;
  if (duplicate?.[0]) {
    console.log(`  ↳ SKU ${row.sku} đã có trên web — bỏ qua.`);
    return 0;
  }

  const brand = await getOrCreateBrand(sb, category.id, row.brand);
  const product = await createProduct(sb, category, brand, row, config);

  try {
    const imageCount = await importImages(
      sb,
      drive,
      product.id,
      product.name,
      row.photos
    );

    console.log(
      `  ✓ ĐĂNG MỚI — ${row.sku} — ${product.name} — ${imageCount} ảnh`
    );

    return imageCount;
  } catch (error) {
    // Do not leave a published product with broken/missing images.
    // The row remains absent from the DB, so the next daily run retries it.
    try {
      await deleteProductCompletely(sb, product.id);
    } catch (cleanupError) {
      console.error(
        `  ⚠ Không rollback được product ${row.sku}:`,
        cleanupError
      );
    }

    throw error;
  }
}

async function main() {
  console.log("=== GÓC ĐỒ AUTH — DAILY NEW PRODUCT SYNC ===");
  console.log("Chỉ đăng SKU chưa tồn tại trên website.\n");

  const { sheets, drive } = makeGoogleClients();

  const summary = {
    scanned: 0,
    imported: 0,
    skippedExisting: 0,
    skippedInvalid: 0,
    failed: 0,
    images: 0,
  };

  for (const config of SHEETS) {
    console.log(`\n--- ${config.categoryName.toUpperCase()} ---`);

    const category = await getOrCreateCategory(supabase, config);
    const rows = await getSheetRows(sheets, config);
    const existingSkus = await getExistingSkus(
      supabase,
      category.id,
      rows.map((row) => row.sku)
    );

    console.log(
      `Sheet: ${rows.length} dòng có dữ liệu | Web: ${existingSkus.size} SKU trùng`
    );

    for (const row of rows) {
      summary.scanned++;

      if (!row.sku) {
        summary.skippedInvalid++;
        console.log(
          `[${config.categoryName} dòng ${row.rowNumber}] ⚠ thiếu SKU — bỏ qua`
        );
        continue;
      }

      if (existingSkus.has(row.sku)) {
        summary.skippedExisting++;
        continue;
      }

      const label = `[${config.categoryName} dòng ${row.rowNumber}]`;

      try {
        const imageCount = await importNewRow(
          supabase,
          drive,
          config,
          category,
          row
        );

        if (imageCount > 0) {
          summary.imported++;
          summary.images += imageCount;
          existingSkus.add(row.sku);
        } else {
          // A race-condition duplicate can return 0.
          summary.skippedExisting++;
        }
      } catch (error) {
        summary.failed++;
        console.error(
          `${label} ❌ ${row.sku}:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  console.log("\n=== HOÀN TẤT ===");
  console.log(`Dòng đã quét     : ${summary.scanned}`);
  console.log(`Đăng sản phẩm mới: ${summary.imported}`);
  console.log(`Đã có trên web   : ${summary.skippedExisting}`);
  console.log(`Thiếu dữ liệu    : ${summary.skippedInvalid}`);
  console.log(`Lỗi              : ${summary.failed}`);
  console.log(`Ảnh đã xử lý     : ${summary.images}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nSYNC THẤT BẠI:", error);
  process.exit(1);
});
