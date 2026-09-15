import Link from "next/link";

type ProductPaginationProps = {
  page: number;
  total: number;
  pageSize?: number;
  basePath: string;
  query?: string;
};

export default function ProductPagination({
  page,
  total,
  pageSize = 12,
  basePath,
  query,
}: ProductPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const makeHref = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (pageNumber > 1) params.set("page", String(pageNumber));
    if (query) params.set("q", query);
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="product-pagination" aria-label="Phân trang sản phẩm">
      {page > 1 ? (
        <Link className="pagination-arrow" href={makeHref(page - 1)}>
          ← Trước
        </Link>
      ) : (
        <span className="pagination-arrow disabled">← Trước</span>
      )}

      <div className="pagination-pages">
        {start > 1 && (
          <>
            <Link className="pagination-page" href={makeHref(1)}>1</Link>
            {start > 2 && <span className="pagination-ellipsis">…</span>}
          </>
        )}

        {pages.map((pageNumber) =>
          pageNumber === page ? (
            <span className="pagination-page active" key={pageNumber}>
              {pageNumber}
            </span>
          ) : (
            <Link className="pagination-page" href={makeHref(pageNumber)} key={pageNumber}>
              {pageNumber}
            </Link>
          )
        )}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="pagination-ellipsis">…</span>}
            <Link className="pagination-page" href={makeHref(totalPages)}>
              {totalPages}
            </Link>
          </>
        )}
      </div>

      {page < totalPages ? (
        <Link className="pagination-arrow" href={makeHref(page + 1)}>
          Sau →
        </Link>
      ) : (
        <span className="pagination-arrow disabled">Sau →</span>
      )}
    </nav>
  );
}
