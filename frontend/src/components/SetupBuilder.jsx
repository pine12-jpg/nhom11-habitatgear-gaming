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

/* ====== GIAO DIỆN PRO cho trang Dựng setup (tự chèn vào trang một lần, đè lên setupFab.css) ====== */
const PRO_CSS = `
.setup-builder { background: radial-gradient(90% 70% at 0% 0%, #1b2030 0%, #0b0e14 62%); border: 1px solid rgba(255,255,255,.06); border-radius: 20px; padding: 32px; box-shadow: 0 30px 70px rgba(11,14,20,.35); }
.setup-builder .setup-eyebrow { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; background: rgba(226,18,33,.14); border: 1px solid rgba(226,18,33,.35); color: #ff7a84; font-size: 11.5px; letter-spacing: .08em; }
.setup-builder .setup-head h2 { font-size: 30px; letter-spacing: -.02em; margin: 10px 0 8px; }
.setup-builder .setup-head p { color: #9aa3b2; font-size: 14.5px; line-height: 1.55; max-width: 520px; }
.setup-builder .setup-head .btn-outline { border-radius: 10px; padding: 10px 18px; font-weight: 700; border-color: rgba(255,255,255,.22); background: rgba(255,255,255,.04); }
.setup-builder .setup-head .btn-outline:hover:not(:disabled) { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.5); }
.setup-builder .setup-body { grid-template-columns: 1.1fr 1fr; gap: 24px; }

/* ----- Sân khấu (bàn setup) ----- */
.setup-builder .setup-stage { min-height: 440px; border-radius: 16px; border: 1px solid rgba(255,255,255,.08);
  background:
    linear-gradient(180deg, rgba(11,14,20,0) 55%, rgba(226,18,33,.07) 100%),
    linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 100% 36px,
    linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 36px 100%,
    #0e121b; }
.setup-builder .stage-glow { top: 18%; height: 50%; width: 62%; background: radial-gradient(closest-side, rgba(226,18,33,.3), transparent); }
.setup-builder .stage-desk { left: 3%; right: 3%; bottom: 6%; height: 11%; border-radius: 12px 12px 8px 8px;
  background: linear-gradient(180deg, #343c50 0%, #1d2230 100%); box-shadow: 0 -1px 0 rgba(255,255,255,.12) inset, 0 22px 36px rgba(0,0,0,.55); }
.setup-builder .stage-desk::after { content: ""; position: absolute; left: 6%; right: 6%; bottom: -16px; height: 14px; border-radius: 0 0 8px 8px; background: linear-gradient(180deg, #151a26, transparent); }
.setup-builder .spot-man-hinh { left: 27%; top: 6%; width: 46%; height: 43%; }
.setup-builder .spot-ban-phim { left: 24%; top: 59%; width: 36%; height: 18%; }
.setup-builder .spot-chuot { left: 63%; top: 59%; width: 12%; height: 18%; }
.setup-builder .spot-tai-nghe { left: 3%; top: 30%; width: 19%; height: 30%; }
.setup-builder .spot-ghe-ban { right: 3%; top: 14%; width: 21%; height: 58%; }
.setup-builder .spot-empty { gap: 6px; border: 1.5px dashed rgba(255,255,255,.2); border-radius: 12px; background: rgba(255,255,255,.02); color: #7f8899; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.setup-builder .spot-icon { font-size: 22px; opacity: .85; }
.setup-builder .spot:hover .spot-empty, .setup-builder .spot.current .spot-empty { border-color: #e21221; background: rgba(226,18,33,.1); color: #fff; }
.setup-builder .spot.current .spot-empty { box-shadow: 0 0 0 4px rgba(226,18,33,.12); }
.setup-builder .spot-item { position: relative; display: flex; flex-direction: column; padding: 6px 6px 0; background: #fff; border-radius: 12px; box-shadow: 0 14px 28px rgba(0,0,0,.5); overflow: hidden; }
.setup-builder .spot-item .spot-img { flex: 1; min-height: 0; display: block; }
.setup-builder .spot-img { position: relative; }
.setup-builder .spot-img img, .setup-builder .spot-img svg { position: absolute; inset: 0; width: 100%; height: 100%; padding: 4px; box-sizing: border-box; object-fit: contain; }
.setup-builder .spot-tag { display: block; flex: none; margin: 0 -6px; padding: 4px 6px; background: #0b0e14; color: #fff; font-size: 10.5px; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.setup-builder .spot.current .spot-item { outline: 2px solid #e21221; outline-offset: 2px; }

/* ----- Bảng chọn ----- */
.setup-builder .setup-panel { background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 16px; }
.setup-builder .setup-tabs { gap: 4px; padding: 4px; margin-bottom: 14px; background: rgba(0,0,0,.28); border-radius: 12px; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
.setup-builder .setup-tabs::-webkit-scrollbar { display: none; }
.setup-builder .setup-tab { flex: 1 0 auto; border-radius: 9px; padding: 9px 12px; font-size: 12.5px; white-space: nowrap; background: transparent; color: #aab1be; }
.setup-builder .setup-tab:hover { background: rgba(255,255,255,.07); color: #fff; }
.setup-builder .setup-tab.active { background: #e21221; color: #fff; box-shadow: 0 6px 16px rgba(226,18,33,.4); }
.setup-builder .setup-options { grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 12px; max-height: 340px; padding: 2px 6px 4px 2px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.25) transparent; }
.setup-builder .setup-options::-webkit-scrollbar { width: 6px; }
.setup-builder .setup-options::-webkit-scrollbar-thumb { background: rgba(255,255,255,.22); border-radius: 6px; }
.setup-builder .setup-options::-webkit-scrollbar-track { background: transparent; }
.setup-builder .setup-option { gap: 4px; padding: 8px 8px 10px; border-radius: 12px; border: 1.5px solid transparent; min-height: 214px; }
.setup-builder .setup-option:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(0,0,0,.4); }
.setup-builder .setup-option.selected { border-color: #e21221; box-shadow: 0 0 0 3px rgba(226,18,33,.25); }
.setup-builder .opt-thumb { position: relative; height: auto; aspect-ratio: 4 / 3; margin-bottom: 4px; border-radius: 8px; overflow: hidden; padding: 0; }
.setup-builder .opt-thumb img, .setup-builder .opt-thumb svg { position: absolute; inset: 0; width: 100%; height: 100%; padding: 6px; box-sizing: border-box; object-fit: contain; }
.setup-builder .opt-brand { font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #8a92a1; }
.setup-builder .opt-name { font-size: 12.5px; min-height: 32px; }
.setup-builder .opt-spec { font-size: 11px; line-height: 1.35; color: #6b7384; min-height: 30px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.setup-builder .opt-price { margin-top: auto; font-size: 14px; }
.setup-builder .opt-check { top: 8px; right: 8px; }

/* ----- Tổng tiền ----- */
.setup-builder .setup-progress { height: 5px; margin-top: 14px; border-radius: 99px; background: rgba(255,255,255,.1); overflow: hidden; }
.setup-builder .setup-progress > i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #e21221, #ff5a64); transition: width .4s cubic-bezier(.22,1,.36,1); }
.setup-builder .setup-total { margin-top: 14px; padding-top: 14px; }
.setup-builder .setup-price { font-size: 28px; }
.setup-builder .setup-total .btn-primary { padding: 13px 22px; border-radius: 12px; font-weight: 800; font-size: 14.5px; box-shadow: 0 10px 24px rgba(226,18,33,.4); }
.setup-builder .setup-total .btn-primary:disabled { box-shadow: none; }
@media (max-width: 920px) { .setup-builder { padding: 18px; } .setup-builder .setup-stage { min-height: 380px; } }
`;
if (typeof document !== "undefined" && !document.getElementById("setup-pro-css")) {
  const el = document.createElement("style");
  el.id = "setup-pro-css";
  el.textContent = PRO_CSS;
  document.head.appendChild(el);
}

/** Dòng thông số ngắn cho thẻ chọn món (màn hình -> mô tả rút gọn) */
function optSpec(p) {
  if (p.screen && p.screen !== "—") return p.screen;
  const d = (p.description || "").split(/[,.]/)[0].trim();
  return d.length > 46 ? d.slice(0, 44).trim() + "…" : d;
}

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
                    <span className="spot-img"><ProductImage product={p} /></span>
                    <span className="spot-tag">{p.name}</span>
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
                  <span className="opt-brand">{p.brandName}</span>
                  <span className="opt-name">{p.name}</span>
                  <span className="opt-spec">{optSpec(p)}</span>
                  <span className="opt-price">{out ? "Hết hàng" : formatVND(p.finalPrice)}</span>
                  {selected && <span className="opt-check">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="setup-progress" aria-hidden="true"><i style={{ width: `${(chosen.length / SLOTS.length) * 100}%` }} /></div>

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
