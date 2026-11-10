/**
 * productSpecs.js — dòng thông số ngắn hiện dưới tên sản phẩm trên thẻ (ProductCard).
 *
 * Thứ tự ưu tiên:
 *  1) Cấu hình máy: CPU • GPU • RAM (laptop, PC)
 *  2) Màn hình: kích thước • tấm nền • tần số quét
 *  3) Bảng SPECS bên dưới (bàn phím, chuột, tai nghe, ghế/bàn, linh kiện) — khớp theo tên sản phẩm
 *  4) Sản phẩm mới do admin thêm: lấy vài chữ đầu của phần mô tả
 * Muốn thêm thông số cho sản phẩm mới: thêm một dòng vào SPECS (tên sản phẩm : "thông số • thông số").
 */
const SPECS = {
  "Logitech G Pro X Keyboard": "TKL • Hotswap • GX Blue Clicky",
  "Razer BlackWidow V4": "Full-size • Razer Green • RGB Chroma",
  "AKKO 5075B Plus": "75% • Gasket mount • Cream Yellow",
  "Corsair K70 RGB Pro": "Full-size • Cherry MX Red • Khung nhôm",
  "Logitech G Pro X Superlight 2": "Không dây • 60g • 32000 DPI",
  "Razer DeathAdder V3": "Có dây • Công thái học • 30K DPI",
  "SteelSeries Aerox 5 Wireless": "Không dây • Tổ ong • 9 nút",
  "Corsair M75 Air Wireless": "Không dây • 60g • Pin 100 giờ",
  "SteelSeries Arctis Nova 5": "Không dây 2.4GHz + BT • Âm thanh vòm 360°",
  "HyperX Cloud III": "Có dây • Driver 53mm • Đệm tai êm",
  "Razer BlackShark V2 X": "Có dây • 240g • Âm thanh định vị",
  "Ghế Gaming DXRacer Air Series": "Lưới thoáng khí • Tựa lưng ngả • Kê chân",
  "Bàn Gaming E-Dra Motorized EGD003": "Nâng hạ điện • Khung thép • Tải 100kg",
  "VGA Gigabyte RTX 4070 Super WINDFORCE": "12GB GDDR6X • 3 quạt WINDFORCE",
  "RAM Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz": "2x16GB • DDR5 • 6000MHz",
};

const ok = (s) => s && s !== "—";

/** Trả về chuỗi thông số ngắn (luôn có nội dung nếu sản phẩm có tên/mô tả) */
export function getMiniSpecs(product) {
  const hw = [product.cpu, product.gpu, product.ram].filter(ok);
  if (hw.length) return hw.slice(0, 2).join(" • ");
  if (ok(product.screen)) return product.screen;
  if (SPECS[product.name]) return SPECS[product.name];
  const desc = (product.description || "").split(/[,.]/)[0].trim();
  return desc.length > 52 ? desc.slice(0, 50).trim() + "…" : desc;
}
