import { getPage } from "@/lib/content";
export const dynamic = "force-dynamic";

export default async function Contact(){
  const p=await getPage("contact");
  const c=p?.content||{};
  const title=p?.title||c.title||"Liên hệ";
  const intro=c.intro||"Bạn quan tâm sản phẩm hoặc cần thêm thông tin? Hãy liên hệ với chúng tôi.";
  const facebook=c.facebook||"https://www.facebook.com/gocdoauth";
  const phone=c.phone||"0859796267";
  const zalo=c.zalo||"0945918855";
  return <main className="page"><div className="container"><div className="kicker">Thông tin / 02</div><h1>{title}</h1><p>{intro}</p><div className="contact-list">
    <div><h2>Facebook / Messenger</h2><p><a href={facebook.startsWith("http")?facebook:`https://${facebook}`} target="_blank" rel="noreferrer">{facebook}</a></p></div>
    <div><h2>Điện thoại</h2><p><a href={`tel:${phone.replace(/\D/g,"")}`}>{phone}</a></p></div>
    <div><h2>Zalo</h2><p><a href={`https://zalo.me/${zalo.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">{zalo}</a></p></div>
    {c.email&&<div><h2>Email</h2><p><a href={`mailto:${c.email}`}>{c.email}</a></p></div>}
  </div></div></main>
}
