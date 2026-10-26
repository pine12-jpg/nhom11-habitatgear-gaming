import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import AdminPagination, { usePagination } from "../../components/AdminPagination";
import api, { errMsg } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { formatVND } from "../../utils/format";
import ProductImage from "../../components/ProductImage";

const EMPTY = { name: "", brand: "", category: "", price: "", salePrice: "", image: "", cpu: "", gpu: "", ram: "", storage: "", screen: "", description: "", stock: 0, featured: false };

/** US31 — Thêm/sửa/xóa sản phẩm; US34 — Quản lý tồn kho */
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null); // {mode: 'new'|'edit', data}
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function load() {
    api.get("/admin/products").then(({ data }) => setProducts(data));
    api.get("/admin/brands").then(({ data }) => setBrands(data));
    api.get("/categories").then(({ data }) => setCategories(data));
  }
  useEffect(load, []);

  function openNew() {
    setForm(EMPTY);
    setError("");
    setModal({ mode: "new" });
  }
  function openEdit(p) {
    setForm({ ...p, salePrice: p.salePrice || "" });
    setError("");
    setModal({ mode: "edit", id: p.id });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (modal.mode === "new") {
        await api.post("/admin/products", form);
        toast.success("Đã thêm sản phẩm mới.");
      } else {
        await api.put(`/admin/products/${modal.id}`, form);
        toast.success("Đã cập nhật sản phẩm.");
      }
      setModal(null);
      load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success("Đã xóa sản phẩm.");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function quickStock(p) {
    const val = window.prompt(`Cập nhật tồn kho cho "${p.name}"`, p.stock);
    if (val === null) return;
    const stock = parseInt(val, 10);
    if (Number.isNaN(stock) || stock < 0) return toast.error("Số lượng không hợp lệ.");
    try {
      await api.put(`/admin/products/${p.id}/stock`, { stock });
      toast.success("Đã cập nhật tồn kho.");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const pager = usePagination(filtered, q);

  return (
    <AdminLayout title="Quản lý sản phẩm">
      <div className="toolbar-row">
        <input className="search-mini" placeholder="Tìm sản phẩm…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={openNew}>+ Thêm sản phẩm</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th><th>Hãng</th><th>Ngành hàng</th><th>Giá</th><th>Tồn kho</th><th>Nổi bật</th><th></th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((p) => (
                <tr key={p.id}>
                  <td className="flex items-center gap-8">
                    <span className="mini-thumb"><ProductImage product={p} /></span>
                    {p.name}
                  </td>
                  <td>{p.brandName}</td>
                  <td>{p.categoryName}</td>
                  <td>
                    {formatVND(p.salePrice || p.price)}
                    {p.salePrice && <div className="muted" style={{ textDecoration: "line-through", fontSize: 11.5 }}>{formatVND(p.price)}</div>}
                  </td>
                  <td>
                    <button className="btn-link" onClick={() => quickStock(p)}>{p.stock} <span style={{ fontSize: 11 }}>✎</span></button>
                  </td>
                  <td>{p.featured ? "⭐" : "—"}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Sửa</button>{" "}
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination pager={pager} />
      </div>

      {modal && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box wide">
            <div className="modal-head">
              <h3>{modal.mode === "new" ? "Thêm sản phẩm" : "Sửa sản phẩm"}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-group">
                <label>Tên sản phẩm</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Hãng</label>
                  <select className="form-control" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} required>
                    <option value="">— Chọn hãng —</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ngành hàng</label>
                  <select className="form-control" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
                    <option value="">— Chọn ngành hàng —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Đường dẫn ảnh sản phẩm (tùy chọn)</label>
                <input
                  className="form-control"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="/products/ten-file.jpg"
                />
                <p className="form-hint">
                  Lưu file ảnh vào thư mục <code>frontend/public/products/</code> rồi nhập đường dẫn dạng{" "}
                  <code>/products/ten-file.jpg</code>. Để trống sẽ tự dùng hình minh họa mặc định.
                </p>
                {form.image && (
                  <div className="mini-thumb mt-8" style={{ width: 60, height: 60 }}>
                    <img src={form.image} alt="Xem trước" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Giá gốc (đ)</label>
                  <input type="number" className="form-control" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Giá khuyến mãi (đ, tùy chọn)</label>
                  <input type="number" className="form-control" value={form.salePrice} onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>CPU</label><input className="form-control" value={form.cpu} onChange={(e) => setForm((f) => ({ ...f, cpu: e.target.value }))} placeholder="—" /></div>
                <div className="form-group"><label>GPU</label><input className="form-control" value={form.gpu} onChange={(e) => setForm((f) => ({ ...f, gpu: e.target.value }))} placeholder="—" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>RAM</label><input className="form-control" value={form.ram} onChange={(e) => setForm((f) => ({ ...f, ram: e.target.value }))} placeholder="—" /></div>
                <div className="form-group"><label>Ổ cứng</label><input className="form-control" value={form.storage} onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))} placeholder="—" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Màn hình</label><input className="form-control" value={form.screen} onChange={(e) => setForm((f) => ({ ...f, screen: e.target.value }))} placeholder="—" /></div>
                <div className="form-group"><label>Tồn kho</label><input type="number" className="form-control" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} required /></div>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea className="form-control" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <label className="filter-option">
                <input type="checkbox" checked={!!form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                Hiển thị ở mục "Sản phẩm nổi bật"
              </label>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="flex gap-8 mt-16">
                <button className="btn btn-primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu sản phẩm"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
