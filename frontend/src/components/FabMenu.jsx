import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import SetupFab, { countPicked } from "./SetupFab";
import ZaloFab from "./ZaloFab";
import "../styles/setupFab.css";

/**
 * FabMenu — MỘT nút tròn nhỏ ghim ở mép phải màn hình.
 * Rê chuột vào (hoặc chạm trên điện thoại) thì 2 chức năng ẩn bung ra phía trên: Zalo + Dựng setup.
 * Muốn thêm chức năng mới: thêm một <div className="fab-item">…</div> vào .fab-items.
 */
export default function FabMenu() {
  const { pathname } = useLocation(); // đổi trang thì đọc lại số món + đóng menu
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => setOpen(false), [pathname]);

  // Đóng khi bấm ra ngoài hoặc nhấn Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = countPicked();

  return (
    <div ref={ref} className={`fab-menu${open ? " open" : ""}`}>
      <div className="fab-items" onClick={() => setOpen(false)}>
        <div className="fab-item"><ZaloFab /></div>
        <div className="fab-item"><SetupFab /></div>
      </div>

      <button
        type="button"
        className="fab-main"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Đóng menu hỗ trợ" : "Mở menu hỗ trợ"}
        title="Hỗ trợ & Dựng setup"
      >
        <svg className="fab-main-icon" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </svg>
        {count > 0 && <span className="fab-main-badge">{count}</span>}
      </button>
    </div>
  );
}
