import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api, { errMsg } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { NEWS_COVERS } from "../../components/NewsCover";

const EMPTY = { title: "", summary: "", content: "", coverImage: "/news/news-default.svg" };

/** US29 — Admin đăng, sửa, xóa bài viết trên mục Tin tức - Review */
export default function AdminNews() {
  const [posts, setPosts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function load() {
    api.get("/news").then(({ data }) => setPosts(data));
  }
  useEffect(load, []);

  function openNew() { setForm(EMPTY); setError(""); setModal({ mode: "new" }); }
  function openEdit(p) { setForm(p); setError(""); setModal({ mode: "edit", id: p.id }); }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (modal.mode === "new") { await api.post("/admin/news", form); toast.success("Đã đăng bài viết."); }
      else { await api.put(`/admin/news/${modal.id}`, form); toast.success("Đã cập nhật bài viết."); }
      setModal(null);
      load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Xóa bài viết "${p.title}"?`)) return;
    try {
      await api.delete(`/admin/news/${p.id}`);
      toast.success("Đã xóa bài viết.");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  return (
    <AdminLayout title="Quản lý Tin tức - Review">
      <div className="toolbar-row">
        <span className="muted">{posts.length} bài viết</span>
        <button className="btn btn-primary" onClick={openNew}>+ Viết bài mới</button>
      </div>
      <div className="card">
        <table className="data-table">
          <thead><tr><th></th><th>Tiêu đề</th><th>Tác giả</th><th>Ngày đăng</th><th></th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td><img src={p.coverImage || "/news/news-default.svg"} alt="" style={{ width: 72, height: 27, objectFit: "cover", borderRadius: 4, display: "block" }} /></td>
                <td>{p.title}</td>
                <td>{p.author}</td>
                <td>{p.createdAt}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Sửa</button>{" "}
                  <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box wide">
            <div className="modal-head">
              <h3>{modal.mode === "new" ? "Viết bài mới" : "Sửa bài viết"}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-group">
                <label>Ảnh bìa</label>
                <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
                  {NEWS_COVERS.map((c) => (
                    <button type="button" key={c.src} title={c.label} onClick={() => setForm((f) => ({ ...f, coverImage: c.src }))}
                      style={{ padding: 0, border: form.coverImage === c.src ? "3px solid var(--red, #ef233c)" : "3px solid transparent", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "none", width: 120 }}>
                      <img src={c.src} alt={c.label} style={{ width: "100%", display: "block" }} />
                    </button>
                  ))}
                </div>
                <input className="form-control mt-8" placeholder="hoặc dán link ảnh (https://...)" value={form.coverImage || ""} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Tiêu đề</label>
                <input className="form-control" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Tóm tắt (tùy chọn)</label>
                <input className="form-control" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Nội dung</label>
                <textarea className="form-control" rows={6} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="flex gap-8">
                <button className="btn btn-primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu bài viết"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
