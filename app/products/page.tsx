import Link from "next/link";
import { getProducts } from "@/lib/db";
import RemoteImage from "@/components/RemoteImage";

export const dynamic = "force-dynamic";

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params?.q) ? params.q[0] : params?.q;
  const query = String(rawQuery || "").trim();

  let items: any[] = [];
  let loadError = "";
  try { items = await getProducts(); } catch (e: any) { loadError = e?.message || "Không thể tải sản phẩm."; }

  if (query) {
    const q = query.toLocaleLowerCase("vi-VN");
    items = items.filter((p) => {
      const text = [
        p.name,
        p.brands?.name,
        p.categories?.name,
        p.sku,
        p.description,
        p.details,
      ].filter(Boolean).join(" ").toLocaleLowerCase("vi-VN");
      return text.includes(q);
    });
  }

  return <main>
    <div className="container catalog-head">
      <div className="kicker">Catalogue / {query ? "Tìm kiếm" : "Tất cả"}</div>
      <h1>{query ? "Kết quả tìm kiếm" : "Sản phẩm"}</h1>
      <p style={{color:"#4e493f"}}>
        {query ? `Kết quả cho “${query}”.` : "Đồng hồ và nước hoa, được sắp xếp theo danh mục và thương hiệu."}
      </p>
    </div>
    <div className="container">
      <div className="filters">
        <Link className="filter" href="/products">Tất cả</Link>
        <Link className="filter" href="/products/watches">Đồng hồ</Link>
        <Link className="filter" href="/products/perfumes">Nước hoa</Link>
      </div>
      {query && <div className="search-results-note">{items.length} sản phẩm phù hợp</div>}
      {items.length ? <div className="product-grid">{items.map(p => <Link href={`/products/${p.categories?.slug || "watches"}/${p.brands?.slug || "product"}/${p.slug}`} className="product-card" key={p.id}>
        <div className="product-image">{p.product_images?.[0]?.storage_path ? <RemoteImage src={p.product_images[0].storage_path} alt={p.product_images[0].alt || p.name}/> : <div className="placeholder">{p.brands?.name}<br/><small>{p.name}</small></div>}</div>
        <div className="brand">{p.brands?.name || ""}</div>
        <div className="product-name">{p.name}</div>
      </Link>)}</div> : <div className="admin-box">
        <p>{loadError ? `Không thể tải catalogue: ${loadError}` : query ? `Không tìm thấy sản phẩm phù hợp với “${query}”.` : "Chưa có sản phẩm đang hiển thị."}</p>
        {loadError ? <p className="mono" style={{fontSize:12}}>Nếu bạn vừa thay đổi quyền Supabase, hãy tải lại trang sau khi restart server.</p> : query ? <Link className="btn" href="/products">Xem tất cả sản phẩm →</Link> : <Link className="btn" href="/admin">Vào quản trị →</Link>}
      </div>}
    </div>
  </main>;
}
