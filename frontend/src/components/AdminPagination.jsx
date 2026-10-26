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

/** Thanh số trang:  Trước  1 2 3 … 10  Tiếp  (chỉ hiện khi có từ 2 trang trở lên) */
export default function AdminPagination({ pager }) {
  const { page, totalPages, setPage, from, to, total } = pager;
  if (totalPages <= 1) return null;

  // Hiện tối đa 10 số trang, trượt theo trang hiện tại
  const WINDOW = 10;
  let first = Math.max(1, page - Math.floor(WINDOW / 2));
  const last = Math.min(totalPages, first + WINDOW - 1);
  first = Math.max(1, last - WINDOW + 1);
  const numbers = [];
  for (let n = first; n <= last; n++) numbers.push(n);

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
        {numbers.map((n) =>
          n === page ? (
            <span key={n} className="admin-pager-num current" aria-current="page">{n}</span>
          ) : (
            <button key={n} type="button" className="admin-pager-num" onClick={() => go(n)}>{n}</button>
          )
        )}
        {page < totalPages && (
          <button type="button" className="admin-pager-step" onClick={() => go(page + 1)}>Tiếp ›</button>
        )}
      </nav>
    </div>
  );
}
