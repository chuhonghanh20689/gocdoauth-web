import Link from "next/link";
import { getProducts } from "@/lib/db";
import RemoteImage from "@/components/RemoteImage";

export const dynamic = "force-dynamic";

export default async function Products() {
  let items: any[] = [];
  let loadError = "";
  try { items = await getProducts(); } catch (e: any) { loadError = e?.message || "Không thể tải sản phẩm."; }
  return <main><div className="container catalog-head"><div className="kicker">Catalogue / Tất cả</div><h1>Sản phẩm</h1><p style={{color:"#4e493f"}}>Đồng hồ và nước hoa, được sắp xếp theo danh mục và thương hiệu.</p></div>
    <div className="container"><div className="filters"><Link className="filter" href="/products">Tất cả</Link><Link className="filter" href="/products/watches">Đồng hồ</Link><Link className="filter" href="/products/perfumes">Nước hoa</Link></div>
    {items.length ? <div className="product-grid">{items.map(p => <Link href={`/products/${p.categories?.slug || "watches"}/${p.brands?.slug || "product"}/${p.slug}`} className="product-card" key={p.id}><div className="product-image">{p.product_images?.[0]?.storage_path ? <RemoteImage src={p.product_images[0].storage_path} alt={p.product_images[0].alt || p.name}/> : <div className="placeholder">{p.brands?.name}<br/><small>{p.name}</small></div>}</div><div className="brand">{p.brands?.name || ""}</div><div className="product-name">{p.name}</div><div className="price">{p.price ? `${new Intl.NumberFormat("vi-VN").format(Number(p.price))} ${p.currency || "VND"}` : "Liên hệ"}</div></Link>)}</div> : <div className="admin-box"><p>{loadError ? `Không thể tải catalogue: ${loadError}` : "Chưa có sản phẩm đang hiển thị."}</p>{loadError ? <p className="mono" style={{fontSize:12}}>Nếu bạn vừa thay đổi quyền Supabase, hãy tải lại trang sau khi restart server.</p> : <Link className="btn" href="/admin">Vào quản trị →</Link>}</div>}</div></main>;
}
