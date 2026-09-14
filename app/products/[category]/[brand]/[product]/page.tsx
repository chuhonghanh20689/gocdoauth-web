 "use client";
import { useEffect, useMemo, useState } from "react";
import { getProductImageUrl } from "@/components/RemoteImage";

type ImageItem={url:string;alt?:string;originalSize?:number;optimizedSize?:number};
type Product={id:string;slug:string;sku:string;category:string;brand:string;brand_slug?:string;name:string;cost:string;price:string;volume:string;currency:string;description:string;details:string;condition:string;status:string;featured:boolean;sort_order:number;images:ImageItem[]};
type Form={category:string;brand:string;name:string;sku:string;cost:string;price:string;volume:string;currency:string;description:string;details:string;condition:string;status:string;featured:boolean;sort_order:number;images:ImageItem[]};
const blank:Form={category:"watches",brand:"",name:"",sku:"",cost:"",price:"",volume:"",currency:"VND",description:"",details:"",condition:"",status:"published",featured:false,sort_order:0,images:[]};

// Tối ưu ảnh ngay trên trình duyệt trước khi gửi lên Supabase Storage.
async function optimizeImage(file:File):Promise<File>{
 const maxSide=1800;
 const quality=0.82;
 if(!file.type.startsWith("image/")) return file;
 try{
  const objectUrl=URL.createObjectURL(file);
  const img=new Image();
  img.decoding="async";
  img.src=objectUrl;
  await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error("Không đọc được ảnh."));});
  const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
  const width=Math.max(1,Math.round(img.naturalWidth*scale));
  const height=Math.max(1,Math.round(img.naturalHeight*scale));
  const canvas=document.createElement("canvas");
  canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext("2d");
  if(!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  ctx.drawImage(img,0,0,width,height);
  URL.revokeObjectURL(objectUrl);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",quality));
  if(!blob) return file;
  const base=(file.name.replace(/\.[^.]+$/,"")||"image").replace(/[^a-zA-Z0-9_-]/g,"-");
  return new File([blob],`${base}.webp`,{type:"image/webp",lastModified:Date.now()});
 }catch{return file;}
}

function formatBytes(bytes:number){
 if(bytes<1024) return `${bytes} B`;
 if(bytes<1024*1024) return `${(bytes/1024).toFixed(0)} KB`;
 return `${(bytes/1024/1024).toFixed(1)} MB`;
}

