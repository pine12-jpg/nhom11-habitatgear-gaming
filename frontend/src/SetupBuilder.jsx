import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/client";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { formatVND } from "../utils/format";

/** Các vị trí trên bàn setup — slug trùng với danh mục trong cửa hàng */
const SLOTS = [
  { slug: "man-hinh", label: "Màn hình", icon: "🖵" },
  { slug: "ban-phim", label: "Bàn phím", icon: "⌨️" },
  { slug: "chuot", label: "Chuột", icon: "🖱️" },
  { slug: "tai-nghe", label: "Tai nghe", icon: "🎧" },
  { slug: "ghe-ban", label: "Ghế / Bàn", icon: "🪑" },
];

const STORAGE_KEY = "habitat_setup_picked";

/** Số chạy mượt từ giá trị cũ sang giá trị mới */
function useCountUp(target, duration = 550) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const begin = from.current;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(begin + (target - begin) * eased);
      setValue(v);
      from.current = v;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/** Lưu các món đã chọn (chỉ lưu id) để giữ nguyên khi khách chuyển trang */
function loadPickedIds() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * SetupBuilder — thanh tác vụ "Dựng góc setup" ghim ở mép phải màn hình.
 * - Thu gọn: một thanh icon dọc (mỗi icon là một vị trí: màn hình, bàn phím, chuột, tai nghe, ghế).
 * - Bấm vào: ngăn kéo trượt ra từ bên phải, có bàn setup xem trước, danh sách sản phẩm,
 *   tổng tiền và nút thêm cả bộ vào giỏ.
 */
