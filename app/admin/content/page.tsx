"use client";
import {useEffect,useState} from "react";

type FieldProps={label:string,value:any,placeholder?:string,multiline?:boolean,onChange:(v:string)=>void,onSave:()=>Promise<void>,saving:boolean,msg:string};
function EditableField({label,value,placeholder,multiline,onChange,onSave,saving,msg}:FieldProps){
  return <div className="content-field">
    <label className="mono">{label}</label>
    {multiline?<textarea className="admin-textarea" value={value??""} onChange={e=>onChange(e.target.value)} rows={4} placeholder={placeholder}/>:<input className="admin-input" value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>} 
    <div className="field-actions"><button className="btn" type="button" onClick={onSave} disabled={saving}>{saving?"ĐANG LƯU…":"LƯU Ô NÀY →"}</button>{msg&&<span className="mono field-msg">{msg}</span>}</div>
  </div>
}

export default function ContentAdmin(){
  const [data,setData]=useState<any>({});
  const [section,setSection]=useState("home");
  const [saving,setSaving]=useState<string|null>(null);
  const [msgs,setMsgs]=useState<Record<string,string>>({});
  async function load(){const r=await fetch("/api/admin/content",{cache:"no-store"});if(r.status===401){location.href="/admin/login";return}const j=await r.json();setData(j)}
  useEffect(()=>{load()},[]);
  const current=data[section]||{};
  function set(k:string,v:string){setData((d:any)=>({...d,[section]:{...d[section],[k]:v}}))}
  async function saveField(field:string){
    setSaving(field); setMsgs(m=>({...m,[field]:"Đang lưu…"}));
    try{
      const r=await fetch("/api/admin/content",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({section,field,value:current[field]??""})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j.error||"Không lưu được");
      setMsgs(m=>({...m,[field]:"Đã lưu ✓"}));
      setTimeout(()=>setMsgs(m=>({...m,[field]:""})),1600);
    }catch(e:any){setMsgs(m=>({...m,[field]:"Lỗi: "+e.message}))}
    finally{setSaving(null)}
  }
  const homeFields:[string,string,string,boolean][]=[
    ["heroKicker","Dòng nhỏ trên banner","Góc Đồ Auth / Tuyển chọn",false],
    ["heroTitle","Tiêu đề chính trên banner","Đồ chính hãng,\nđược tuyển chọn kỹ.",true],
    ["heroSubtitle","Mô tả trên banner","Catalogue đồng hồ và nước hoa chính hãng…",true],
    ["heroButton","Nút trên banner","Xem catalogue →",false],
    ["collectionTitle","Tiêu đề bộ sưu tập","Bộ sưu tập",false],
    ["collectionCount","Số danh mục hiển thị","02 danh mục",false],
    ["watchKicker","Nhãn danh mục Đồng hồ","01 / Đồng hồ",false],
    ["watchTitle","Tên danh mục Đồng hồ","Đồng hồ",false],
    ["watchLink","Nút danh mục Đồng hồ","Xem sản phẩm →",false],
    ["perfumeKicker","Nhãn danh mục Nước hoa","02 / Hương thơm",false],
    ["perfumeTitle","Tên danh mục Nước hoa","Nước hoa",false],
    ["perfumeLink","Nút danh mục Nước hoa","Xem sản phẩm →",false],
    ["featuredTitle","Tiêu đề sản phẩm nổi bật","Sản phẩm nổi bật",false],
    ["featuredLink","Link xem tất cả","Xem tất cả →",false],
    ["featuredEmpty","Khi chưa có sản phẩm nổi bật","Chưa có sản phẩm nổi bật.",false],
    ["aboutKicker","Dòng nhỏ phần giới thiệu","Về Góc Đồ Auth",false],
    ["aboutTitle","Tiêu đề phần giới thiệu","Một catalogue\nđơn giản, dễ xem.",true],
    ["aboutBody","Nội dung phần giới thiệu","Chúng tôi tập trung vào đồng hồ và nước hoa chính hãng…",true],
    ["aboutButton","Nút phần giới thiệu","Tìm hiểu thêm →",false]
  ];
  return <main className="page"><div className="container"><div className="kicker">Admin / Nội dung</div><h1>Chỉnh sửa nội dung web</h1>
    <p className="upload-note">Mỗi ô có nút <b>LƯU Ô NÀY</b> riêng — sửa ô nào chỉ lưu ô đó, không ảnh hưởng các ô khác.</p>
    <div className="filters">{["home","about","contact","faq","shipping","returns","privacy","terms"].map(s=><button className="filter" key={s} onClick={()=>setSection(s)}>{({home:"Trang chủ",about:"Giới thiệu",contact:"Liên hệ",faq:"FAQ",shipping:"Vận chuyển",returns:"Đổi trả",privacy:"Bảo mật",terms:"Điều khoản"} as any)[s]}</button>)}</div>
    <div className="admin-box">
      {section==="home"&&<>{homeFields.map(([key,label,placeholder,multi])=><EditableField key={key} label={label} value={current[key]??""} placeholder={placeholder} multiline={multi} onChange={v=>set(key,v)} onSave={()=>saveField(key)} saving={saving===key} msg={msgs[key]||""}/>)}</>}
      {section==="about"&&<><EditableField label="Tiêu đề" value={current.title??""} onChange={v=>set("title",v)} onSave={()=>saveField("title")} saving={saving==="title"} msg={msgs.title||""}/><EditableField label="Nội dung" value={current.body??""} multiline onChange={v=>set("body",v)} onSave={()=>saveField("body")} saving={saving==="body"} msg={msgs.body||""}/></>}
      {section==="contact"&&<><EditableField label="Tiêu đề" value={current.title??""} onChange={v=>set("title",v)} onSave={()=>saveField("title")} saving={saving==="title"} msg={msgs.title||""}/><EditableField label="Lời giới thiệu" value={current.intro??""} multiline onChange={v=>set("intro",v)} onSave={()=>saveField("intro")} saving={saving==="intro"} msg={msgs.intro||""}/><EditableField label="Email" value={current.email??""} onChange={v=>set("email",v)} onSave={()=>saveField("email")} saving={saving==="email"} msg={msgs.email||""}/><EditableField label="Facebook / Messenger" value={current.facebook??""} onChange={v=>set("facebook",v)} onSave={()=>saveField("facebook")} saving={saving==="facebook"} msg={msgs.facebook||""}/><EditableField label="Số điện thoại" value={current.phone??""} onChange={v=>set("phone",v)} onSave={()=>saveField("phone")} saving={saving==="phone"} msg={msgs.phone||""}/><EditableField label="Zalo" value={current.zalo??""} onChange={v=>set("zalo",v)} onSave={()=>saveField("zalo")} saving={saving==="zalo"} msg={msgs.zalo||""}/></>}
      {!['home','about','contact'].includes(section)&&<><EditableField label="Tiêu đề" value={current.title??""} onChange={v=>set("title",v)} onSave={()=>saveField("title")} saving={saving==="title"} msg={msgs.title||""}/><EditableField label="Nội dung" value={current.body??""} multiline onChange={v=>set("body",v)} onSave={()=>saveField("body")} saving={saving==="body"} msg={msgs.body||""}/></>}
    </div>
  </div></main>
}
