import { getPage } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function About(){const p=await getPage("about");const c=p?.content||{};return <main className="page"><div className="container"><div className="kicker">Thông tin / 01</div><h1>{c.title||"Giới thiệu"}</h1><p style={{whiteSpace:"pre-line"}}>{c.body||"Góc Đồ Auth là catalogue tập trung vào đồng hồ và nước hoa chính hãng. Chúng tôi giữ cách trình bày đơn giản để khách hàng dễ xem sản phẩm và những thông tin quan trọng."}</p></div></main>}
