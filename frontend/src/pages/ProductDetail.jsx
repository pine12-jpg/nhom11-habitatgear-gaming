import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api/client";
import { formatVND, formatDate } from "../utils/format";
import StarRating from "../components/StarRating";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import ImageMagnifier from "../components/ImageMagnifier";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/** US08 — Trang chi tiết sản phẩm + US20 đánh giá/bình luận */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { ids, toggle, isFull } = useCompare();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get(`/products/${id}`).then(({ data }) => setProduct(data)).catch(() => setProduct(false));
  }

  useEffect(() => {
    setProduct(null);
    setQty(1);
    load();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (product === null) return <div className="page container center muted">Đang tải sản phẩm…</div>;
  if (product === false) return <div className="page container center muted">Không tìm thấy sản phẩm.</div>;

  const outOfStock = product.stock <= 0;
  const checked = ids.includes(product.id);

  function handleAdd() {
    addItem(product, qty);
    toast.success(`Đã thêm ${qty} "${product.name}" vào giỏ hàng.`);
  }

  function handleBuyNow() {
    addItem(product, qty);
    navigate("/gio-hang");
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewError("");
    if (!isAuthenticated) {
      setReviewError("Vui lòng đăng nhập để đánh giá sản phẩm.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, reviewForm);
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
      setReviewForm({ rating: 5, comment: "" });
      load();
    } catch (err) {
      setReviewError(errMsg(err, "Không thể gửi đánh giá."));
    } finally {
      setSubmitting(false);
    }
  }

  const specs = [
    ["Hãng", product.brandName],
    ["Ngành hàng", product.categoryName],
    ["CPU", product.cpu],
    ["Card đồ họa (GPU)", product.gpu],
    ["RAM", product.ram],
    ["Ổ cứng", product.storage],
    ["Màn hình", product.screen],
  ].filter(([, v]) => v && v !== "—");

  return (
    <div className="page container">
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link> / <Link to={`/san-pham?category=${product.categorySlug}`}>{product.categoryName}</Link> / {product.name}
      </div>

      <div className="detail-layout">
        <div>
          <ImageMagnifier product={product} />
          <label className="filter-option mt-16">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                if (!checked && isFull) return toast.info("Bạn chỉ có thể so sánh tối đa 3 sản phẩm.");
                toggle(product.id);
              }}
            />
            Thêm vào danh sách so sánh
          </label>
        </div>

        <div>
          <div className="product-brand">{product.brandName}</div>
          <h1 style={{ fontSize: 22 }}>{product.name}</h1>
          {product.reviewCount > 0 ? (
            <StarRating value={product.avgRating} count={product.reviewCount} size={15} />
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>Chưa có đánh giá</span>
          )}

          <div className="product-price-row mt-16" style={{ fontSize: 20 }}>
            <span className="price-final" style={{ fontSize: 26 }}>{formatVND(product.finalPrice)}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="price-original">{formatVND(product.price)}</span>
                <span className="discount-badge" style={{ position: "static" }}>-{product.discountPercent}%</span>
              </>
            )}
          </div>

          {outOfStock ? (
            <p className="stock-out mt-8">Sản phẩm tạm hết hàng</p>
          ) : (
            <p className="muted mt-8">Còn {product.stock} sản phẩm • Giao toàn quốc</p>
          )}

          <table className="spec-table">
            <tbody>
              {specs.slice(0, 5).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>

          {!outOfStock && (
            <>
              <div className="flex items-center gap-12 mt-16">
                <div className="qty-stepper">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <input value={qty} readOnly />
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
                </div>
                <button className="btn btn-outline" onClick={handleAdd}>Thêm vào giỏ</button>
                <button className="btn btn-primary" onClick={handleBuyNow}>Mua ngay</button>
              </div>
              {product.finalPrice * qty >= 3000000 && (
                <div className="installment-box">
                  💳 Có thể trả góp 0% lãi suất từ {formatVND(Math.ceil((product.finalPrice * qty) / 12))}/tháng (12 tháng) khi thanh toán.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="tabs mt-24">
        <button className={tab === "desc" ? "active" : ""} onClick={() => setTab("desc")}>Mô tả sản phẩm</button>
        <button className={tab === "spec" ? "active" : ""} onClick={() => setTab("spec")}>Thông số kỹ thuật</button>
        <button className={tab === "review" ? "active" : ""} onClick={() => setTab("review")}>Đánh giá ({product.reviewCount})</button>
      </div>

      {tab === "desc" && <div className="card">{product.description || "Đang cập nhật mô tả."}</div>}

      {tab === "spec" && (
        <table className="spec-table card">
          <tbody>
            {specs.map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "review" && (
        <div className="card">
          <h3 style={{ fontSize: 15 }}>Viết đánh giá của bạn</h3>
          <p className="muted" style={{ fontSize: 12.5 }}>Bạn cần mua sản phẩm này trước khi có thể đánh giá.</p>
          <form onSubmit={submitReview}>
            <div className="star-input mt-8">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= reviewForm.rating ? "filled" : ""} onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>★</span>
              ))}
            </div>
            <div className="form-group mt-8">
              <textarea
                className="form-control"
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm…"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              />
            </div>
            {reviewError && <div className="alert alert-error">{reviewError}</div>}
            <button className="btn btn-primary" disabled={submitting}>{submitting ? "Đang gửi…" : "Gửi đánh giá"}</button>
          </form>

          <div className="mt-24">
            {product.reviews.length === 0 && <p className="muted">Chưa có đánh giá nào cho sản phẩm này.</p>}
            {product.reviews.map((r) => (
              <div className="review-item" key={r.id}>
                <div className="flex justify-between">
                  <span className="who">{r.userName}</span>
                  <span className="when">{formatDate(r.createdAt)}</span>
                </div>
                <StarRating value={r.rating} />
                <p className="mt-8">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.related.length > 0 && (
        <>
          <section className="section-title mt-24">
            <h2>Sản phẩm liên quan</h2>
          </section>
          <div className="product-grid">
            {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
