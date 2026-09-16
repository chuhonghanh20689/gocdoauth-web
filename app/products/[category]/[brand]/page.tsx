import Link from "next/link";
import { getProducts } from "@/lib/db";
import RemoteImage from "@/components/RemoteImage";
import ProductPagination from "@/components/ProductPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; brand: string }>;
  searchParams: Promise<{ page?: string | string[]; pageSize?: string | string[]; sort?: string | string[] }>;
}) {
  const { category, brand } = await params;
  const queryParams = await searchParams;

  const rawPage = Array.isArray(queryParams?.page)
    ? queryParams.page[0]
    : queryParams?.page;
  const requestedPage = Number.parseInt(String(rawPage || "1"), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const rawPageSize = Array.isArray(queryParams?.pageSize)
    ? queryParams.pageSize[0]
    : queryParams?.pageSize;
  const parsedPageSize = Number.parseInt(String(rawPageSize || "12"), 10);
  const pageSize = [12, 24, 36, 48].includes(parsedPageSize) ? parsedPageSize : 12;
  const rawSort = Array.isArray(queryParams?.sort)
    ? queryParams.sort[0]
    : queryParams?.sort;
  const sort = rawSort === "oldest" ? "oldest" : "newest";

  let items: any[] = [];
  try {
    items = await getProducts({ category });
  } catch {}

  items = items.filter((p) => p.brands?.slug === brand);

  items.sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });

  const title = items[0]?.brands?.name || brand.toUpperCase();
  const catTitle = category === "perfumes" ? "Nước hoa" : "Đồng hồ";

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paginatedItems = items.slice(start, start + pageSize);

  return (
    <main>
      <div className="container catalog-head">
        <div className="kicker">
          <Link href={`/products/${category}`}>{catTitle}</Link> / {title}
        </div>
        <h1>{title}</h1>
      </div>

      <div className="container">
        {total > 0 && (
          <div className="product-count">
            Hiển thị {start + 1}–{Math.min(start + pageSize, total)} trong {total} sản phẩm
          </div>
        )}

        {paginatedItems.length ? (
          <>

            <ProductPagination
              page={safePage}
              total={total}
              pageSize={pageSize}
              basePath={`/products/${category}/${brand}`}
              sort={sort}
            />
            <div className="product-grid">
              {paginatedItems.map((p) => (
                <Link
                  href={`/products/${category}/${brand}/${p.slug}`}
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
                        {title}
                        <br />
                        <small>{p.name}</small>
                      </div>
                    )}
                  </div>
                  <div className="brand">{title}</div>
                  <div className="product-name">{p.name}</div>
                </Link>
              ))}
            </div>

            <ProductPagination
              page={safePage}
              total={total}
              pageSize={pageSize}
              basePath={`/products/${category}/${brand}`}
              sort={sort}
            />
          </>
        ) : (
          <div className="admin-box">
            <p>Chưa có sản phẩm trong thương hiệu này.</p>
          </div>
        )}
      </div>
    </main>
  );
}
