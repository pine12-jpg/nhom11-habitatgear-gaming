import { useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { buildVietQRPayload, BANK_ACCOUNT, IS_DEMO_ACCOUNT } from "../utils/vietqr";
import { formatVND } from "../utils/format";
import { useToast } from "../context/ToastContext";

/**
 * PaymentQR — mã QR để thanh toán hóa đơn đơn hàng.
 *
 * - "bank" (chuyển khoản ngân hàng): mã QR đúng chuẩn VietQR/EMVCo — quét bằng app
 *   ngân hàng bất kỳ sẽ tự điền số tiền + nội dung chuyển khoản. Tài khoản nhận tiền
 *   cấu hình trong src/utils/vietqr.js (mặc định là tài khoản DEMO).
 * - "momo" / "zalopay": mã QR minh họa giao diện, chưa kết nối API thật của ví.
 * - "cod" / "installment": không cần quét QR nên không hiển thị.
 */
export default function PaymentQR({ order }) {
  const toast = useToast();
  const canvasRef = useRef(null);

  // Ẩn nút chat nổi (góc dưới trái) khi đang hiện QR để nó không che mã khi quét
  const showsQR = !!order && order.paymentStatus !== "paid" && ["bank", "momo", "zalopay"].includes(order.paymentMethod);
  useEffect(() => {
    if (!showsQR) return undefined;
    document.body.classList.add("has-payment-qr");
    return () => document.body.classList.remove("has-payment-qr");
  }, [showsQR]);

  if (!order || order.paymentStatus === "paid") return null;
  if (!["bank", "momo", "zalopay"].includes(order.paymentMethod)) return null;

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(String(text));
      toast.success(`Đã sao chép ${label}`);
    } catch {
      toast.error("Trình duyệt không cho sao chép, hãy chép thủ công");
    }
  }

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `QR-${order.code}.png`;
    a.click();
  }

  if (order.paymentMethod === "bank") {
    const payload = buildVietQRPayload({ amount: order.total, message: order.code });
    const rows = [
      { label: "Ngân hàng", value: BANK_ACCOUNT.bankName },
      { label: "Số tài khoản", value: BANK_ACCOUNT.accountNumber, copy: "số tài khoản" },
      { label: "Chủ tài khoản", value: BANK_ACCOUNT.accountName },
      { label: "Số tiền", value: formatVND(order.total), raw: order.total, copy: "số tiền", strong: true },
      { label: "Nội dung CK", value: order.code, copy: "nội dung chuyển khoản", strong: true },
    ];

    return (
      <div className="card mt-16">
        <h3 className="panel-title">
          Thanh toán bằng chuyển khoản ngân hàng{" "}
          <span className="badge badge-pending" style={{ marginLeft: 8 }}>Chờ thanh toán</span>
        </h3>

        <div className="qr-layout">
          <div>
            <div className="qr-box">
              <QRCodeCanvas ref={canvasRef} value={payload} size={220} level="M" marginSize={2} />
            </div>
            <button className="btn btn-ghost btn-sm btn-block mt-8" onClick={downloadQR}>
              Tải mã QR (.png)
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <table className="spec-table" style={{ marginTop: 0 }}>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>
                      {r.strong ? <strong style={{ color: "var(--red-600)" }}>{r.value}</strong> : r.value}
                      {r.copy && (
                        <button
                          className="btn-link"
                          style={{ marginLeft: 10, fontSize: 12 }}
                          onClick={() => copy(r.raw ?? r.value, r.copy)}
                        >
                          Sao chép
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ol className="form-hint" style={{ paddingLeft: 18, lineHeight: 1.7, margin: 0 }}>
              <li>Mở app ngân hàng bất kỳ và chọn <strong>Quét QR</strong>.</li>
              <li>Quét mã bên trái — số tiền và nội dung được điền sẵn.</li>
              <li>Kiểm tra đúng số tiền, nội dung <strong>{order.code}</strong> rồi xác nhận chuyển khoản.</li>
              <li>Cửa hàng sẽ xác nhận thanh toán và cập nhật trạng thái đơn hàng.</li>
            </ol>
          </div>
        </div>

        <div className="alert alert-info mt-16" style={{ marginBottom: 0 }}>
          Vui lòng giữ nguyên <strong>nội dung chuyển khoản</strong> để cửa hàng đối soát đúng đơn.
          {IS_DEMO_ACCOUNT && (
            <>
              {" "}Đây là tài khoản <strong>DEMO</strong> phục vụ đồ án, không phải tài khoản nhận tiền thật — vui lòng
              không chuyển khoản thật vào số tài khoản này.
            </>
          )}
        </div>
      </div>
    );
  }

  // momo / zalopay — minh họa giao diện quét mã, không theo API thật của ví điện tử
  const walletName = order.paymentMethod === "momo" ? "Ví MoMo" : "Ví ZaloPay";
  const demoValue = `GVNGAMING|${order.paymentMethod}|${order.code}|${order.total}`;
  return (
    <div className="card mt-16">
      <h3 className="panel-title">Quét mã QR thanh toán qua {walletName}</h3>
      <div className="qr-layout">
        <div className="qr-box">
          <QRCodeCanvas value={demoValue} size={176} level="M" marginSize={2} />
        </div>
        <div style={{ flex: 1 }}>
          <p>Mở ứng dụng <strong>{walletName}</strong> → Quét mã QR → Xác nhận thanh toán <strong>{formatVND(order.total)}</strong> cho đơn hàng <strong>{order.code}</strong>.</p>
          <p className="form-hint">Mã QR minh họa cho mục đích demo giao diện — đồ án chưa kết nối API thanh toán thật của {walletName}.</p>
        </div>
      </div>
    </div>
  );
}
