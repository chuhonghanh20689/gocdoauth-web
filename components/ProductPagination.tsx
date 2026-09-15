import Link from "next/link";

type ProductPaginationProps = {
  page: number;
  total: number;
  pageSize?: number;
  basePath: string;
  query?: string;
};

const PAGE_SIZE_OPTIONS = [12, 24, 36, 48];

export default function ProductPagination({
  page,
  total,
  pageSize = 12,
  basePath,
  query,
}: ProductPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 0) return null;

  const makeHref = (pageNumber: number, size = pageSize) => {
    const params = new URLSearchParams();

    if (pageNumber > 1) params.set("page", String(pageNumber));
    if (size !== 12) params.set("pageSize", String(size));
    if (query) params.set("q", query);

    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="product-pagination-wrap">
      <nav className="product-pagination" aria-label="Phân trang sản phẩm">
        {page > 1 ? (
          <Link className="pagination-arrow" href={makeHref(1)}>
            ← Đầu
          </Link>
        ) : (
          <span className="pagination-arrow disabled">← Đầu</span>
        )}

        <div className="pagination-pages">
          {start > 1 && (
            <>
              <Link className="pagination-page" href={makeHref(1)}>
                1
              </Link>
              {start > 2 && <span className="pagination-ellipsis">…</span>}
            </>
          )}

          {pages.map((pageNumber) =>
            pageNumber === page ? (
              <span className="pagination-page active" key={pageNumber}>
                {pageNumber}
              </span>
            ) : (
              <Link
                className="pagination-page"
                href={makeHref(pageNumber)}
                key={pageNumber}
              >
                {pageNumber}
              </Link>
            )
          )}

          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <span className="pagination-ellipsis">…</span>
              )}
              <Link className="pagination-page" href={makeHref(totalPages)}>
                {totalPages}
              </Link>
            </>
          )}
        </div>

        {page < totalPages ? (
          <Link className="pagination-arrow" href={makeHref(totalPages)}>
            Cuối →
          </Link>
        ) : (
          <span className="pagination-arrow disabled">Cuối →</span>
        )}
      </nav>

      <div className="pagination-size">
        <span>Sản phẩm / trang</span>
        <div className="pagination-size-options">
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Link
              key={size}
              className={`pagination-size-option ${size === pageSize ? "active" : ""}`}
              href={makeHref(1, size)}
            >
              {size}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
