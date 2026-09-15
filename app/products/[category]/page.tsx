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
  searchParams: Promise<{ page?: string | string[] }>;
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

  let items: any[] = [];
  try {
    items = await getProducts({ category });
  } catch {}

  const brandPairs: [string, string][] = items
    .map((p: any) => [p.brands?.slug, p.brands?.name] as [string, string])
    .filter(([s]) => Boolean(s));

  const brands = Array.from(new Map<string, string>(brandPairs).entries());
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const paginatedItems = items.slice(start, start + PAGE_SIZE);

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
            Hiển thị {start + 1}–{Math.min(start + PAGE_SIZE, total)} trong {total} sản phẩm
          </div>
        )}

        {paginatedItems.length ? (
          <>
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
              pageSize={PAGE_SIZE}
              basePath={`/products/${category}`}
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
