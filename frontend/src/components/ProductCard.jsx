import { Link } from "react-router-dom";
import { formatVND } from "../utils/format";
import StarRating from "./StarRating";
import ProductImage from "./ProductImage";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { useToast } from "../context/ToastContext";

/* ====== CSS làm các thẻ sản phẩm bằng nhau (tự chèn vào trang một lần, không cần sửa global.css) ====== */
const CARD_CSS = `
.product-card .product-thumb { overflow: hidden; flex: none; }
.product-card .product-thumb img.product-photo { position: absolute; inset: 0; width: 100%; height: 100%; padding: 10px; box-sizing: border-box; object-fit: contain; }
.product-card .product-specs-mini { line-height: 1.35; min-height: 31px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`;
if (typeof document !== "undefined" && !document.getElementById("product-card-equal-css")) {
  const el = document.createElement("style");
  el.id = "product-card-equal-css";
  el.textContent = CARD_CSS;
  document.head.appendChild(el);
}

/* ====== Thông số ngắn dưới tên sản phẩm ======
 * Ưu tiên: CPU • GPU • RAM  ->  màn hình  ->  bảng SPECS (khớp theo tên)  ->  vài chữ đầu của mô tả.
 * Thêm sản phẩm mới: thêm 1 dòng vào SPECS ("Tên sản phẩm": "thông số • thông số"). */
const SPECS = {
  "Logitech G Pro X Keyboard": "TKL • Hotswap • GX Blue Clicky",
  "Razer BlackWidow V4": "Full-size • Razer Green • RGB Chroma",
  "AKKO 5075B Plus": "75% • Gasket mount • Cream Yellow",
  "Corsair K70 RGB Pro": "Full-size • Cherry MX Red • Khung nhôm",
  "Logitech G Pro X Superlight 2": "Không dây • 60g • 32000 DPI",
  "Razer DeathAdder V3": "Có dây • Công thái học • 30K DPI",
  "SteelSeries Aerox 5 Wireless": "Không dây • Tổ ong • 9 nút",
  "Corsair M75 Air Wireless": "Không dây • 60g • Pin 100 giờ",
  "SteelSeries Arctis Nova 5": "Không dây 2.4GHz + BT • Âm thanh vòm 360°",
  "HyperX Cloud III": "Có dây • Driver 53mm • Đệm tai êm",
  "Razer BlackShark V2 X": "Có dây • 240g • Âm thanh định vị",
  "Ghế Gaming DXRacer Air Series": "Lưới thoáng khí • Tựa lưng ngả • Kê chân",
  "Bàn Gaming E-Dra Motorized EGD003": "Nâng hạ điện • Khung thép • Tải 100kg",
  "VGA Gigabyte RTX 4070 Super WINDFORCE": "12GB GDDR6X • 3 quạt WINDFORCE",
  "RAM Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz": "2x16GB • DDR5 • 6000MHz",
};

const ok = (s) => s && s !== "—";

/** Trả về chuỗi thông số ngắn (luôn có nội dung nếu sản phẩm có tên/mô tả) */
function getMiniSpecs(product) {
  const hw = [product.cpu, product.gpu, product.ram].filter(ok);
  if (hw.length) return hw.slice(0, 2).join(" • ");
  if (ok(product.screen)) return product.screen;
  if (SPECS[product.name]) return SPECS[product.name];
  const desc = (product.description || "").split(/[,.]/)[0].trim();
  return desc.length > 52 ? desc.slice(0, 50).trim() + "…" : desc;
}

/** US06/US07 — thẻ sản phẩm dùng lại ở trang chủ, danh sách, liên quan, so sánh */
export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { ids, toggle, isFull } = useCompare();
  const toast = useToast();
  const outOfStock = product.stock <= 0;
  const checked = ids.includes(product.id);

  function handleAddCart(e) {
    e.preventDefault();
    if (outOfStock) return;
    addItem(product, 1);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng.`);
  }

  function handleToggleCompare(e) {
    e.preventDefault();
    if (!checked && isFull) {
      toast.info("Bạn chỉ có thể so sánh tối đa 3 sản phẩm.");
      return;
    }
    toggle(product.id);
  }

  return (
    <Link to={`/san-pham/${product.id}`} className="product-card">
      <div className="product-thumb">
        {product.discountPercent > 0 && <span className="discount-badge">-{product.discountPercent}%</span>}
        <label className="compare-check" onClick={handleToggleCompare}>
          <input type="checkbox" checked={checked} readOnly /> So sánh
        </label>
        <ProductImage product={product} />
      </div>
      <div className="product-info">
        <div className="product-brand">{product.brandName}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-specs-mini">
          {getMiniSpecs(product)}
        </div>
        {product.reviewCount > 0 && <StarRating value={product.avgRating} count={product.reviewCount} />}
        <div className="product-price-row">
          <span className="price-final">{formatVND(product.finalPrice)}</span>
          {product.discountPercent > 0 && <span className="price-original">{formatVND(product.price)}</span>}
        </div>
        {outOfStock ? (
          <span className="stock-out">Tạm hết hàng</span>
        ) : product.stock <= 5 ? (
          <span className="stock-warning">Chỉ còn {product.stock} sản phẩm</span>
        ) : null}
        <button className="add-cart-btn" onClick={handleAddCart} disabled={outOfStock}>
          {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </Link>
  );
}
