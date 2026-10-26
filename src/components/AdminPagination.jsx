import { useEffect, useState } from "react";

export const ADMIN_PAGE_SIZE = 8; // mỗi trang hiện 8 dòng

/**
 * Hook phân trang phía trình duyệt.
 * resetKey: khi giá trị này đổi (ví dụ ô tìm kiếm, bộ lọc) thì tự quay về trang 1.
 */
export function usePagination(items, resetKey = "", pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => setPage(1), [resetKey]);

  // Xóa bớt dòng làm trang hiện tại không còn tồn tại -> lùi về trang cuối
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    setPage,
    totalPages,
    total: items.length,
    pageSize,
    from: items.length ? start + 1 : 0,
    to: Math.min(start + pageSize, items.length),
    pageItems: items.slice(start, start + pageSize),
  };
}

/**
 * Dãy số trang rút gọn: luôn hiện 2 trang đầu, 2 trang cuối và trang hiện tại (kèm 1 trang hai bên),
 * phần bị ẩn thay bằng "…".  Ví dụ 5 trang, đang ở trang 1:  1 2 … 4 5
 */
export function buildPages(page, totalPages) {
  const show = new Set([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
  const nums = [...show].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap-" + n);
    out.push(n);
  });
  return out;
}

/** Thanh số trang:  ‹ Trước  1 2 … 4 5  Tiếp ›  Cuối »  (chỉ hiện khi có từ 2 trang trở lên) */
export default function AdminPagination({ pager }) {
  const { page, totalPages, setPage, from, to, total } = pager;
  if (totalPages <= 1) return null;

  const items = buildPages(page, totalPages);

  const go = (n) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="admin-pager">
      <span className="admin-pager-info">Hiển thị {from}–{to} trên {total}</span>
      <nav className="admin-pager-nav" aria-label="Phân trang">
        {page > 1 && (
          <button type="button" className="admin-pager-step" onClick={() => go(page - 1)}>‹ Trước</button>
        )}
        {items.map((n) =>
          typeof n === "string" ? (
            <span key={n} className="admin-pager-gap">…</span>
          ) : n === page ? (
            <span key={n} className="admin-pager-num current" aria-current="page">{n}</span>
          ) : (
            <button key={n} type="button" className="admin-pager-num" onClick={() => go(n)}>{n}</button>
          )
        )}
        {page < totalPages && (
          <button type="button" className="admin-pager-step" onClick={() => go(page + 1)}>Tiếp ›</button>
        )}
        {page < totalPages && (
          <button type="button" className="admin-pager-step" onClick={() => go(totalPages)} title={`Đến trang cuối (${totalPages})`}>Cuối »</button>
        )}
      </nav>
    </div>
  );
}
