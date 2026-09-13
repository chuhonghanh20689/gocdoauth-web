import Link from "next/link";
import { getProducts } from "@/lib/db";
import RemoteImage from "@/components/RemoteImage";
export const dynamic = "force-dynamic";
export default async function BrandPage({ params }: { params: Promise<{category:string;brand:string}> }) {
  const { category, brand } = await params; let items: any[] = []; try { items = await getProducts({ category }); } catch {} items = items.filter(p => p.brands?.slug === brand);
  const title = items[0]?.brands?.name || brand.toUpperCase(); const catTitle = category === "perfumes" ? "Nước hoa" : "Đồng hồ";
  return <main><div className="container catalog-head"><div className="kicker">{catTitle} / {title}</div><h1>{title}</h1></div><div className="container"><div className="product-grid">{items.map(p=><Link href={`/products/${category}/${brand}/${p.slug}`} className="product-card" key={p.id}><div className="product-image">{p.product_images?.[0]?.storage_path ? <RemoteImage src={p.product_images[0].storage_path} alt={p.name}/> : <div className="placeholder">{title}<br/><small>{p.name}</small></div>}</div><div className="brand">{title}</div><div className="product-name">{p.name}</div><div className="price">{p.price ? `${new Intl.NumberFormat("vi-VN").format(Number(p.price))} ${p.currency || "VND"}` : "Liên hệ"}</div></Link>)}</div></div></main>;
}
