import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
export const runtime="nodejs";

const pageKeys=["home","about","contact","faq","shipping","returns","privacy","terms"];
const defaultTitles:Record<string,string>={home:"Trang chủ",about:"Giới thiệu",contact:"Liên hệ",faq:"Câu hỏi thường gặp",shipping:"Vận chuyển & giao hàng",returns:"Đổi trả & hoàn tiền",privacy:"Chính sách bảo mật",terms:"Điều khoản"};

function parseContent(value:any){
  if(value && typeof value === "object") return value;
  if(typeof value === "string" && value.trim()){ try{return JSON.parse(value)}catch{return {body:value}} }
  return {};
}

export async function GET(){
  const a=await currentAdmin();
  if(!a) return NextResponse.json({error:"Unauthorized"},{status:401});
  const s=getSupabaseAdmin();
  const {data:pages,error}=await s.from("pages").select("page_key,title,content,seo_title,seo_description,is_published").in("page_key",pageKeys);
  if(error) return NextResponse.json({error:error.message},{status:500});
  const {data:settings,error:se}=await s.from("site_settings").select("key,value").in("key",["logo_path","site_name","home_banner_path","category_watches_image","category_perfumes_image","footer_location"]);
  if(se) return NextResponse.json({error:se.message},{status:500});
  const out:any={branding:{}};
  for(const key of pageKeys) out[key]={page_key:key,title:defaultTitles[key],content:{}};
  for(const row of pages||[]){
    const c=parseContent(row.content);
    // Flatten content for the admin form so each field is directly editable.
    out[row.page_key]={...row,...c,content:c,title:row.title || defaultTitles[row.page_key] || row.page_key};
  }
  for(const x of settings||[]){
    if(x.key==="logo_path") out.branding.logo=x.value;
    if(x.key==="site_name") out.branding.siteName=x.value;
    if(x.key==="home_banner_path") out.branding.banner=x.value;
    if(x.key==="category_watches_image") out.branding.watchImage=x.value;
    if(x.key==="category_perfumes_image") out.branding.perfumeImage=x.value;
    if(x.key==="footer_location") out.branding.footerLocation=x.value;
  }
  return NextResponse.json(out);
}

export async function PUT(req:Request){
  const a=await currentAdmin();
  if(!a) return NextResponse.json({error:"Unauthorized"},{status:401});
  const body=await req.json();
  const section=body.section;
  if(!pageKeys.includes(section)) return NextResponse.json({error:"Invalid section"},{status:400});
  const s=getSupabaseAdmin();

  // Save one field at a time. This avoids one broken/empty field preventing the rest of the page from saving.
  const {data:existing,error:readError}=await s.from("pages").select("page_key,title,content").eq("page_key",section).maybeSingle();
  if(readError) return NextResponse.json({error:readError.message},{status:500});

  const current=parseContent(existing?.content);
  const field=typeof body.field==="string" ? body.field : null;
  const value=body.value;
  let nextContent=current;
  let nextTitle=existing?.title || defaultTitles[section];

  if(field){
    if(field==="title" && section!=="home") nextTitle=String(value ?? "");
    else nextContent={...current,[field]:value ?? ""};
  } else {
    // Backward-compatible whole-section save. Always provide a non-null title.
    const incoming=body.data && typeof body.data==="object" ? body.data : {};
    const {title,...contentFields}=incoming;
    nextTitle=String(title || existing?.title || defaultTitles[section] || section);
    nextContent={...current,...contentFields};
  }

  if(!nextTitle) nextTitle=defaultTitles[section] || section;
  const {error}=await s.from("pages").upsert({page_key:section,title:nextTitle,content:nextContent,is_published:true},{onConflict:"page_key"});
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({ok:true,section,field});
}
