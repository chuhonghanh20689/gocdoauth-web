import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
export const runtime="nodejs";
export async function GET(){if(!await currentAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});const sb=getSupabaseAdmin();const [{data:categories,error:cErr},{data:brands,error:bErr}]=await Promise.all([sb.from("categories").select("id,name,slug,sort_order,is_active").order("sort_order"),sb.from("brands").select("id,name,slug,category_id,is_active").order("name")]);if(cErr||bErr)return NextResponse.json({error:(cErr||bErr)?.message},{status:500});return NextResponse.json({categories:categories||[],brands:brands||[]});}
