import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { getGoogleClients } from "./google-auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local"
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

type ImportSheet = (typeof SHEETS)[number];

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
type ExistingProduct = { id: string; slug: string | null };

type DriveImage = {
  id: string;
  name: string;
  mimeType: string;
};

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function parseVnd(value: unknown): number | null {
  const raw = text(value);
  if (!raw) return null;

  // Sheet prices/costs are VND integers. Remove separators/currency symbols.
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
  if (Number.isFinite(numeric)) {
    return `${numeric}ml`;
  }

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

function deriveProductName(description: string, sku: string, code: string): string {
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

async function getSheetRows(
  sheets: Awaited<ReturnType<typeof getGoogleClients>>["sheets"],
  config: ImportSheet
): Promise<ProductRow[]> {
  let result;

  try {
    result = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: config.range,
    });
  } catch (error) {
    console.error(
      `\\n❌ Google Sheets API lỗi khi đọc ${config.categoryName} — ` +
      `spreadsheetId=${config.spreadsheetId}, range=${config.range}`
    );

    if (error && typeof error === "object" && "response" in error) {
      const response = (error as {
        response?: { status?: number; statusText?: string; data?: unknown };
      }).response;

      console.error("HTTP:", response?.status, response?.statusText);
      console.error(
        "Google response:",
        JSON.stringify(response?.data ?? {}, null, 2)
      );
    }

    throw error;
  }

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

    // Ignore completely empty spreadsheet rows.
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

async function getOrCreateCategory(config: ImportSheet): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,name")
    .eq("slug", config.categorySlug)
    .limit(1);

  if (error) throw error;
  if (data?.[0]) return data[0] as Category;

  const { data: created, error: createError } = await supabase
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

async function getOrCreateBrand(categoryId: string, brandName: string): Promise<Brand> {
  const brandSlug = slugify(brandName);

  const { data, error } = await supabase
    .from("brands")
    .select("id,slug,name")
    .eq("category_id", categoryId)
    .eq("slug", brandSlug)
    .limit(1);

  if (error) throw error;
  if (data?.[0]) return data[0] as Brand;

  const { data: created, error: createError } = await supabase
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

async function findProductBySku(categoryId: string, sku: string): Promise<ExistingProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id,slug")
    .eq("category_id", categoryId)
    .eq("sku", sku)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  return (data?.[0] as ExistingProduct | undefined) ?? null;
}

async function upsertProduct(
  category: Category,
  brand: Brand,
  row: ProductRow,
  config: ImportSheet
): Promise<string> {
  const existing = await findProductBySku(category.id, row.sku);
  const name = deriveProductName(row.description, row.sku, row.code);
  const generatedSlug = slugify(`${brand.name}-${name}-${row.sku}`) || slugify(row.sku);

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
  };

  if (existing) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", existing.id);

    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({ ...payload, slug: generatedSlug })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function listImagesRecursive(
  drive: Awaited<ReturnType<typeof getGoogleClients>>["drive"],
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
        files.push({ id: file.id, name: file.name ?? file.id, mimeType: file.mimeType });
      } else if (file.mimeType === "application/vnd.google-apps.folder") {
        files.push(...(await listImagesRecursive(drive, file.id, visited)));
      }
    }

    pageToken = result.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

async function downloadAndOptimizeImage(
  drive: Awaited<ReturnType<typeof getGoogleClients>>["drive"],
  fileId: string
): Promise<Buffer> {
  const result = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" }
  );

  const input = Buffer.from(result.data as ArrayBuffer);

  return sharp(input)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

