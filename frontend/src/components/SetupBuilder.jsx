import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { formatVND } from "../utils/format";
import "../styles/setupFab.css";

/** Các vị trí trên bàn setup — slug trùng với danh mục trong cửa hàng */
export const SETUP_SLOTS = [
  { slug: "man-hinh", label: "Màn hình", icon: "🖵" },
  { slug: "ban-phim", label: "Bàn phím", icon: "⌨️" },
  { slug: "chuot", label: "Chuột", icon: "🖱️" },
  { slug: "tai-nghe", label: "Tai nghe", icon: "🎧" },
  { slug: "ghe-ban", label: "Ghế / Bàn", icon: "🪑" },
];
const SLOTS = SETUP_SLOTS;

/** Khóa lưu các món đã chọn (chỉ lưu id) — nút tròn cũng đọc khóa này để hiện số món */
export const SETUP_STORAGE_KEY = "habitat_setup_picked";

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

function loadPickedIds() {
  try {
    return JSON.parse(sessionStorage.getItem(SETUP_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * SetupBuilder — khách tự "dựng góc setup" bằng cách chọn màn hình, bàn phím, chuột, tai nghe, ghế;
 * bàn setup hiện ngay các món đã chọn, tổng tiền chạy theo, và thêm cả bộ vào giỏ bằng 1 nút.
 * Được hiển thị ở trang /dung-setup (mở từ nút tròn nổi bên cạnh web).
 */
export default function SetupBuilder() {
  const { addItem } = useCart();
  const toast = useToast();
  const [catalog, setCatalog] = useState(null);
  const [pickedIds, setPickedIds] = useState(loadPickedIds); // { slug: productId }
  const [active, setActive] = useState(SLOTS[0].slug);

  useEffect(() => {
    Promise.all(
      SLOTS.map((s) =>
        api
          .get("/products", { params: { category: s.slug, limit: 60 } })
          .then(({ data }) => [s.slug, data.items])
          .catch(() => [s.slug, []])
      )
    ).then((pairs) => setCatalog(Object.fromEntries(pairs)));
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(pickedIds));
    } catch {
      /* bỏ qua nếu trình duyệt chặn storage */
    }
  }, [pickedIds]);

  // Món đã chọn (đối chiếu với danh mục để lấy giá mới nhất)
  const picked = {};
  SLOTS.forEach((s) => {
    const id = pickedIds[s.slug];
    const p = id && catalog?.[s.slug]?.find((x) => x.id === id);
    if (p) picked[s.slug] = p;
  });
  const chosen = SLOTS.map((s) => picked[s.slug]).filter(Boolean);
  const total = chosen.reduce((sum, p) => sum + p.finalPrice, 0);
  const shownTotal = useCountUp(total);

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
    <section className="setup-builder">
      <div className="setup-head">
        <div>
          <span className="setup-eyebrow">✨ Tự tay dựng</span>
          <h2>Góc setup mơ ước của bạn</h2>
          <p>Chọn từng món, xem bàn setup thành hình ngay lập tức và thêm cả bộ vào giỏ chỉ với một cú bấm.</p>
        </div>
        <div className="setup-head-actions">
          <button type="button" className="btn btn-outline" onClick={randomize} disabled={!catalog}>🎲 Gợi ý ngẫu nhiên</button>
          <button type="button" className="btn-link setup-clear" onClick={() => setPickedIds({})} disabled={!chosen.length}>Xóa hết</button>
        </div>
      </div>

      <div className="setup-body">
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

        <div className="setup-panel">
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
            {!catalog && <div className="muted" style={{ padding: 20 }}>Đang tải sản phẩm…</div>}
            {catalog && options.length === 0 && <div className="muted" style={{ padding: 20 }}>Chưa có sản phẩm trong mục này.</div>}
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

          <div className="setup-total">
            <div>
              <div className="muted" style={{ fontSize: 12.5 }}>Đã chọn {chosen.length}/{SLOTS.length} món</div>
              <div className="setup-price">{formatVND(shownTotal)}</div>
            </div>
            <button type="button" className="btn btn-primary" onClick={addAll} disabled={!chosen.length}>
              🛒 Thêm cả bộ vào giỏ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
