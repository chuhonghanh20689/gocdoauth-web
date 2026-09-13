"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false); const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");
  const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  const d=await r.json(); setLoading(false); if(!r.ok){setError(d.error||"Đăng nhập thất bại.");return;} router.push("/admin"); router.refresh();
 }
 return <main className="page"><div className="container" style={{maxWidth:520}}><div className="kicker">Khu vực quản trị</div><h1>Đăng nhập</h1><form onSubmit={submit} className="admin-box">
 <label className="mono">Email / Username</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required style={{display:"block",width:"100%",padding:12,border:"1px solid #211f1a",background:"transparent",margin:"8px 0 18px"}}/>
 <label className="mono">Mật khẩu</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required style={{display:"block",width:"100%",padding:12,border:"1px solid #211f1a",background:"transparent",margin:"8px 0 18px"}}/>
 {error && <p style={{color:"#7b3028"}}>{error}</p>}<button className="btn" disabled={loading}>{loading?"Đang đăng nhập...":"Đăng nhập →"}</button>
 </form></div></main>
}