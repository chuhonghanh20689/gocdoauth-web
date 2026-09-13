import { redirect } from "next/navigation";
import Link from "next/link";
import { currentAdmin } from "@/lib/auth";
import Logout from "./Logout";

export default async function Admin(){
 const admin=await currentAdmin(); if(!admin) redirect("/admin/login");
 return <main className="page"><div className="container"><div className="kicker">Khu vực quản trị</div><h1>Dashboard</h1><p>Xin chào, {admin.name}.</p>
 <div className="categories" style={{marginTop:30}}>
  <Link className="category" href="/admin/products"><span className="kicker">Quản lý</span><h3>Sản phẩm</h3><span className="mono">Thêm / sửa / xóa →</span></Link>
  <Link className="category" href="/admin/branding"><span className="kicker">Quản lý</span><h3>Nhận diện</h3><span className="mono">Thay logo →</span></Link>
  <Link className="category" href="/admin/content"><span className="kicker">Quản lý</span><h3>Nội dung web</h3><span className="mono">Chỉnh sửa →</span></Link>
  <Link className="category" href="/admin/admins"><span className="kicker">Quản lý</span><h3>Admin</h3><span className="mono">Thêm / xóa tài khoản →</span></Link>
  <Link className="category" href="/admin/settings"><span className="kicker">Tài khoản</span><h3>Đổi mật khẩu</h3><span className="mono">Bảo mật →</span></Link>
  <div className="category"><span className="kicker">Tài khoản</span><h3>{admin.email}</h3><Logout /></div>
 </div></div></main>
}