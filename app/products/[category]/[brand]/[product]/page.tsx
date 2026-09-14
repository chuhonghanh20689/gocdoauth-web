import Link from "next/link";
import { getSupabasePublic } from "@/lib/supabase";
import { getProductImageUrl } from "@/components/RemoteImage";
import ProductGallery from "@/components/ProductGallery";

export const dynamic = "force-dynamic";

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
      "id,slug,name,price,currency,description,details,condition,volume,status,product_images(id,storage_path,alt,sort_order),categories!products_category_id_fkey(slug,name),brands!products_brand_id_fkey(slug,name)"
    )
    .eq("slug", product)
    .eq("status", "published")
    .maybeSingle();

  if (!p) {
    return (
      <main className="page">
        <div className="container">
          <h1>Không tìm thấy sản phẩm</h1>
          <Link className="btn" href="/products">← Quay lại catalogue</Link>
        </div>
      </main>
    );
  }

  const categoryRow = Array.isArray(p.categories) ? p.categories[0] : p.categories;
  const brandRow = Array.isArray(p.brands) ? p.brands[0] : p.brands;

  if (categoryRow?.slug !== category || brandRow?.slug !== brand) {
    return (
      <main className="page">
        <div className="container">
          <h1>Không tìm thấy sản phẩm</h1>
          <Link className="btn" href="/products">← Quay lại catalogue</Link>
        </div>
      </main>
    );
  }

  const images = [...(p.product_images || [])]
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .filter((image: any) => image.storage_path)
    .map((image: any) => ({
      id: String(image.id),
      src: getProductImageUrl(image.storage_path),
      alt: image.alt || p.name,
    }));

  return (
    <main className="page">
      <div className="container">
        <div className="kicker">
          <Link className="detail-category-link" href={`/products/${category}`}>
            {categoryRow?.name}
          </Link>
          <span> / </span>
          <Link className="detail-brand-link" href={`/products/${category}/${brand}`}>
            {brandRow?.name}
          </Link>
        </div>

        <div className="split" style={{ alignItems: "start" }}>
          <ProductGallery images={images} name={p.name} />

          <div>
            <Link className="brand detail-brand-link" href={`/products/${category}/${brand}`}>
              {brandRow?.name}
            </Link>

            <h1 className="detail-title">{p.name}</h1>

            <div className="price" style={{ fontSize: 22, margin: "18px 0" }}>
              {p.price ? `${new Intl.NumberFormat("vi-VN").format(Number(p.price))} ${p.currency || "VND"}` : "Liên hệ"}
            </div>

            {p.volume && (
              <p><strong>Dung tích:</strong> {p.volume}</p>
            )}

            {p.description && (
              <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{p.description}</p>
            )}

            {p.details && (
              <>
                <h3>Thông tin sản phẩm</h3>
                <p style={{ whiteSpace: "pre-line", lineHeight: 1.8 }}>{p.details}</p>
              </>
            )}

            {p.condition && <p><strong>Tình trạng:</strong> {p.condition}</p>}

            <Link className="btn" href="/contact">Liên hệ sản phẩm →</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
