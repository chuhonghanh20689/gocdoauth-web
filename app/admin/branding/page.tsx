"use client";
import {useEffect,useState} from "react";

function Preview({src,wide=false}:{src:string;wide?:boolean}){return <div className={wide?"asset-preview asset-preview-wide":"asset-preview"}>{src?<img src={src} alt="Xem trước"/>:<span className="mono">Chưa có ảnh</span>}</div>}

export default function Branding(){
 const [name,setName]=useState("GÓC ĐỒ AUTH"); const [logo,setLogo]=useState(""); const [banner,setBanner]=useState(""); const [watch,setWatch]=useState(""); const [perfume,setPerfume]=useState("");
 const [files,setFiles]=useState<Record<string,File|null>>({logo:null,banner:null,watch:null,perfume:null}); const [msg,setMsg]=useState(""); const [saving,setSaving]=useState(false);
 useEffect(()=>{fetch("/api/admin/content").then(async r=>{if(r.status===401){location.href="/admin/login";return}const d=await r.json();setName(d.branding?.siteName||"GÓC ĐỒ AUTH");setLogo(d.branding?.logo||"");setBanner(d.branding?.banner||"");setWatch(d.branding?.watchImage||"");setPerfume(d.branding?.perfumeImage||"")})},[]);
 function choose(key:string,f?:File){if(!f)return;setFiles(v=>({...v,[key]:f}));const u=URL.createObjectURL(f);if(key==="logo")setLogo(u);if(key==="banner")setBanner(u);if(key==="watch")setWatch(u);if(key==="perfume")setPerfume(u)}
 async function upload(key:string,file:File){const form=new FormData();form.append("file",file);form.append("type",key);const r=await fetch("/api/admin/branding",{method:"POST",body:form});const d=await r.json();if(!r.ok)throw new Error(d.error||"Không thể upload");return d.value as string}
 async function save(){setSaving(true);setMsg("");try{const text=await fetch("/api/admin/branding",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"site_name",value:name})});const td=await text.json();if(!text.ok)throw new Error(td.error||"Không thể lưu tên thương hiệu");for(const key of ["logo","banner","watch","perfume"]){const f=files[key];if(f){const value=await upload(key,f);if(key==="logo")setLogo(value);if(key==="banner")setBanner(value);if(key==="watch")setWatch(value);if(key==="perfume")setPerfume(value)}}setFiles({logo:null,banner:null,watch:null,perfume:null});setMsg("Đã lưu nhận diện website.")}catch(e:any){setMsg(e.message||"Có lỗi.")}finally{setSaving(false)}}
 const picker=(key:string,label:string)=><label className="btn asset-picker">{label}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={e=>choose(key,e.target.files?.[0])}/></label>;
 return <main className="page"><div className="container"><div className="kicker">Admin / Nhận diện</div><h1>Nhận diện website</h1><div className="admin-box branding-admin">
   <section className="branding-section"><label className="mono">Tên thương hiệu hiển thị</label><input className="admin-input" value={name} onChange={e=>setName(e.target.value)} placeholder="GÓC ĐỒ AUTH"/><p className="upload-note">Tên này sẽ hiển thị cạnh logo ở header và footer.</p></section>
   <section className="branding-section"><h2>Logo</h2><Preview src={logo}/><div className="asset-actions">{picker("logo","Chọn logo")}</div><p className="upload-note">Nên dùng PNG/WebP nền trong suốt hoặc SVG. Logo sẽ được giữ nguyên tỷ lệ.</p></section>
   <section className="branding-section"><h2>Ảnh banner trang chủ</h2><Preview src={banner} wide/><div className="asset-actions">{picker("banner","Chọn ảnh banner")}</div><p className="upload-note">Khuyến nghị ảnh ngang khoảng 1800–2400px, tỷ lệ 2:1 đến 3:1.</p></section>
   <section className="branding-section"><h2>Ảnh đại diện danh mục</h2><div className="asset-grid"><div><Preview src={watch}/><div className="asset-label">Đồng hồ</div>{picker("watch","Chọn ảnh")}</div><div><Preview src={perfume}/><div className="asset-label">Nước hoa</div>{picker("perfume","Chọn ảnh")}</div></div><p className="upload-note">Nên dùng ảnh dọc hoặc vuông, chủ thể rõ và ít chữ để hiển thị đẹp trên card.</p></section>
   <div className="save-row"><button className="btn" disabled={saving} onClick={save}>{saving?"ĐANG LƯU…":"LƯU THAY ĐỔI →"}</button>{msg&&<span className="mono status-message">{msg}</span>}</div>
 </div></div></main>
}
