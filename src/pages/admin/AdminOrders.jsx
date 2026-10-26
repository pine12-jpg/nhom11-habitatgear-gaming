import { Fragment, useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import AdminPagination, { usePagination } from "../../components/AdminPagination";
import DateRangeFilter, { inDateRange } from "../../components/DateRangeFilter";
import api, { errMsg } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { formatVND, formatDateTime, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "../../utils/format";
import ProductImage from "../../components/ProductImage";

const STATUSES = ["processing", "shipping", "delivered", "cancelled"];

/** US33 — Xem danh sách đơn hàng toàn hệ thống và cập nhật trạng thái xử lý */
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(""); // lọc theo ngày đặt hàng
  const [to, setTo] = useState("");
  const toast = useToast();

  function load() {
    api.get("/admin/orders", { params: { status: status || undefined } }).then(({ data }) => setOrders(data));
  }
  useEffect(load, [status]);

  async function updateStatus(o, newStatus) {
    try {
      await api.put(`/admin/orders/${o.id}/status`, { status: newStatus });
      toast.success("Đã cập nhật trạng thái đơn hàng.");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function confirmPayment(o) {
    try {
      await api.put(`/admin/orders/${o.id}/payment`, { paymentStatus: "paid" });
      toast.success("Đã xác nhận thanh toán.");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  // Tìm theo mã đơn, tên/SĐT khách, tên hoặc ID sản phẩm trong đơn + lọc khoảng ngày đặt
  const kw = q.trim().toLowerCase().replace(/^#/, "");
  const filtered = orders.filter((o) => {
    if (!inDateRange(o.createdAt, from, to)) return false;
    if (!kw) return true;
    return (
      (o.code || "").toLowerCase().includes(kw) ||
      (o.customerName || "").toLowerCase().includes(kw) ||
      (o.shipping?.name || "").toLowerCase().includes(kw) ||
      (o.shipping?.phone || "").includes(kw) ||
      (o.items || []).some((i) => String(i.productId) === kw || (i.name || "").toLowerCase().includes(kw))
    );
  });
  const pager = usePagination(filtered, `${status}|${q}|${from}|${to}`);

  return (
    <AdminLayout title="Quản lý đơn hàng">
      <div className="toolbar-row">
        <input
          className="search-mini"
          style={{ minWidth: 300 }}
          placeholder="Tìm mã đơn, tên khách, SĐT, tên / ID sản phẩm…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="form-control" style={{ width: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
        </select>
        <DateRangeFilter label="Ngày đặt" from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <span className="muted">{filtered.length} đơn hàng</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {pager.pageItems.length === 0 && (
                <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 24 }}>Không có đơn hàng phù hợp.</td></tr>
              )}
              {pager.pageItems.map((o) => (
                <Fragment key={o.id}>
                  <tr>
                    <td><strong>{o.code}</strong></td>
                    <td>{o.customerName}</td>
                    <td>{formatDateTime(o.createdAt)}</td>
                    <td>
                      {PAYMENT_METHOD_LABEL[o.paymentMethod]}<br />
                      <span className={`badge badge-${o.paymentStatus}`}>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</span>
                    </td>
                    <td>{formatVND(o.total)}</td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: "5px 8px", fontSize: 12.5 }}
                        value={o.status}
                        disabled={o.status === "cancelled" || o.status === "delivered"}
                        onChange={(e) => updateStatus(o, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="btn-link" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                        {expanded === o.id ? "Thu gọn" : "Chi tiết"}
                      </button>
                      {o.paymentStatus !== "paid" && (
                        <>
                          {" "}<button className="btn-link" onClick={() => confirmPayment(o)}>Xác nhận TT</button>
                        </>
                      )}
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr>
                      <td colSpan={7} style={{ background: "var(--gray-50)" }}>
                        <strong>{o.shipping?.name}</strong> — {o.shipping?.phone}<br />
                        {o.shipping?.address}
                        <ul className="mt-8">
                          {o.items.map((i) => (
                            <li key={i.id} className="flex items-center gap-8" style={{ marginBottom: 6 }}>
                              <span className="mini-thumb"><ProductImage product={i} /></span>
                              {i.name} x{i.quantity} — {formatVND(i.price * i.quantity)}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <AdminPagination pager={pager} />
      </div>
    </AdminLayout>
  );
}
