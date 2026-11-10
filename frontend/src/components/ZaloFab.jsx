import "../styles/setupFab.css";

/* ====== CẤU HÌNH ======
 * Thay bằng số Zalo của shop (đúng số điện thoại đã đăng ký Zalo, dạng 0912345678).
 * Link chat sẽ là https://zalo.me/<số điện thoại>
 */
export const ZALO_PHONE = "0908506223";

/**
 * ZaloFab — nút tròn xanh cạnh mép phải màn hình.
 * Khách bấm vào sẽ mở cửa sổ chat Zalo với shop ở tab mới.
 */
export default function ZaloFab() {
  return (
    <a
      href={`https://zalo.me/${ZALO_PHONE}`}
      target="_blank"
      rel="noopener noreferrer"
      className="zalo-fab"
      aria-label="Chat Zalo với shop"
      title="Chat Zalo với shop"
    >
      <span className="zalo-fab-text">Zalo</span>
      <span className="setup-fab-label">Chat Zalo</span>
    </a>
  );
}
