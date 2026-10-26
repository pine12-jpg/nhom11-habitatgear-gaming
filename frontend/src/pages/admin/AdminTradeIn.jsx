import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import AdminPagination, { usePagination } from "../../components/AdminPagination";
import api, { errMsg } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { formatDateTime, formatVND } from "../../utils/format";

const CONDITION_LABEL = { excellent: "Rất tốt", good: "Tốt", fair: "Khá", poor: "Kém" };
const STATUS_LABEL = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };

/** US24 — Admin duyệt và báo giá các yêu cầu thu cũ - đổi mới */
export default function AdminTradeIn() {
  const [list, setList] = useState([]);
  const [reviewing, setReviewing] = useState(null); // {id, offeredPrice, adminNote}
  const toast = useToast();

  function load() {
    api.get("/admin/tradein").then(({ data }) => setList(data));
  }
  useEffect(load, []);

  async function approve(e) {
    e.preventDefault();
    try {
      await api.put(`/admin/tradein/${reviewing.id}`, { status: "approved", offeredPrice: reviewing.offeredPrice, adminNote: reviewing.adminNote });
      toast.success("Đã duyệt và báo giá thu cũ - đổi mới.");
      setReviewing(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function reject(t) {
    const adminNote = window.prompt("Lý do từ chối (tùy chọn):", "") || "";
    try {
      await api.put(`/admin/tradein/${t.id}`, { status: "rejected", adminNote });
      toast.success("Đã từ chối yêu cầu.");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  const pager = usePagination(list, "");

  return (
    <AdminLayout title="Thu cũ - Đổi mới">
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Khách hàng</th><th>Thiết bị</th><th>Tình trạng</th><th>Mô tả</th><th>Ngày gửi</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {pager.pageItems.map((t) => (
              <tr key={t.id}>
                <td>{t.userName}</td>
                <td>{t.deviceType} — {t.model}</td>
                <td>{CONDITION_LABEL[t.condition]}</td>
                <td style={{ maxWidth: 220 }}>{t.description || "—"}</td>
                <td>{formatDateTime(t.createdAt)}</td>
                <td>
                  <span className={`badge badge-${t.status}`}>{STATUS_LABEL[t.status]}</span>
                  {t.status === "approved" && <div className="muted" style={{ fontSize: 11.5 }}>{formatVND(t.offeredPrice)}{t.used && " • đã dùng"}</div>}
                </td>
                <td>
                  {t.status === "pending" && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => setReviewing({ id: t.id, offeredPrice: "", adminNote: "" })}>Duyệt & báo giá</button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={() => reject(t)}>Từ chối</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      <AdminPagination pager={pager} />
      </div>

      {reviewing && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setReviewing(null)}>
          <div className="modal-box">
            <div className="modal-head">
              <h3>Duyệt & báo giá thu cũ</h3>
              <button className="modal-close" onClick={() => setReviewing(null)}>✕</button>
            </div>
            <form onSubmit={approve}>
              <div className="form-group">
                <label>Giá thu mua (đ)</label>
                <input type="number" className="form-control" value={reviewing.offeredPrice} onChange={(e) => setReviewing((s) => ({ ...s, offeredPrice: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Ghi chú cho khách (tùy chọn)</label>
                <textarea className="form-control" value={reviewing.adminNote} onChange={(e) => setReviewing((s) => ({ ...s, adminNote: e.target.value }))} />
              </div>
              <button className="btn btn-primary">Xác nhận duyệt</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
