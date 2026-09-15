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
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { category, brand } = await params;
  const queryParams = await searchParams;

  const rawPage = Array.isArray(queryParams?.page)
    ? queryParams.page[0]
    : queryParams?.page;
  const requestedPage = Number.parseInt(String(rawPage || "1"), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let items: any[] = [];
  try {
    items = await getProducts({ category });
  } catch {}

  items = items.filter((p) => p.brands?.slug === brand);

  const title = items[0]?.brands?.name || brand.toUpperCase();
  const catTitle = category === "perfumes" ? "Nước hoa" : "Đồng hồ";

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const paginatedItems = items.slice(start, start + PAGE_SIZE);

  return (
    <main>
      <div className="container catalog-head">
        <div className="kicker">
          <Link href={`/products/${category}`}>{catTitle}</Link> / {title}
        </div>
        <h1>{title}</h1>
      </div>

      <div className="container">
        <div className="product-count">{total} sản phẩm</div>

        {paginatedItems.length ? (
          <>
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
              pageSize={PAGE_SIZE}
              basePath={`/products/${category}/${brand}`}
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
