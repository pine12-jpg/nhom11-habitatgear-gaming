/**
 * vietqr.js — Sinh chuỗi dữ liệu mã QR chuyển khoản ngân hàng theo đúng cấu trúc
 * chuẩn EMVCo QR Code for Payment Systems mà VietQR (NAPAS) đang sử dụng tại Việt Nam
 * (định dạng TLV: Tag - Length - Value, kết thúc bằng CRC16-CCITT).
 *
 * LƯU Ý: mặc định bên dưới là thông tin DEMO, KHÔNG phải tài khoản nhận tiền thật.
 * Muốn QR quét ra đúng tài khoản của nhóm, hãy sửa BANK_ACCOUNT bên dưới. Mã BIN ngân
 * hàng dùng ở đây là mã định tuyến công khai do NAPAS phát hành (tương tự mã vùng
 * điện thoại), không phải thông tin bí mật. Khi triển khai thực tế, cần thay bằng
 * tài khoản doanh nghiệp đã đăng ký dịch vụ VietQR với ngân hàng.
 */

// Danh sách mã BIN NAPAS của một số ngân hàng phổ biến (mã định tuyến công khai)
export const BANKS = [
  { bin: "970436", short: "Vietcombank" },
  { bin: "970422", short: "MB Bank" },
  { bin: "970407", short: "Techcombank" },
  { bin: "970418", short: "BIDV" },
  { bin: "970415", short: "VietinBank" },
  { bin: "970416", short: "ACB" },
  { bin: "970423", short: "TPBank" },
  { bin: "970432", short: "VPBank" },
  { bin: "970403", short: "Sacombank" },
  { bin: "970405", short: "Agribank" },
];

/**
 * ====== CẤU HÌNH TÀI KHOẢN NHẬN TIỀN — SỬA 4 DÒNG DƯỚI ĐÂY ======
 * bankBin       : mã BIN ngân hàng (xem danh sách BANKS ở trên)
 * bankName      : tên ngân hàng hiển thị trên trang đơn hàng
 * accountNumber : số tài khoản nhận tiền
 * accountName   : tên chủ tài khoản, VIẾT HOA, KHÔNG DẤU
 */
export const BANK_ACCOUNT = {
  bankBin: "970416",
  bankName: "ACB",
  accountNumber: "41194437",
  accountName: "LA MINH THUAN",
};
// Tương thích code cũ
export const DEMO_BANK_ACCOUNT = BANK_ACCOUNT;
// true khi vẫn dùng tài khoản mẫu (để hiện cảnh báo DEMO trên giao diện)
export const IS_DEMO_ACCOUNT = BANK_ACCOUNT.accountNumber === "0071000999999";

function crc16ccitt(input) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id, value) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

/**
 * Sinh chuỗi payload QR chuyển khoản ngân hàng (static nếu không truyền amount,
 * dynamic — có sẵn số tiền — nếu có amount).
 */
export function buildVietQRPayload({
  bankBin = BANK_ACCOUNT.bankBin,
  accountNumber = BANK_ACCOUNT.accountNumber,
  accountName = BANK_ACCOUNT.accountName,
  amount,
  message = "",
  city = "HO CHI MINH",
} = {}) {
  const accountInfo = tlv("00", bankBin) + tlv("01", accountNumber);
  const merchantInfo = tlv("00", "A000000727") + tlv("01", accountInfo) + tlv("02", "QRIBFTTA");
  const additional = message ? tlv("08", message.slice(0, 25)) : "";

  let payload =
    tlv("00", "01") +
    tlv("01", amount ? "12" : "11") +
    tlv("38", merchantInfo) +
    tlv("53", "704") +
    (amount ? tlv("54", String(Math.max(0, Math.round(amount)))) : "") +
    tlv("58", "VN") +
    tlv("59", accountName.slice(0, 25)) +
    tlv("60", city.slice(0, 15)) +
    (additional ? tlv("62", additional) : "");

  payload += "6304";
  return payload + crc16ccitt(payload);
}
