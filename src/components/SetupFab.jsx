import { Link, useLocation } from "react-router-dom";
import { SETUP_STORAGE_KEY } from "./SetupBuilder";
import "../styles/setupFab.css";

export const SETUP_PATH = "/dung-setup";

/** Đếm số món đã chọn trong bộ setup (đọc từ sessionStorage) */
export function countPicked() {
  try {
    const data = JSON.parse(sessionStorage.getItem(SETUP_STORAGE_KEY)) || {};
    return Object.values(data).filter(Boolean).length;
  } catch {
    return 0;
  }
}

/**
 * SetupFab — nút tròn nhỏ ghim cạnh mép phải màn hình.
 * Khách bấm vào sẽ được chuyển sang trang /dung-setup để dựng góc setup.
 * Tự ẩn khi đang ở chính trang đó.
 */
export default function SetupFab() {
  const { pathname } = useLocation(); // đổi trang thì đọc lại số món
  if (pathname === SETUP_PATH) return null;
  const count = countPicked();

  return (
    <Link to={SETUP_PATH} className="setup-fab" aria-label="Dựng góc setup mơ ước" title="Dựng góc setup mơ ước">
      <span className="setup-fab-icon">🖥️</span>
      <span className="setup-fab-label">Dựng setup</span>
      {count > 0 && <span className="setup-fab-badge">{count}</span>}
    </Link>
  );
}
