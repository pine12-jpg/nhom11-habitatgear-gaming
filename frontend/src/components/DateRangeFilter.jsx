/** Chuyển chuỗi ngày giờ (ISO) sang "YYYY-MM-DD" theo giờ địa phương để so sánh với ô chọn ngày */
export function toLocalYMD(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Ngày iso có nằm trong khoảng [from, to] không (gồm cả 2 đầu). Bỏ trống đầu nào thì không giới hạn đầu đó. */
export function inDateRange(iso, from, to) {
  if (!from && !to) return true;
  const day = toLocalYMD(iso);
  if (!day) return false;
  let lo = from, hi = to;
  if (lo && hi && lo > hi) [lo, hi] = [hi, lo]; // chọn ngược thì tự đảo lại
  if (lo && day < lo) return false;
  if (hi && day > hi) return false;
  return true;
}

/** Hai ô chọn "Từ ngày — Đến ngày" + nút xóa lọc */
export default function DateRangeFilter({ from, to, onFrom, onTo, label = "Ngày" }) {
  return (
    <div className="date-range">
      <span className="date-range-label">{label}</span>
      <input type="date" className="form-control" value={from} max={to || undefined} onChange={(e) => onFrom(e.target.value)} aria-label={`${label} từ ngày`} />
      <span className="date-range-sep">→</span>
      <input type="date" className="form-control" value={to} min={from || undefined} onChange={(e) => onTo(e.target.value)} aria-label={`${label} đến ngày`} />
      {(from || to) && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => { onFrom(""); onTo(""); }}>Xóa ngày</button>
      )}
    </div>
  );
}
