import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toPublicImageUrl(src: string) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/product-images/${String(src).replace(/^\/+/, "")}`;
}

function mapProduct(p: any) {
  const category = Array.isArray(p?.categories) ? p.categories[0] : p?.categories;
  const brand = Array.isArray(p?.brands) ? p.brands[0] : p?.brands;
  return {
    id: p.id, slug: p.slug, sku: p.sku || "", category_id: p.category_id,
    brand_id: p.brand_id, category: category?.slug || "", category_name: category?.name || "",
    brand: brand?.name || "", brand_slug: brand?.slug || "", name: p.name,
    cost: p.cost == null ? "" : String(p.cost), price: p.price == null ? "" : String(p.price), volume: p.volume || "", currency: p.currency || "VND",
    description: p.description || "", details: p.details || "", condition: p.condition || "",
    status: p.status || "draft", featured: !!p.featured, sort_order: p.sort_order || 0,
    images: (p.product_images || []).sort((a:any,b:any)=>(a.sort_order||0)-(b.sort_order||0)).map((x:any)=>({id:x.id,url:toPublicImageUrl(x.storage_path),alt:x.alt||"",sort_order:x.sort_order||0}))
  };
}

async function guard() { return await currentAdmin(); }

export async function GET() {
  if (!await guard()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("products").select("*,product_images(id,storage_path,alt,sort_order),categories!products_category_id_fkey(id,slug,name),brands!products_brand_id_fkey(id,slug,name)").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data || []).map(mapProduct));
}

export async function POST(req: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const sb = getSupabaseAdmin();
    const categorySlug = String(b.category || "watches");
    const brandName = String(b.brand || "").trim();
    const name = String(b.name || "").trim();
    if (!brandName || !name) return NextResponse.json({ error: "Vui lòng nhập thương hiệu và tên sản phẩm." }, { status: 400 });
    const { data: cat, error: catErr } = await sb.from("categories").select("id,slug,name").eq("slug", categorySlug).single();
    if (catErr || !cat) return NextResponse.json({ error: "Danh mục chưa tồn tại. Hãy chạy schema Supabase trước." }, { status: 400 });
    const brandSlug = slugify(brandName);
    let { data: brand } = await sb.from("brands").select("id,slug,name").eq("slug", brandSlug).maybeSingle();
    if (!brand) {
      const r = await sb.from("brands").insert({ name: brandName, slug: brandSlug, category_id: cat.id }).select("id,slug,name").single();
      if (r.error) throw r.error; brand = r.data;
    }
    const base = slugify(`${brandName}-${name}`) || crypto.randomUUID();
    let slug = base;
    for (let i=2;;i++) { const { data: exists } = await sb.from("products").select("id").eq("slug", slug).maybeSingle(); if (!exists) break; slug = `${base}-${i}`; }
    const payload = {
      category_id: cat.id, brand_id: brand.id, slug, name,
      sku: String(b.sku || "").trim() || null,
      price: b.price === "" || b.price == null ? null : Number(String(b.price).replace(/[^0-9.]/g, "")) || null,
      currency: String(b.currency || "VND"), description: String(b.description || ""), details: String(b.details || ""),
      condition: String(b.condition || ""), status: ["draft","published","sold","hidden"].includes(b.status) ? b.status : "draft",
      featured: !!b.featured, sort_order: Number(b.sort_order || 0) || 0
    };
    const { data: p, error } = await sb.from("products").insert(payload).select("*,categories!products_category_id_fkey(id,slug,name),brands!products_brand_id_fkey(id,slug,name)").single();
    if (error) throw error;
    const images = Array.isArray(b.images) ? b.images : [];
    if (images.length) {
      const r = await sb.from("product_images").insert(images.map((x:any,i:number)=>({ product_id:p.id, storage_path:String(x.url||x.storage_path||""), alt:String(x.alt||name), sort_order:i })));
      if (r.error) throw r.error;
    }
    const { data: full } = await sb.from("products").select("*,product_images(id,storage_path,alt,sort_order),categories!products_category_id_fkey(id,slug,name),brands!products_brand_id_fkey(id,slug,name)").eq("id",p.id).single();
    return NextResponse.json(mapProduct(full), { status: 201 });
  } catch (e:any) { return NextResponse.json({ error: e?.message || "Không thể thêm sản phẩm." }, { status: 500 }); }
}

export async function PUT(req: Request) {
  if (!await guard()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json(); const id = String(b.id || ""); if (!id) return NextResponse.json({ error: "Thiếu ID sản phẩm." }, { status: 400 });
    const sb = getSupabaseAdmin();
    const categorySlug = String(b.category || "watches"); const brandName = String(b.brand || "").trim(); const name = String(b.name || "").trim();
    const { data: cat } = await sb.from("categories").select("id,slug,name").eq("slug", categorySlug).single(); if (!cat) throw new Error("Danh mục không tồn tại.");
    const brandSlug = slugify(brandName); let { data: brand } = await sb.from("brands").select("id,slug,name").eq("slug", brandSlug).maybeSingle();
    if (!brand) { const r = await sb.from("brands").insert({name:brandName,slug:brandSlug,category_id:cat.id}).select("id,slug,name").single(); if(r.error)throw r.error; brand=r.data; }
    const payload = {
      category_id:cat.id, brand_id:brand.id, name, sku:String(b.sku||"").trim()||null,
      price:b.price===""||b.price==null?null:Number(String(b.price).replace(/[^0-9.]/g,""))||null,
      currency:String(b.currency||"VND"),description:String(b.description||""),details:String(b.details||""),condition:String(b.condition||""),
      status:["draft","published","sold","hidden"].includes(b.status)?b.status:"draft",featured:!!b.featured,sort_order:Number(b.sort_order||0)||0,updated_at:new Date().toISOString()
    };
    const { error } = await sb.from("products").update(payload).eq("id",id); if(error)throw error;
    if(Array.isArray(b.images)){
      await sb.from("product_images").delete().eq("product_id",id);
      if(b.images.length){const r=await sb.from("product_images").insert(b.images.map((x:any,i:number)=>({product_id:id,storage_path:String(x.url||x.storage_path||""),alt:String(x.alt||name),sort_order:i})));if(r.error)throw r.error;}
    }
    const { data: full, error: fe } = await sb.from("products").select("*,product_images(id,storage_path,alt,sort_order),categories!products_category_id_fkey(id,slug,name),brands!products_brand_id_fkey(id,slug,name)").eq("id",id).single(); if(fe)throw fe;
    return NextResponse.json(mapProduct(full));
  } catch(e:any){return NextResponse.json({error:e?.message||"Không thể cập nhật sản phẩm."},{status:500});}
}

export async function DELETE(req: Request){
  if(!await guard())return NextResponse.json({error:"Unauthorized"},{status:401});
  try{const {id}=await req.json();const sb=getSupabaseAdmin();const {data:imgs}=await sb.from("product_images").select("storage_path").eq("product_id",id);const paths=(imgs||[]).map((x:any)=>String(x.storage_path||"")).filter((x:string)=>x.includes("/storage/v1/object/public/product-images/")).map((x:string)=>x.split("/storage/v1/object/public/product-images/")[1]);if(paths.length)await sb.storage.from("product-images").remove(paths);const {error}=await sb.from("products").delete().eq("id",id);if(error)throw error;return NextResponse.json({ok:true});}catch(e:any){return NextResponse.json({error:e?.message||"Không thể xóa sản phẩm."},{status:500});}
}
