import { useRef, useState } from "react";
import ProductImage from "./ProductImage";

/**
 * ImageMagnifier — ảnh sản phẩm ở trang chi tiết có hiệu ứng KÍNH LÚP:
 * rê chuột vào ảnh, một kính lúp tròn (có tay cầm) đi theo con trỏ và phóng to đúng vùng đang trỏ.
 *
 * Cách làm: kính lúp chứa một bản sao của ảnh được phóng to `zoom` lần, dịch chuyển sao cho
 * điểm đang trỏ nằm đúng tâm kính. Dùng cho cả ảnh thật lẫn hình minh họa SVG.
 * Màn hình cảm ứng (ngón tay) không bật kính lúp để không cản việc cuộn trang.
 */
export default function ImageMagnifier({ product, zoom = 2.6, lensSize = 170 }) {
  const hostRef = useRef(null);
  const [pos, setPos] = useState({ on: false, x: 0, y: 0, w: 0, h: 0 });

  function onMove(e) {
    if (e.pointerType === "touch") return;
    const r = hostRef.current.getBoundingClientRect();
    setPos({ on: true, x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
  }
  function onLeave() {
    setPos((p) => ({ ...p, on: false }));
  }

  const half = lensSize / 2;

  return (
    <div className="magnifier" ref={hostRef} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="detail-thumb"><ProductImage product={product} /></div>
      <span className={`magnifier-hint${pos.on ? " hide" : ""}`}>🔍 Rê chuột vào ảnh để phóng to</span>

      {pos.w > 0 && (
        <div
          className={`lens${pos.on ? " on" : ""}`}
          aria-hidden="true"
          style={{ width: lensSize, height: lensSize, transform: `translate(${pos.x - half}px, ${pos.y - half}px)` }}
        >
          <span className="lens-handle" />
          <div className="lens-glass">
            <div
              className="lens-stage"
              style={{ width: pos.w * zoom, height: pos.h * zoom, transform: `translate(${half - pos.x * zoom}px, ${half - pos.y * zoom}px)` }}
            >
              <div className="detail-thumb" style={{ width: "100%", height: "100%", borderRadius: 0 }}>
                <ProductImage product={product} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
