import { getPage } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function Contact(){const p=await getPage("contact");const c=p?.content||{};return <main className="page"><div className="container"><div className="kicker">Thông tin / 02</div><h1>{c.title||"Liên hệ"}</h1><p>{c.intro||"Bạn quan tâm sản phẩm hoặc cần thêm thông tin? Hãy liên hệ với chúng tôi."}</p><h2>Email</h2><p>{c.email||"hello@gocdoauth.com"}</p><h2>Mạng xã hội</h2><p>{c.facebook||"Facebook / Messenger"}</p></div></main>}