async function importImages(
  drive: Awaited<ReturnType<typeof getGoogleClients>>["drive"],
  productId: string,
  productName: string,
  photosUrl: string
): Promise<number> {
  const folderId = extractDriveFolderId(photosUrl);
  if (!folderId) return 0;

  const files = await listImagesRecursive(drive, folderId);
  if (!files.length) return 0;

  const imageRows: Array<{
    product_id: string;
    storage_path: string;
    alt: string;
    sort_order: number;
  }> = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    process.stdout.write(`    ảnh ${index + 1}/${files.length}: ${file.name} ... `);

    try {
      const buffer = await downloadAndOptimizeImage(drive, file.id);
      const storagePath = `imports/drive/${file.id}.webp`;

      const { error: uploadError } = await supabase.storage
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
      console.log(`BỎ QUA (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  if (!imageRows.length) return 0;

  // Only replace DB image associations when at least one new image imported.
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (deleteError) throw deleteError;

  const { error: insertError } = await supabase
    .from("product_images")
    .insert(imageRows);
  if (insertError) throw insertError;

  return imageRows.length;
}

async function main() {
  console.log("=== GÓC ĐỒ AUTH — IMPORT SẢN PHẨM ===\n");

  const { sheets, drive } = await getGoogleClients();
  const summary = { imported: 0, updated: 0, skipped: 0, images: 0, warnings: 0 };

  for (const config of SHEETS) {
    console.log(`\n--- ${config.categoryName.toUpperCase()} ---`);

    const category = await getOrCreateCategory(config);
    const rows = await getSheetRows(sheets, config);
    console.log(`Đọc được ${rows.length} sản phẩm từ Sheet.`);

    for (const row of rows) {
      const label = `[${config.categoryName} dòng ${row.rowNumber}]`;

      try {
        if (!row.sku) {
          console.log(`${label} ❌ thiếu SKU — bỏ qua`);
          summary.skipped++;
          continue;
        }

        if (!row.brand) {
          console.log(`${label} ❌ thiếu Brand — bỏ qua (${row.sku})`);
          summary.skipped++;
          continue;
        }

        if (config.categorySlug === "perfumes" && !row.volume) {
          console.log(`${label} ❌ thiếu Dung tích — bỏ qua (${row.sku})`);
          summary.skipped++;
          continue;
        }

        const brand = await getOrCreateBrand(category.id, row.brand);
        const existing = await findProductBySku(category.id, row.sku);
        const productId = await upsertProduct(category, brand, row, config);
        const name = deriveProductName(row.description, row.sku, row.code);

        if (existing) summary.updated++;
        else summary.imported++;

        let imageCount = 0;
        if (row.photos) {
          imageCount = await importImages(drive, productId, name, row.photos);
          if (!imageCount) {
            console.log(`${label} ⚠ không tìm thấy ảnh trong folder: ${row.photos}`);
            summary.warnings++;
          }
        } else {
          console.log(`${label} ⚠ chưa có link Photos (${row.sku})`);
          summary.warnings++;
        }

        summary.images += imageCount;
        console.log(
          `${label} ✓ ${existing ? "UPDATE" : "IMPORT"} — ${row.sku} — ${name} — ${imageCount} ảnh`
        );
      } catch (error) {
        summary.skipped++;
        console.error(
          `${label} ❌ lỗi ${row.sku || "(không SKU)"}:`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  console.log("\n=== HOÀN TẤT ===");
  console.log(`Import mới : ${summary.imported}`);
  console.log(`Cập nhật   : ${summary.updated}`);
  console.log(`Bỏ qua/lỗi : ${summary.skipped}`);
  console.log(`Ảnh        : ${summary.images}`);
  console.log(`Cảnh báo   : ${summary.warnings}`);
}

function printImportError(error: unknown) {
  console.error("\nIMPORT THẤT BẠI:");

  if (error instanceof Error) {
    console.error("Message:", error.message);
    if (error.stack) {
      console.error("\nStack:");
      console.error(error.stack);
    }
  } else {
    console.error(error);
  }

  // Google APIs (via googleapis/axios) usually expose the useful
  // HTTP response under error.response. Print it explicitly instead
  // of Node's default "[Object]" so 403/401 errors are actionable.
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as {
      response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
        config?: { url?: string; method?: string };
      };
    }).response;

    console.error("\n=== API ERROR CHI TIẾT ===");
    console.error("Status:", response?.status ?? "(unknown)");
    console.error("Status text:", response?.statusText ?? "(unknown)");

    if (response?.config?.method || response?.config?.url) {
      console.error("Request:", {
        method: response?.config?.method,
        url: response?.config?.url,
      });
    }

    console.error(
      "Response:",
      JSON.stringify(response?.data ?? {}, null, 2)
    );
  }
}

main().catch((error) => {
  printImportError(error);
  process.exit(1);
});