export default function SetupBuilder() {
  const { addItem } = useCart();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState(null);
  const [pickedIds, setPickedIds] = useState(loadPickedIds); // { slug: productId }
  const [active, setActive] = useState(SLOTS[0].slug);

  // Chỉ tải sản phẩm khi mở lần đầu để không tốn request ở mọi trang
  useEffect(() => {
    if (!open || catalog) return;
    Promise.all(
      SLOTS.map((s) =>
        api
          .get("/products", { params: { category: s.slug, limit: 60 } })
          .then(({ data }) => [s.slug, data.items])
          .catch(() => [s.slug, []])
      )
    ).then((pairs) => setCatalog(Object.fromEntries(pairs)));
  }, [open, catalog]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pickedIds));
    } catch {
      /* bỏ qua nếu trình duyệt chặn storage */
    }
  }, [pickedIds]);

  // Đóng bằng phím Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Món đã chọn (đối chiếu với danh mục để lấy giá mới nhất)
  const picked = {};
  SLOTS.forEach((s) => {
    const id = pickedIds[s.slug];
    const p = id && catalog?.[s.slug]?.find((x) => x.id === id);
    if (p) picked[s.slug] = p;
  });
  const chosen = SLOTS.map((s) => picked[s.slug]).filter(Boolean);
  const pickedCount = catalog ? chosen.length : Object.values(pickedIds).filter(Boolean).length;
  const total = chosen.reduce((sum, p) => sum + p.finalPrice, 0);
  const shownTotal = useCountUp(total);

  const openSlot = useCallback((slug) => {
    if (slug) setActive(slug);
    setOpen(true);
  }, []);

  function choose(slug, p) {
    if (p.stock <= 0) return;
    setPickedIds((prev) => {
      const next = { ...prev };
      if (next[slug] === p.id) delete next[slug];
      else next[slug] = p.id;
      return next;
    });
  }

  function randomize() {
    const next = {};
    SLOTS.forEach((s) => {
      const options = (catalog?.[s.slug] || []).filter((p) => p.stock > 0);
      if (options.length) next[s.slug] = options[Math.floor(Math.random() * options.length)].id;
    });
    setPickedIds(next);
  }

  function addAll() {
    if (!chosen.length) return;
    chosen.forEach((p) => addItem(p, 1));
    toast.success(`Đã thêm ${chosen.length} sản phẩm của bộ setup vào giỏ hàng.`);
  }

  const options = catalog?.[active] || [];

  return (
    <>
      {/* ===== Thanh tác vụ thu gọn ở mép phải ===== */}
      <nav className={`setup-dock${open ? " hidden" : ""}`} aria-label="Dựng góc setup">
        <button type="button" className="dock-main" onClick={() => openSlot()} title="Dựng góc setup mơ ước">
          <span className="dock-main-icon">✨</span>
          <span className="dock-main-text">Dựng setup</span>
          {pickedCount > 0 && <span className="dock-badge">{pickedCount}</span>}
        </button>
        <div className="dock-slots">
          {SLOTS.map((s) => (
            <button
              type="button"
              key={s.slug}
              className={`dock-slot${pickedIds[s.slug] ? " done" : ""}`}
              onClick={() => openSlot(s.slug)}
              title={s.label}
              aria-label={s.label}
            >
              {s.icon}
              {pickedIds[s.slug] && <span className="dock-slot-check">✓</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* ===== Lớp mờ phía sau ===== */}
      <div className={`setup-backdrop${open ? " show" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />

      {/* ===== Ngăn kéo trượt từ phải ===== */}
      <aside className={`setup-drawer${open ? " open" : ""}`} aria-hidden={!open} aria-label="Góc setup mơ ước">
        <header className="drawer-head">
          <div className="drawer-title">
            <span className="setup-eyebrow">✨ Tự tay dựng</span>
            <h2>Góc setup mơ ước</h2>
          </div>
          <button type="button" className="drawer-close" onClick={() => setOpen(false)} aria-label="Đóng" title="Đóng (Esc)">✕</button>
        </header>

        <div className="drawer-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={randomize} disabled={!catalog}>🎲 Gợi ý ngẫu nhiên</button>
          <button type="button" className="btn-link setup-clear" onClick={() => setPickedIds({})} disabled={!pickedCount}>Xóa hết</button>
        </div>

        <div className="drawer-scroll">
          <div className="setup-stage" aria-label="Xem trước bàn setup">
            <div className="stage-glow" />
            {SLOTS.map((s, i) => {
              const p = picked[s.slug];
              return (
                <button
                  type="button"
                  key={s.slug}
                  className={`spot spot-${s.slug}${p ? " filled" : ""}${active === s.slug ? " current" : ""}`}
                  onClick={() => setActive(s.slug)}
                  title={p ? p.name : `Chọn ${s.label.toLowerCase()}`}
                >
                  {p ? (
                    <span className="spot-item" key={p.id} style={{ animationDelay: `0s, ${i * 0.3}s` }}>
                      <ProductImage product={p} />
                    </span>
                  ) : (
                    <span className="spot-empty">
                      <span className="spot-icon">{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                  )}
                </button>
              );
            })}
            <div className="stage-desk" />
          </div>

          <div className="setup-tabs" role="tablist">
            {SLOTS.map((s) => (
              <button
                key={s.slug}
                type="button"
                role="tab"
                aria-selected={active === s.slug}
                className={`setup-tab${active === s.slug ? " active" : ""}`}
                onClick={() => setActive(s.slug)}
              >
                <span>{s.icon}</span> {s.label}
                {picked[s.slug] && <span className="tab-check">✓</span>}
              </button>
            ))}
          </div>

          <div className="setup-options">
            {!catalog && <div className="muted setup-note">Đang tải sản phẩm…</div>}
            {catalog && options.length === 0 && <div className="muted setup-note">Chưa có sản phẩm trong mục này.</div>}
            {options.map((p) => {
              const selected = pickedIds[active] === p.id;
              const out = p.stock <= 0;
              return (
                <button
                  type="button"
                  key={p.id}
                  className={`setup-option${selected ? " selected" : ""}`}
                  onClick={() => choose(active, p)}
                  disabled={out}
                >
                  <span className="opt-thumb"><ProductImage product={p} /></span>
                  <span className="opt-name">{p.name}</span>
                  <span className="opt-price">{out ? "Hết hàng" : formatVND(p.finalPrice)}</span>
                  {selected && <span className="opt-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <footer className="setup-total">
          <div>
            <div className="muted" style={{ fontSize: 12.5 }}>Đã chọn {chosen.length}/{SLOTS.length} món</div>
            <div className="setup-price">{formatVND(shownTotal)}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={addAll} disabled={!chosen.length}>
            🛒 Thêm cả bộ vào giỏ
          </button>
        </footer>
      </aside>
    </>
  );
}
