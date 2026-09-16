import Link from "next/link";
import { getProducts } from "@/lib/db";
import RemoteImage from "@/components/RemoteImage";
import ProductPagination from "@/components/ProductPagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function Category({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string | string[]; pageSize?: string | string[]; sort?: string | string[] }>;
}) {
  const { category } = await params;
  const queryParams = await searchParams;
  const title =
    category === "perfumes"
      ? "Nước hoa"
      : category === "watches"
        ? "Đồng hồ"
        : "Sản phẩm";

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

  const brandPairs: [string, string][] = items
    .map((p: any) => [p.brands?.slug, p.brands?.name] as [string, string])
    .filter(([s]) => Boolean(s));

  const brands = Array.from(new Map<string, string>(brandPairs).entries());
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
        <div className="kicker">Catalogue / {title}</div>
        <h1>{title}</h1>
        <p style={{ color: "#4e493f" }}>Xem sản phẩm theo thương hiệu.</p>
      </div>

      <div className="container">
        <div className="filters">
          <Link className="filter" href="/products">Tất cả</Link>
          {brands.map(([slug, name]) => (
            <Link
              className="filter"
              href={`/products/${category}/${slug}`}
              key={String(slug)}
            >
              {String(name)}
            </Link>
          ))}
        </div>

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
              basePath={`/products/${category}`}
              sort={sort}
            />
            <div className="product-grid">
              {paginatedItems.map((p) => (
                <Link
                  href={`/products/${category}/${p.brands?.slug || "product"}/${p.slug}`}
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
              basePath={`/products/${category}`}
              sort={sort}
            />
          </>
        ) : (
          <div className="admin-box">
            <p>Chưa có sản phẩm trong danh mục này.</p>
          </div>
        )}
      </div>
    </main>
  );
}
