import { useEffect, useRef, useState } from "react";
import ProductImage from "./ProductImage";

const ZOOM_MIN = 1.5;
const ZOOM_MAX = 6;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

/**
 * ImageMagnifier — ảnh sản phẩm ở trang chi tiết có KÍNH LÚP NHỎ HÌNH VUÔNG:
 *  - Rê chuột vào ảnh: khung vuông đi theo con trỏ, phóng to vùng ảnh nằm bên dưới khung.
 *  - Lăn chuột lên: phóng to thêm; lăn xuống: thu nhỏ lại (từ 1,5× đến 6×). Mức phóng được nhớ lại.
 *  - Giữ Ctrl khi lăn thì vẫn là zoom của trình duyệt như bình thường.
 *
 * Cách làm: khung chứa một bản sao của ảnh được phóng to `zoom` lần, dịch chuyển sao cho
 * tâm khung luôn khớp với vùng ảnh nằm dưới nó. Khung không chạy ra ngoài mép ảnh.
 * Màn hình cảm ứng (ngón tay) không bật kính lúp để không cản việc cuộn trang.
 */
export default function ImageMagnifier({ product, initialZoom = 2.5, lensSize = 110 }) {
  const hostRef = useRef(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [pos, setPos] = useState({ on: false, x: 0, y: 0, w: 0, h: 0 });

  // Con lăn: gắn thủ công (không passive) để chặn trang cuộn khi đang chỉnh độ phóng
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (e.ctrlKey) return; // Ctrl + lăn = zoom của trình duyệt, để nguyên
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY; // Firefox có thể báo theo dòng
      setZoom((z) => clamp(z * Math.exp(-dy * 0.0015), ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onMove(e) {
    if (e.pointerType === "touch") return;
    const r = hostRef.current.getBoundingClientRect();
    const half = lensSize / 2;
    // Giữ cả khung vuông nằm trong ảnh (không tràn ra ngoài mép)
    const x = clamp(e.clientX - r.left, half, Math.max(half, r.width - half));
    const y = clamp(e.clientY - r.top, half, Math.max(half, r.height - half));
    setPos({ on: true, x, y, w: r.width, h: r.height });
  }
  function onLeave() {
    setPos((p) => ({ ...p, on: false }));
  }

  const half = lensSize / 2;

  return (
    <div className="magnifier" ref={hostRef} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="detail-thumb"><ProductImage product={product} /></div>

      {pos.w > 0 && (
        <div
          className={`lens${pos.on ? " on" : ""}`}
          aria-hidden="true"
          style={{ width: lensSize, height: lensSize, transform: `translate(${pos.x - half}px, ${pos.y - half}px)` }}
        >
          <div className="lens-glass">
            <div
              className="lens-stage"
              style={{ width: pos.w * zoom, height: pos.h * zoom, transform: `translate(${half - pos.x * zoom}px, ${half - pos.y * zoom}px)` }}
            >
              <div className="detail-thumb" style={{ width: "100%", height: "100%", borderRadius: 0 }}>
                <ProductImage product={product} />
              </div>
            </div>
            <span className="lens-zoom">{zoom.toFixed(1)}×</span>
          </div>
        </div>
      )}
    </div>
  );
}
