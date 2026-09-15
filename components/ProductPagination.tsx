"use client";

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

  const makeHref = (pageNumber: number) => {
    const params = new URLSearchParams();

    if (pageNumber > 1) params.set("page", String(pageNumber));
    if (pageSize !== 12) params.set("pageSize", String(pageSize));
    if (query) params.set("q", query);

    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const pages: (number | "ellipsis")[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else if (page <= 3) {
    pages.push(1, 2, 3, "ellipsis", totalPages);
  } else if (page >= totalPages - 2) {
    pages.push(1, "ellipsis", totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
  }

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
          {pages.map((pageNumber, index) =>
            pageNumber === "ellipsis" ? (
              <span className="pagination-ellipsis" key={`ellipsis-${index}`}>
                …
              </span>
            ) : pageNumber === page ? (
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
        </div>

        {page < totalPages ? (
          <Link className="pagination-arrow" href={makeHref(totalPages)}>
            Cuối →
          </Link>
        ) : (
          <span className="pagination-arrow disabled">Cuối →</span>
        )}

        <form className="pagination-size-form" action={basePath} method="get">
          {query && <input type="hidden" name="q" value={query} />}
          <label htmlFor={`page-size-${basePath.replace(/[^a-z0-9]/gi, "-")}`}>
            Sản phẩm / trang
          </label>
          <select
            id={`page-size-${basePath.replace(/[^a-z0-9]/gi, "-")}`}
            name="pageSize"
            defaultValue={String(pageSize)}
            aria-label="Số sản phẩm mỗi trang"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </form>
      </nav>
    </div>
  );
}