export default function ProductsAdmin(){
 const [items,setItems]=useState<Product[]>([]);
 const [categories,setCategories]=useState<any[]>([]);
 const [form,setForm]=useState<Form>(blank);
 const [editing,setEditing]=useState<string|null>(null);
 const [msg,setMsg]=useState("");
 const [loading,setLoading]=useState(false);
 const [search,setSearch]=useState("");
 const [uploading,setUploading]=useState(false);
 const [lastUrl,setLastUrl]=useState("");

 async function load(){
  const [a,b]=await Promise.all([fetch("/api/admin/products"),fetch("/api/admin/catalog")]);
  if(a.status===401){location.href="/admin/login";return;}
  const aj=await a.json(),bj=await b.json();
  setItems(Array.isArray(aj)?aj:[]);
  setCategories(Array.isArray(bj.categories)?bj.categories:[]);
  if(aj?.error)setMsg(aj.error);
 }
 useEffect(()=>{load()},[]);
 const visible=useMemo(()=>items.filter(x=>`${x.brand} ${x.name} ${x.sku}`.toLowerCase().includes(search.toLowerCase())),[items,search]);
 function set<K extends keyof Form>(k:K,v:Form[K]){setForm(x=>({...x,[k]:v}));}

 async function upload(files:FileList|null){
  if(!files?.length)return;
  setUploading(true);setMsg("");
  const added:ImageItem[]=[];
  for(const file of Array.from(files)){
   try{
    const optimized=await optimizeImage(file);
    const fd=new FormData();
    fd.append("file",optimized);
    const r=await fetch("/api/admin/upload",{method:"POST",body:fd});
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Upload ảnh lỗi.");continue;}
    added.push({url:d.url,alt:form.name,originalSize:file.size,optimizedSize:optimized.size});
    if(optimized.size<file.size)setMsg(`Đã tối ưu ảnh: ${formatBytes(file.size)} → ${formatBytes(optimized.size)}.`);
   }catch{setMsg("Không thể xử lý ảnh này.");}
  }
  setForm(x=>({...x,images:[...x.images,...added]}));
  setUploading(false);
 }

 async function save(e:React.FormEvent){
  e.preventDefault();
  if(form.category==="perfumes"&&!form.volume.trim()){setMsg("Nước hoa bắt buộc phải có dung tích.");return;}
  if(!form.sku.trim()){setMsg("Vui lòng nhập SKU.");return;}
  setLoading(true);setMsg("");setLastUrl("");
  const payload={...form,cost:form.cost.trim(),price:form.price.trim(),volume:form.volume.trim()||null};
  const r=await fetch("/api/admin/products",{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?{...payload,id:editing}:payload)});
  const d=await r.json();
  setLoading(false);
  if(!r.ok){setMsg(d.error||"Có lỗi.");return;}
  setMsg(editing?"Đã cập nhật sản phẩm.":"Đã thêm sản phẩm.");
  if(d?.slug&&d?.category&&d?.brand_slug)setLastUrl(`/products/${d.category}/${d.brand_slug}/${d.slug}`);
  setForm(blank);setEditing(null);await load();
 }

 function edit(p:Product){
  setEditing(p.id);
  setForm({category:p.category||"watches",brand:p.brand||"",name:p.name||"",sku:p.sku||"",cost:p.cost||"",price:p.price||"",volume:p.volume||"",currency:p.currency||"VND",description:p.description||"",details:p.details||"",condition:p.condition||"",status:p.status||"draft",featured:!!p.featured,sort_order:p.sort_order||0,images:p.images||[]});
  window.scrollTo({top:0,behavior:"smooth"});
 }

 async function del(id:string){
  if(!confirm("Xóa sản phẩm này? Hành động này không thể hoàn tác."))return;
  const r=await fetch("/api/admin/products",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
  const d=await r.json();
  if(!r.ok){setMsg(d.error||"Không thể xóa.");return;}
  await load();
 }

 return <main className="page"><div className="container">
  <div className="kicker">Admin / Catalogue</div><h1>Quản lý sản phẩm</h1>

  <form onSubmit={save} className="admin-box" style={{maxWidth:1100,marginBottom:35}}>
   <div className="section-title"><h2>{editing?"Sửa sản phẩm":"Thêm sản phẩm"}</h2><span className="mono">{editing?"CHỈNH SỬA":"MỚI"}</span></div>

   <div className="form-grid">
    <select value={form.category} onChange={e=>set("category",e.target.value)}>
     {categories.length?categories.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>):<><option value="watches">Đồng hồ</option><option value="perfumes">Nước hoa</option></>}
    </select>
    <input placeholder="Thương hiệu *" value={form.brand} onChange={e=>set("brand",e.target.value)} required/>
    <input placeholder="Tên sản phẩm *" value={form.name} onChange={e=>set("name",e.target.value)} required/>
    <input placeholder="Mã sản phẩm / SKU *" value={form.sku} onChange={e=>set("sku",e.target.value)} required/>
    <input placeholder="Giá vốn (Cost)" value={form.cost} onChange={e=>set("cost",e.target.value)}/>
    <input placeholder="Giá bán (VND) — để trống = Liên hệ" value={form.price} onChange={e=>set("price",e.target.value)}/>
    <input placeholder={form.category==="perfumes"?"Dung tích * (VD: 30ml, 50ml)":"Dung tích (không áp dụng cho đồng hồ)"} value={form.volume} onChange={e=>set("volume",e.target.value)} required={form.category==="perfumes"}/>
    <select value={form.status} onChange={e=>set("status",e.target.value)}><option value="draft">Bản nháp</option><option value="published">Đang hiển thị</option><option value="sold">Đã bán</option><option value="hidden">Ẩn</option></select>
    <input placeholder="Tình trạng (VD: Like New, New...)" value={form.condition} onChange={e=>set("condition",e.target.value)}/>
    <input type="number" placeholder="Thứ tự hiển thị (0 = mặc định)" value={form.sort_order} onChange={e=>set("sort_order",Number(e.target.value))}/>
    <textarea className="full" rows={5} placeholder="Mô tả sản phẩm" value={form.description} onChange={e=>set("description",e.target.value)}/>
    <textarea className="full" rows={5} placeholder="Thông tin chi tiết (reference, size, year, dung tích, box/papers...)" value={form.details} onChange={e=>set("details",e.target.value)}/>
   </div>

   <div className="product-upload" style={{marginTop:18}}>
    <label className="mono upload-title">ẢNH SẢN PHẨM</label>
    <p className="mono upload-note">Ảnh sẽ tự động resize tối đa 1800px và nén WebP trước khi upload. Website sẽ tự tối ưu kích thước ảnh khi hiển thị.</p>
    <input id="product-image-input" className="image-input" type="file" accept="image/*" multiple onChange={e=>{upload(e.target.files);e.currentTarget.value=""}}/>
    <label htmlFor="product-image-input" className="image-add-btn">+ THÊM ẢNH</label>
    {uploading&&<span className="upload-status mono">Đang tối ưu & tải ảnh lên...</span>}
    <div className="image-list">
     {form.images.length===0&&!uploading&&<div className="image-empty mono">Chưa có ảnh. Bạn có thể chọn nhiều ảnh cùng lúc.</div>}
     {form.images.map((im,i)=><div className="image-card" key={`${im.url}-${i}`}>
      <div className="image-thumb"><img src={getProductImageUrl(im.url)} alt={im.alt||form.name}/><button type="button" aria-label={`Xóa ảnh ${i+1}`} onClick={()=>set("images",form.images.filter((_,j)=>j!==i))}>×</button></div>
      <div className="image-meta mono"><span>Ảnh {i+1}</span>{im.originalSize&&im.optimizedSize?<span>{formatBytes(im.originalSize)} → {formatBytes(im.optimizedSize)}</span>:<span>Đã upload</span>}</div>
     </div>)}
    </div>
   </div>

   <label style={{display:"flex",gap:8,alignItems:"center",marginTop:15}}><input type="checkbox" checked={form.featured} onChange={e=>set("featured",e.target.checked)}/> Hiển thị ở mục Sản phẩm nổi bật</label>

   <div style={{marginTop:18,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
    <button className="btn" disabled={loading||uploading}>{loading?"Đang lưu...":editing?"Lưu thay đổi →":"Thêm sản phẩm →"}</button>
    {editing&&<button type="button" className="btn" onClick={()=>{setEditing(null);setForm(blank);setLastUrl("")}}>Hủy</button>}
    {msg&&<span className="mono" style={{fontSize:12}}>{msg}</span>}
    {lastUrl&&<a className="btn" href={lastUrl} target="_blank" rel="noreferrer">Xem trên website ↗</a>}
   </div>
  </form>

  <div className="section-title"><h2>Danh sách</h2><input className="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm sản phẩm..."/></div>

  {visible.length?<div className="admin-products">{visible.map(p=><div className="admin-product" key={p.id}>
   <div className="admin-product-image">{p.images?.[0]?.url?<img src={getProductImageUrl(p.images[0].url)} alt={p.name}/>:<div className="placeholder">{p.brand}<br/><small>{p.name}</small></div>}</div>
   <div className="admin-product-info">
    <div className="brand">{p.brand} · {p.category}</div>
    <h3>{p.name}</h3>
    <div className="mono">Cost: {p.cost?`${new Intl.NumberFormat("vi-VN").format(Number(p.cost))} ${p.currency}`:"—"} · Giá bán: {p.price?`${new Intl.NumberFormat("vi-VN").format(Number(p.price))} ${p.currency}`:"Liên hệ"}{p.volume?` · ${p.volume}`:""} · {p.status}</div>
    <p>{p.description||"Chưa có mô tả."}</p>
    <div><button className="btn" onClick={()=>edit(p)}>Sửa</button>{p.status==="published"&&p.category&&p.brand_slug&&<a className="btn" style={{marginLeft:7}} href={`/products/${p.category}/${p.brand_slug}/${p.slug}`} target="_blank" rel="noreferrer">Xem web ↗</a>}<button className="btn" style={{marginLeft:7}} onClick={()=>del(p.id)}>Xóa</button></div>
   </div>
  </div>)}</div>:<div className="admin-box"><p>Chưa có sản phẩm.</p></div>}
 </div></main>;
}
