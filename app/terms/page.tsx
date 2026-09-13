import { getPage } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function Page(){const p=await getPage("terms");const c=p?.content||{};return <main className="page"><div className="container"><div className="kicker">Thông tin</div><h1>{c.title||"Điều khoản & điều kiện"}</h1><p style={{whiteSpace:"pre-line",lineHeight:1.8}}>{c.body||"Nội dung đang được cập nhật. Bạn có thể chỉnh sửa trang này trong khu vực quản trị."}</p></div></main>}
