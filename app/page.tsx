import Link from "next/link";
import { getProducts } from "@/lib/db";
import { getPage, getSetting } from "@/lib/content";
import Image from "next/image";
import RemoteImage from "@/components/RemoteImage";
export const dynamic = "force-dynamic";
export default async function Home() {
  let featured:any[]=[]; try{featured=await getProducts({featured:true}); if(!featured.length) featured=(await getProducts()).slice(0,4)}catch{}
  const p=await getPage("home"); const c=p?.content||{};
  const banner=await getSetting("home_banner_path", "");
  const watchImage=await getSetting("category_watches_image", "");
  const perfumeImage=await getSetting("category_perfumes_image", "");
  return <main>
    <section className={`hero ${banner ? "hero-with-image" : ""}`}>{banner && <><Image src={banner} alt="" fill priority sizes="100vw" className="hero-bg-image"/><div className="hero-bg-overlay"/></>}<div className="container"><div className="hero-content"><div className="kicker">{c.heroKicker || "Góc Đồ Auth / Tuyển chọn"}</div><h1>{c.heroTitle || "Đồ chính hãng,\nđược tuyển chọn kỹ."}</h1><p className="hero-subtitle">{c.heroSubtitle || "Catalogue đồng hồ và nước hoa chính hãng, trình bày đơn giản để bạn tập trung vào sản phẩm."}</p><Link href="/products" className="btn">{c.heroButton || "Xem catalogue →"}</Link></div></div></section>
    <section className="section"><div className="container"><div className="section-title"><h2>{c.collectionTitle || "Bộ sưu tập"}</h2><span className="mono">{c.collectionCount || "02 danh mục"}</span></div><div className="categories">
      <Link className="category category-with-image" href="/products/watches">{watchImage?<Image src={watchImage} alt={c.watchTitle || "Đồng hồ"} fill sizes="(max-width: 640px) 100vw, 50vw" className="category-image"/>:<div className="category-pattern"/>}<div className="category-overlay"/><div className="category-content"><span className="kicker">{c.watchKicker || "01 / Đồng hồ"}</span><h3>{c.watchTitle || "Đồng hồ"}</h3><span className="mono">{c.watchLink || "Xem sản phẩm →"}</span></div></Link>
      <Link className="category category-with-image" href="/products/perfumes">{perfumeImage?<Image src={perfumeImage} alt={c.perfumeTitle || "Nước hoa"} fill sizes="(max-width: 640px) 100vw, 50vw" className="category-image"/>:<div className="category-pattern"/>}<div className="category-overlay"/><div className="category-content"><span className="kicker">{c.perfumeKicker || "02 / Hương thơm"}</span><h3>{c.perfumeTitle || "Nước hoa"}</h3><span className="mono">{c.perfumeLink || "Xem sản phẩm →"}</span></div></Link>
    </div></div></section>
    <section className="section"><div className="container"><div className="section-title"><h2>{c.featuredTitle || "Sản phẩm nổi bật"}</h2><Link href="/products" className="mono">{c.featuredLink || "Xem tất cả →"}</Link></div>{featured.length?<div className="product-grid">{featured.map(x=><Link className="product-card" href={`/products/${x.categories?.slug||"watches"}/${x.brands?.slug||"product"}/${x.slug}`} key={x.id}><div className="product-image">{x.product_images?.[0]?.storage_path?<RemoteImage src={x.product_images[0].storage_path} alt={x.name}/>:<div className="placeholder">{x.brands?.name}<br/><small>{x.name}</small></div>}</div><div className="brand">{x.brands?.name}</div><div className="product-name">{x.name}</div><div className="price">{x.price?`${new Intl.NumberFormat("vi-VN").format(Number(x.price))} ${x.currency||"VND"}`:"Liên hệ"}</div></Link>)}</div>:<p>{c.featuredEmpty || "Chưa có sản phẩm nổi bật."}</p>}</div></section>
    <section className="section"><div className="container split"><div><div className="kicker">{c.aboutKicker || "Về Góc Đồ Auth"}</div><h2>{(c.aboutTitle || "Một catalogue\nđơn giản, dễ xem.").split("\n").map((line:string,i:number)=><span key={i}>{line}{i===0&&<br/>}</span>)}</h2></div><div><p className="body-copy">{c.aboutBody || "Chúng tôi tập trung vào đồng hồ và nước hoa chính hãng, với thông tin sản phẩm rõ ràng và cách liên hệ đơn giản."}</p><Link href="/about" className="btn">{c.aboutButton || "Tìm hiểu thêm →"}</Link></div></div></section>
  </main>;
}
