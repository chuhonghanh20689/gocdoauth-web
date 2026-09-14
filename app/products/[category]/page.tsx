import Link from "next/link";
import { getProducts } from "@/lib/db";
import RemoteImage from "@/components/RemoteImage";
export const dynamic = "force-dynamic";
export default async function Category({ params }: { params: Promise<{category:string}> }) {
  const { category } = await params; const title = category === "perfumes" ? "Nước hoa" : category === "watches" ? "Đồng hồ" : "Sản phẩm";
  let items: any[] = []; try { items = await getProducts({ category }); } catch {}
  const brandPairs: [string, string][] = items
    .map((p: any) => [p.brands?.slug, p.brands?.name] as [string, string])
    .filter(([s]) => Boolean(s));
  const brands = Array.from(new Map<string, string>(brandPairs).entries());
  return <main><div className="container catalog-head"><div className="kicker">Catalogue / {title}</div><h1>{title}</h1><p style={{color:"#4e493f"}}>Xem sản phẩm theo thương hiệu.</p></div><div className="container"><div className="filters"><Link className="filter" href="/products">Tất cả</Link>{brands.map(([slug,name])=><Link className="filter" href={`/products/${category}/${slug}`} key={String(slug)}>{String(name)}</Link>)}</div>{items.length ? <div className="product-grid">{items.map(p=><Link href={`/products/${category}/${p.brands?.slug || "product"}/${p.slug}`} className="product-card" key={p.id}><div className="product-image">{p.product_images?.[0]?.storage_path ? <RemoteImage src={p.product_images[0].storage_path} alt={p.product_images[0].alt || p.name}/> : <div className="placeholder">{p.brands?.name}<br/><small>{p.name}</small></div>}</div><div className="brand">{p.brands?.name || ""}</div><div className="product-name">{p.name}</div></Link>)}</div> : <div className="admin-box"><p>Chưa có sản phẩm trong danh mục này.</p></div>}</div></main>;
}
