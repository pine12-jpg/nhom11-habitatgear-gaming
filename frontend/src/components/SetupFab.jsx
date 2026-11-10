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
      <svg className="setup-fab-icon" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M9 20h6M12 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <span className="setup-fab-label">Dựng setup</span>
      {count > 0 && <span className="setup-fab-badge">{count}</span>}
    </Link>
  );
}
