import Link from "next/link";
import { getSupabasePublic } from "@/lib/supabase";
import Image from "next/image";

export const dynamic = "force-dynamic";

function getProductImageUrl(src: string) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const path = String(src).replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/product-images/${path}`;
}

export default async function ProductDetail({
  params,
}: {
  params: Promise<{ category: string; brand: string; product: string }>;
}) {
  const { category, brand, product } = await params;
  const supabase = getSupabasePublic();

  const { data: p } = await supabase
    .from("products")
    .select(
      "id,slug,name,price,currency,volume,description,details,condition,status,product_images(id,storage_path,alt,sort_order),categories!products_category_id_fkey(slug,name),brands!products_brand_id_fkey(slug,name)"
    )
    .eq("slug", product)
    .eq("status", "published")
    .maybeSingle();

  const categoryRow = Array.isArray(p?.categories) ? p.categories[0] : p?.categories;
  const brandRow = Array.isArray(p?.brands) ? p.brands[0] : p?.brands;

  if (!p || categoryRow?.slug !== category || brandRow?.slug !== brand) {
    return (
      <main className="page">
        <div className="container">
          <h1>Không tìm thấy sản phẩm</h1>
          <Link className="btn" href="/products">← Quay lại catalogue</Link>
        </div>
      </main>
    );
  }

  const images = [...(p.product_images || [])].sort(
    (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
  );
  const firstImage = images[0]?.storage_path ? getProductImageUrl(images[0].storage_path) : "";

  return (
    <main className="page">
      <div className="container">
        <div className="kicker">{brandRow?.name} / {categoryRow?.name}</div>
        <div className="split" style={{ alignItems: "start" }}>
          <div>
            {firstImage ? (
              <Image
                src={firstImage}
                alt={images[0]?.alt || p.name}
                width={1400}
                height={1400}
                sizes="(max-width: 800px) 100vw, 55vw"
                style={{ width: "100%", height: "auto", maxHeight: 650, objectFit: "contain", background: "#e9e3d6" }}
              />
            ) : (
              <div className="product-image" style={{ height: 500 }}>
                <div className="placeholder">{brandRow?.name}<br /><small>{p.name}</small></div>
              </div>
            )}
          </div>

          <div>
            <div className="brand">{brandRow?.name}</div>
            <h1 style={{ marginTop: 8 }}>{p.name}</h1>
            <div className="price" style={{ fontSize: 22, margin: "18px 0" }}>
              {p.price ? `${new Intl.NumberFormat("vi-VN").format(Number(p.price))} ${p.currency || "VND"}` : "Liên hệ"}
            </div>
            {p.volume && <p><strong>Dung tích:</strong> {p.volume}</p>}
            {p.description && <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{p.description}</p>}
            {p.details && <><h3>Thông tin sản phẩm</h3><p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{p.details}</p></>}
            {p.condition && <p><strong>Tình trạng:</strong> {p.condition}</p>}
            <Link className="btn" href="/contact">Liên hệ sản phẩm →</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
