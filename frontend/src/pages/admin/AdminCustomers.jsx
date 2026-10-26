import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import AdminPagination, { usePagination } from "../../components/AdminPagination";
import api, { errMsg } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { formatDate } from "../../utils/format";

/** US36 — Quản lý danh sách tài khoản khách hàng, có thể khóa tài khoản vi phạm */
export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const toast = useToast();
  const [lockTarget, setLockTarget] = useState(null); // tài khoản đang chọn để khóa
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");

  function load() {
    api.get("/admin/users").then(({ data }) => setUsers(data));
  }
  useEffect(load, []);

  async function toggleLock(u) {
    if (u.locked) {
      // Mở khóa ngay
      if (!window.confirm(`Mở khóa tài khoản "${u.name}"?`)) return;
      try {
        await api.put(`/admin/users/${u.id}/lock`, { locked: false });
        toast.success("Đã mở khóa tài khoản.");
        load();
      } catch (err) {
        toast.error(errMsg(err));
      }
    } else {
      // Mở bảng nhập số ngày khóa + lý do
      setDays("");
      setReason("");
      setLockTarget(u);
    }
  }

  async function confirmLock(e) {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${lockTarget.id}/lock`, { locked: true, days: Number(days) || 0, reason });
      toast.success("Đã khóa tài khoản.");
      setLockTarget(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(q.toLowerCase()) || (u.email || "").includes(q) || (u.phone || "").includes(q)
  );

  const pager = usePagination(filtered, q);

  return (
    <AdminLayout title="Quản lý tài khoản khách hàng">
      <div className="toolbar-row">
        <input className="search-mini" placeholder="Tìm theo tên, email, SĐT…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted">{filtered.length} tài khoản</span>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Đơn hàng</th><th>HSSV</th><th>Ngày tạo</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {pager.pageItems.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email || "—"}</td>
                  <td>{u.phone || "—"}</td>
                  <td>{u.role === "admin" ? "Quản trị" : "Khách hàng"}</td>
                  <td>{u.orderCount}</td>
                  <td>{u.isHssv ? "✅" : "—"}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{u.locked ? <><span className="badge badge-cancelled">Đã khóa</span><div className="muted" style={{ fontSize: 12 }}>{u.lockedUntil ? `đến ${formatDate(u.lockedUntil)}` : "vĩnh viễn"}</div></> : <span className="badge badge-delivered">Hoạt động</span>}</td>
                  <td>
                    {u.role !== "admin" && (
                      <button className={`btn btn-sm ${u.locked ? "btn-outline" : "btn-danger"}`} onClick={() => toggleLock(u)}>
                        {u.locked ? "Mở khóa" : "Khóa"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination pager={pager} />
      </div>

      {lockTarget && (
        <div className="modal-overlay" onClick={() => setLockTarget(null)}>
          <form className="modal-box" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()} onSubmit={confirmLock}>
            <div className="modal-head">
              <h3>Khóa tài khoản: {lockTarget.name}</h3>
              <button type="button" className="modal-close" onClick={() => setLockTarget(null)}>×</button>
            </div>
            <div className="form-group">
              <label>Số ngày khóa</label>
              <input type="number" min="0" className="form-control" value={days} onChange={(e) => setDays(e.target.value)} placeholder="VD: 7 (để trống hoặc 0 = khóa vĩnh viễn)" />
            </div>
            <div className="form-group">
              <label>Lý do khóa (hiển thị cho khách)</label>
              <textarea className="form-control" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Vi phạm chính sách mua hàng" />
            </div>
            <div className="flex justify-between" style={{ gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={() => setLockTarget(null)}>Hủy</button>
              <button className="btn btn-danger">Xác nhận khóa</button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
