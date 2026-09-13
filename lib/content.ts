import { getSupabaseAdmin } from "./supabase";

// Public content is read server-side so it always reflects the latest admin changes
// without depending on public-table RLS policies.
export async function getPage(key: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("pages")
      .select("page_key,title,content,seo_title,seo_description,is_published")
      .eq("page_key", key)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return null;
    let content: any = {};
    if (data.content && typeof data.content === "object") content = data.content;
    else { try { content = data.content ? JSON.parse(data.content) : {}; } catch { content = { body: data.content || "" }; } }
    return { ...data, content };
  } catch { return null; }
}

export async function getSetting(key: string, fallback = "") {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
    return data?.value ?? fallback;
  } catch { return fallback; }
}
