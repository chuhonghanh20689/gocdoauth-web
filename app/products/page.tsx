import Link from "next/link";
import { getProducts } from "@/lib/db";
import RemoteImage from "@/components/RemoteImage";
import ProductPagination from "@/components/ProductPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; pageSize?: string | string[]; sort?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params?.q) ? params.q[0] : params?.q;
  const query = String(rawQuery || "").trim();
  const rawPage = Array.isArray(params?.page) ? params.page[0] : params?.page;
  const requestedPage = Number.parseInt(String(rawPage || "1"), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const rawPageSize = Array.isArray(params?.pageSize)
    ? params.pageSize[0]
    : params?.pageSize;
  const parsedPageSize = Number.parseInt(String(rawPageSize || "12"), 10);
  const pageSize = [12, 24, 36, 48].includes(parsedPageSize) ? parsedPageSize : 12;
  const rawSort = Array.isArray(params?.sort)
    ? params.sort[0]
    : params?.sort;
  const sort = rawSort === "oldest" ? "oldest" : "newest";

  let items: any[] = [];
  let loadError = "";
  try {
    items = await getProducts();
  } catch (e: any) {
    loadError = e?.message || "Không thể tải sản phẩm.";
  }

  if (query) {
    const q = query.toLocaleLowerCase("vi-VN");
    items = items.filter((p) => {
      const text = [
        p.name,
        p.brands?.name,
        p.categories?.name,
        p.sku,
        p.description,
        p.details,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi-VN");
      return text.includes(q);
    });
  }

  items.sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);

  return (
    <main>
      <div className="container catalog-head">
        <div className="kicker">Catalogue / {query ? "Tìm kiếm" : "Tất cả"}</div>
        <h1>{query ? "Kết quả tìm kiếm" : "Sản phẩm"}</h1>
        <p style={{ color: "#4e493f" }}>
          {query
            ? `Kết quả cho “${query}”.`
            : "Đồng hồ và nước hoa, được sắp xếp theo danh mục và thương hiệu."}
        </p>
      </div>

      <div className="container">
        <div className="filters">
          <Link className="filter" href="/products">Tất cả</Link>
          <Link className="filter" href="/products/watches">Đồng hồ</Link>
          <Link className="filter" href="/products/perfumes">Nước hoa</Link>
        </div>

        {!loadError && total > 0 && (
          <div className="product-count">
            Hiển thị {start + 1}–{Math.min(start + pageSize, total)} trong {total}{" "}
            {query ? "sản phẩm phù hợp" : "sản phẩm"}
          </div>
        )}

        {paginatedItems.length ? (
          <>

            <ProductPagination
              page={safePage}
              total={total}
              pageSize={pageSize}
              basePath="/products"
              query={query}
              sort={sort}
            />
            <div className="product-grid">
              {paginatedItems.map((p) => (
                <Link
                  href={`/products/${p.categories?.slug || "watches"}/${p.brands?.slug || "product"}/${p.slug}`}
                  className="product-card"
                  key={p.id}
                >
                  <div className="product-image">
                    {p.product_images?.[0]?.storage_path ? (
                      <RemoteImage
                        src={p.product_images[0].storage_path}
                        alt={p.product_images[0].alt || p.name}
                      />
                    ) : (
                      <div className="placeholder">
                        {p.brands?.name}
                        <br />
                        <small>{p.name}</small>
                      </div>
                    )}
                  </div>
                  <div className="brand">{p.brands?.name || ""}</div>
                  <div className="product-name">{p.name}</div>
                </Link>
              ))}
            </div>

            <ProductPagination
              page={safePage}
              total={total}
              pageSize={pageSize}
              basePath="/products"
              query={query}
              sort={sort}
            />
          </>
        ) : (
          <div className="admin-box">
            <p>
              {loadError
                ? `Không thể tải catalogue: ${loadError}`
                : query
                  ? `Không tìm thấy sản phẩm phù hợp với “${query}”.`
                  : "Chưa có sản phẩm đang hiển thị."}
            </p>
            {loadError ? (
              <p className="mono" style={{ fontSize: 12 }}>
                Nếu bạn vừa thay đổi quyền Supabase, hãy tải lại trang sau khi restart server.
              </p>
            ) : query ? (
              <Link className="btn" href="/products">Xem tất cả sản phẩm →</Link>
            ) : (
              <Link className="btn" href="/admin">Vào quản trị →</Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
