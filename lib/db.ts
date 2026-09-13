import { getSupabasePublic } from "./supabase";

export type Product = {
  id: string;
  category: "watches" | "perfumes";
  brand: string;
  name: string;
  price: string;
  description: string;
  image: string;
};

export async function getProducts(options?: { category?: string; featured?: boolean }) {
  const supabase = getSupabasePublic();
  let q = supabase
    .from("products")
    .select("id,slug,name,price,currency,description,details,condition,status,featured,sort_order,category_id,brand_id,product_images(id,storage_path,alt,sort_order),categories!products_category_id_fkey(slug,name),brands!products_brand_id_fkey(slug,name)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (options?.category) q = q.eq("categories.slug", options.category);
  if (options?.featured) q = q.eq("featured", true);
  const { data, error } = await q.eq("status", "published");
  if (error) throw error;
  let rows: any[] = (data || []).map((p: any) => ({
    ...p,
    categories: Array.isArray(p.categories) ? p.categories[0] : p.categories,
    brands: Array.isArray(p.brands) ? p.brands[0] : p.brands,
  }));
  if (options?.category) rows = rows.filter((p) => p.categories?.slug === options.category);
  if (options?.featured) rows = rows.filter((p) => p.featured === true);
  return rows;
}
