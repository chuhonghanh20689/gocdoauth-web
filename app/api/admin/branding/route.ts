import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
export const runtime = "nodejs";
const keys:any={logo:"logo_path",banner:"home_banner_path",watch:"category_watches_image",perfume:"category_perfumes_image"};
export async function POST(req:Request){
 const a=await currentAdmin(); if(!a)return NextResponse.json({error:"Unauthorized"},{status:401});
 const ct=req.headers.get("content-type")||""; const supabase=getSupabaseAdmin();
 if(ct.includes("application/json")){const body=await req.json();if(body.type!=="site_name")return NextResponse.json({error:"Dữ liệu không hợp lệ."},{status:400});const {error}=await supabase.from("site_settings").upsert({key:"site_name",value:String(body.value||"").trim()||"GÓC ĐỒ AUTH"});if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({ok:true,value:String(body.value||"").trim()||"GÓC ĐỒ AUTH"})}
 const form=await req.formData();const file=form.get("file");const type=String(form.get("type")||"");if(!(file instanceof File)||!keys[type])return NextResponse.json({error:"Chưa chọn file hoặc loại ảnh không hợp lệ."},{status:400});
 if(file.size>10*1024*1024)return NextResponse.json({error:"Ảnh tối đa 10MB."},{status:400}); if(!file.type.startsWith("image/"))return NextResponse.json({error:"File phải là hình ảnh."},{status:400});
 const ext=(file.name.split(".").pop()||"webp").toLowerCase().replace(/[^a-z0-9]/g,"")||"webp"; const path=`branding/${type}-${Date.now()}.${ext}`;
 const {error:uploadError}=await supabase.storage.from("site-assets").upload(path,file,{contentType:file.type,upsert:true,cacheControl:"31536000"});if(uploadError)return NextResponse.json({error:uploadError.message},{status:500});
 const {data}=supabase.storage.from("site-assets").getPublicUrl(path);const value=data.publicUrl;const {error}=await supabase.from("site_settings").upsert({key:keys[type],value});if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({ok:true,value});
}
