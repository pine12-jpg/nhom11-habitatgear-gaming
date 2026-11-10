import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { formatVND } from "../utils/format";
import { ZALO_PHONE } from "./ZaloFab";

/**
 * ChatBot — trợ lý tự động trả lời khách (MIỄN PHÍ, không cần API key, không gọi AI bên ngoài).
 *
 * Cách hoạt động: đọc câu khách gõ -> bỏ dấu tiếng Việt -> dò từ khóa để biết khách hỏi gì
 *  1) Hỏi chính sách (bảo hành, đổi trả, giao hàng, thanh toán, voucher, showroom...) -> trả lời câu soạn sẵn (bảng FAQ bên dưới)
 *  2) Hỏi sản phẩm ("laptop dưới 30 triệu", "chuột Razer", "tai nghe rẻ nhất"...) -> tự tìm trong kho hàng thật qua API /products
 *  3) Không hiểu -> gợi ý các câu hỏi mẫu + chuyển sang Zalo / hotline
 *
 * Muốn bot biết thêm câu hỏi mới: thêm 1 mục vào mảng FAQ (keys = từ khóa KHÔNG DẤU, reply = câu trả lời).
 */

/* ====================== CẤU HÌNH — sửa cho đúng cửa hàng của bạn ====================== */
const BOT_NAME = "Trợ lý GVN";
const HOTLINE = "1900 5301";

const FAQ = [
  {
    keys: ["xin chao", "chao ban", "hello", "hi ", "alo", "chao shop", "chao ad"],
    reply: "Chào bạn 👋 Mình là trợ lý tự động của GVN Gaming. Bạn cần tìm sản phẩm, hỏi chính sách hay địa chỉ showroom? Cứ hỏi mình nhé!",
  },
  {
    keys: ["bao hanh"],
    reply:
      "🛡️ Chính sách bảo hành:\n• Laptop, PC gaming: chính hãng 12–24 tháng tùy hãng.\n• Bàn phím, chuột, tai nghe: 12 tháng, 1 đổi 1 trong 30 ngày đầu nếu lỗi nhà sản xuất.\n• Linh kiện PC: theo hãng (thường 36 tháng với RAM, VGA).\n• Kiểm tra, tư vấn kỹ thuật miễn phí tại mọi showroom.",
    links: [{ to: "/bao-hanh", label: "Xem chi tiết bảo hành" }],
  },
  {
    keys: ["doi tra", "hoan tien", "tra hang", "tra lai", "san pham loi", "bi loi", "hang loi"],
    reply:
      "🔄 Chính sách đổi trả:\n• Đổi trả trong 7 ngày nếu lỗi nhà sản xuất, còn nguyên hộp và phụ kiện.\n• Ghế/bàn gaming: đổi mẫu trong 3 ngày nếu chưa lắp ráp.\n• Không áp dụng với sản phẩm đã dùng hoặc trầy xước do người dùng.\n• Phí vận chuyển đổi trả do lỗi nhà sản xuất được hỗ trợ 100%.",
    links: [{ to: "/doi-tra", label: "Xem chi tiết đổi trả" }],
  },
  {
    keys: ["giao hang", "van chuyen", "ship", "phi ship", "phi giao", "bao lau nhan", "nhan hang", "bao lau co hang"],
    reply:
      "🚚 Giao hàng:\n• Tiêu chuẩn (2–4 ngày): 30.000đ, MIỄN PHÍ cho đơn từ 3.000.000đ.\n• Nhanh (trong 24h nội thành): 60.000đ.\n• Nhận tại showroom: miễn phí.",
  },
  {
    keys: ["thanh toan", "cod", "momo", "zalopay", "chuyen khoan", "tra gop", "tra cham", "tra truoc", "0%"],
    reply:
      "💳 Thanh toán:\n• Thanh toán khi nhận hàng (COD)\n• Chuyển khoản ngân hàng\n• Ví MoMo / ZaloPay\n• Trả góp 0% lãi suất: đơn từ 3.000.000đ, kỳ hạn 3, 6 hoặc 12 tháng (đối tác tài chính liên hệ xác minh trong 24h).",
    links: [{ to: "/huong-dan", label: "Hướng dẫn mua hàng & trả góp" }],
  },
  {
    keys: ["voucher", "ma giam", "khuyen mai", "giam gia", "coupon", "uu dai", "sale"],
    reply:
      "🎁 Mã giảm giá đang có:\n• GVNGAME10 — giảm 10% cho đơn từ 5.000.000đ\n• FREESHIP — giảm 30.000đ phí ship\n• SINHVIEN50K — giảm 50.000đ cho đơn từ 2.000.000đ\nNhập mã ở bước thanh toán nhé!",
    links: [{ to: "/san-pham?sale=1", label: "Xem sản phẩm đang giảm giá" }],
  },
  {
    keys: ["thu cu", "doi cu", "doi moi", "tradein", "trade in", "ban lai may"],
    reply: "♻️ Chương trình Thu cũ – Đổi mới giúp bạn trừ tiền máy cũ khi mua máy mới. Bạn cần đăng nhập, gửi thông tin máy cũ và chờ cửa hàng báo giá.",
    links: [{ to: "/thu-cu-doi-moi", label: "Gửi yêu cầu thu cũ" }],
  },
  {
    keys: ["dung setup", "goi y setup", "setup", "goc may"],
    reply: "🖥️ Bạn có thể tự dựng góc setup: chọn màn hình, bàn phím, chuột, tai nghe, ghế rồi thêm cả bộ vào giỏ chỉ với một cú bấm.",
    links: [{ to: "/dung-setup", label: "Dựng góc setup" }],
  },
  {
    keys: ["so sanh"],
    reply: "⚖️ Để so sánh, bạn tick ô \"So sánh\" ở góc ảnh của 2–3 sản phẩm (tối đa 3), rồi bấm \"Xem so sánh\" ở thanh dưới màn hình.",
    links: [{ to: "/san-pham", label: "Chọn sản phẩm để so sánh" }],
  },
  {
    keys: ["kiem tra ban phim", "test ban phim", "test chuot", "kiem tra chuot", "kiem tra gear"],
    reply: "🧪 Web có công cụ kiểm tra bàn phím và chuột ngay trên trình duyệt, bạn dùng thử nhé.",
    links: [{ to: "/kiem-tra-gear", label: "Kiểm tra bàn phím – chuột" }],
  },
  {
    keys: ["don hang", "tra cuu don", "theo doi don", "ma don", "don cua toi"],
    reply: "📦 Bạn đăng nhập rồi vào mục Đơn hàng để xem trạng thái và chi tiết từng đơn.",
    links: [{ to: "/don-hang", label: "Xem đơn hàng của tôi" }],
  },
  {
    keys: ["dang nhap", "dang ky", "quen mat khau", "tai khoan", "mat khau"],
    reply: "👤 Bạn có thể đăng nhập / đăng ký tài khoản để theo dõi đơn hàng và dùng Thu cũ – Đổi mới. Quên mật khẩu thì dùng mục \"Quên mật khẩu\" ở trang đăng nhập.",
    links: [{ to: "/dang-nhap", label: "Đăng nhập" }, { to: "/quen-mat-khau", label: "Quên mật khẩu" }],
  },
  {
    keys: ["lien he", "hotline", "so dien thoai", "sdt", "zalo", "tu van vien", "nhan vien", "gap nguoi"],
    reply: `📞 Hotline: ${HOTLINE} (TP.HCM) · 1800 6975 (Hà Nội)\nHoặc chat Zalo với nhân viên bên dưới nhé.`,
    zalo: true,
  },
  {
    keys: ["cam on", "thanks", "thank", "ok ban", "tuyet"],
    reply: "Không có gì ạ 😊 Cần gì thêm bạn cứ nhắn mình nhé!",
  },
  {
    keys: ["tam biet", "bye"],
    reply: "Hẹn gặp lại bạn! Chúc bạn chọn được món gear ưng ý 🎮",
  },
];

/* Từ khóa nhận biết ngành hàng -> slug danh mục trong cửa hàng */
const CATEGORY_WORDS = [
  { re: /\b(laptop|may tinh xach tay|notebook)\b/, slug: "laptop-gaming", label: "laptop gaming" },
  { re: /\b(pc|may bo|build san|case may)\b/, slug: "pc-gaming", label: "PC gaming" },
  { re: /\b(man hinh|monitor)\b/, slug: "man-hinh", label: "màn hình" },
  { re: /\b(ban phim|keyboard)\b/, slug: "ban-phim", label: "bàn phím cơ" },
  { re: /\b(chuot|mouse)\b/, slug: "chuot", label: "chuột gaming" },
  { re: /\b(tai nghe|headset|headphone)\b/, slug: "tai-nghe", label: "tai nghe gaming" },
  { re: /\b(ghe|ban gaming|ban nang ha)\b/, slug: "ghe-ban", label: "ghế - bàn gaming" },
  { re: /\b(vga|card do hoa|card man hinh|gpu|ram)\b/, slug: "linh-kien", label: "linh kiện PC" },
];

const SUGGESTIONS = [
  "Laptop dưới 30 triệu",
  "Chuột gaming rẻ nhất",
  "Chính sách bảo hành",
  "Phí giao hàng",
  "Có trả góp không?",
  "Địa chỉ showroom",
];

/* ====================== TIỆN ÍCH ====================== */
/** Bỏ dấu tiếng Việt + chữ thường để dò từ khóa dễ hơn: "Bảo hành" -> "bao hanh" */
function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9%.,\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Đọc mức giá trong câu: "dưới 20 triệu", "từ 10 đến 15tr", "khoảng 25 triệu", "trên 5tr" -> {min,max} (đơn vị đồng) */
function parsePrice(t) {
  const toVnd = (num, unit) => {
    const n = parseFloat(String(num).replace(",", "."));
    if (!unit) return n >= 10000 ? n : null; // số trần chỉ tính nếu đủ lớn (vd 20000000)
    if (/^(tr|trieu|m)$/.test(unit)) return n * 1e6;
    if (/^(k|nghin|ngan)$/.test(unit)) return n * 1e3;
    return null;
  };
  // Khoảng giá "từ 10 đến 15 triệu" / "10-15tr" (đơn vị chỉ cần ghi ở số sau)
  const range = t.match(/(\d+(?:[.,]\d+)?)\s*(tr|trieu|m)?\s*(?:den|toi|-)\s*(\d+(?:[.,]\d+)?)\s*(tr|trieu|m)\b/);
  if (range) {
    const u = range[4];
    const a = toVnd(range[1], range[2] || u);
    const b = toVnd(range[3], u);
    if (a && b) return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const re = /(\d+(?:[.,]\d+)?)\s*(tr|trieu|m|k|nghin|ngan)?\b/g;
  const nums = [];
  let m;
  while ((m = re.exec(t))) {
    // bỏ qua số đứng trước đơn vị không phải tiền (vd "27 inch", "16gb", "165hz")
    const after = t.slice(m.index + m[0].length).trim();
    if (!m[2] && /^(inch|gb|tb|hz|g|mm|nam|thang|ngay|%)/.test(after)) continue;
    const v = toVnd(m[1], m[2]);
    if (v) nums.push({ v, idx: m.index });
  }
  if (!nums.length) return {};
  const before = (i) => t.slice(Math.max(0, i - 12), i);
  const first = nums[0];
  const ctx = before(first.idx);
  if (/(duoi|toi da|khong qua|nho hon|<)\s*$/.test(ctx) || /\b(duoi|toi da|khong qua)\b/.test(ctx)) return { max: first.v };
  if (/(tren|toi thieu|it nhat|lon hon|>)\s*$/.test(ctx) || /\b(tren|toi thieu|it nhat)\b/.test(ctx)) return { min: first.v };
  if (/(khoang|tam|co|around)\s*$/.test(ctx) || /\b(khoang|tam)\b/.test(ctx)) return { min: first.v * 0.85, max: first.v * 1.15 };
  return { max: first.v }; // "laptop 20 triệu" -> hiểu là tầm giá tối đa
}

const STOPWORDS = new Set([
  "toi", "minh", "can", "muon", "mua", "tim", "cho", "co", "khong", "nao", "gi", "la", "va", "cua", "the", "nhe", "a", "ah", "ban", "shop",
  "tu", "van", "goi", "y", "nen", "dang", "duoc", "o", "tam", "gia", "re", "nhat", "dat", "tot", "loai", "hang", "san", "pham", "mau",
  "duoi", "tren", "khoang", "den", "tr", "trieu", "k", "nghin", "xem", "hay", "cai", "con", "chiec", "bo", "giup", "voi", "thi", "that",
]);

/* ====================== GIAO DIỆN (CSS tự chèn) ====================== */
const BOT_CSS = `
.cb-fab { position: fixed; left: 18px; bottom: 28px; z-index: 56; width: 58px; height: 58px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 26px; color: #fff; background: linear-gradient(145deg, #e21221, #ff4d57); box-shadow: 0 10px 26px rgba(226,18,33,.5), 0 0 0 3px rgba(255,255,255,.9); transition: transform .2s ease; }
.cb-fab:hover { transform: scale(1.08); }
.cb-fab .cb-dot { position: absolute; top: 2px; right: 2px; width: 13px; height: 13px; border-radius: 50%; background: #1fc16b; box-shadow: 0 0 0 2px #fff; }
.cb-hint { position: fixed; left: 86px; bottom: 40px; z-index: 56; background: #0b0e14; color: #fff; font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 999px; box-shadow: 0 8px 20px rgba(0,0,0,.3); animation: cbIn .4s ease both; white-space: nowrap; }
.cb-panel { overscroll-behavior: contain; position: fixed; left: 18px; bottom: 98px; z-index: 57; width: 372px; max-width: calc(100vw - 24px); height: 540px; max-height: calc(100vh - 120px); display: flex; flex-direction: column; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(11,14,20,.35), 0 0 0 1px rgba(0,0,0,.06); animation: cbIn .25s cubic-bezier(.22,1,.36,1) both; }
@keyframes cbIn { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }
.cb-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: linear-gradient(135deg, #0b0e14, #1d2230); color: #fff; }
.cb-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e21221; font-size: 20px; flex: none; }
.cb-title { font-weight: 800; font-size: 14.5px; line-height: 1.2; }
.cb-sub { font-size: 11.5px; color: #9fe9c2; display: flex; align-items: center; gap: 5px; }
.cb-sub::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #1fc16b; }
.cb-close { margin-left: auto; background: rgba(255,255,255,.1); border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 15px; }
.cb-close:hover { background: rgba(255,255,255,.22); }
.cb-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 14px; background: #f4f6fa; display: flex; flex-direction: column; gap: 10px; scrollbar-width: thin; }
.cb-row { display: flex; flex-direction: column; gap: 6px; max-width: 88%; }
.cb-row.bot { align-self: flex-start; }
.cb-row.me { align-self: flex-end; align-items: flex-end; }
.cb-bubble { padding: 9px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; white-space: pre-line; word-break: break-word; }
.cb-row.bot .cb-bubble { background: #fff; color: #20242c; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
.cb-row.me .cb-bubble { background: #e21221; color: #fff; border-bottom-right-radius: 4px; }
.cb-links { display: flex; flex-wrap: wrap; gap: 6px; }
.cb-link { display: inline-block; padding: 6px 12px; border-radius: 999px; background: #fff; border: 1px solid #e21221; color: #e21221; font-size: 12.5px; font-weight: 700; text-decoration: none; }
.cb-link:hover { background: #e21221; color: #fff; }
.cb-link.zalo { border-color: #0068ff; color: #0068ff; }
.cb-link.zalo:hover { background: #0068ff; color: #fff; }
.cb-prod { display: flex; gap: 10px; align-items: center; padding: 8px; background: #fff; border-radius: 12px; text-decoration: none; color: inherit; box-shadow: 0 1px 3px rgba(0,0,0,.08); border: 1.5px solid transparent; transition: border-color .15s, transform .15s; }
.cb-prod:hover { border-color: #e21221; transform: translateX(2px); }
.cb-prod-img { position: relative; width: 56px; height: 56px; flex: none; border-radius: 8px; background: #eef1f6; overflow: hidden; }
.cb-prod-img img, .cb-prod-img svg { position: absolute; inset: 0; width: 100%; height: 100%; padding: 4px; box-sizing: border-box; object-fit: contain; filter: none; mix-blend-mode: multiply; }
.cb-prod-name { font-size: 12.5px; font-weight: 700; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cb-prod-price { font-size: 13px; font-weight: 800; color: #e21221; margin-top: 2px; }
.cb-prod-price s { font-weight: 500; font-size: 11px; color: #9aa1ad; margin-left: 5px; }
.cb-typing { display: inline-flex; gap: 4px; padding: 12px 14px; background: #fff; border-radius: 14px; border-bottom-left-radius: 4px; align-self: flex-start; }
.cb-typing i { width: 6px; height: 6px; border-radius: 50%; background: #9aa1ad; animation: cbDot 1s infinite ease-in-out; }
.cb-typing i:nth-child(2) { animation-delay: .15s; } .cb-typing i:nth-child(3) { animation-delay: .3s; }
@keyframes cbDot { 0%, 80%, 100% { transform: translateY(0); opacity: .5; } 40% { transform: translateY(-4px); opacity: 1; } }
.cb-chips { overscroll-behavior: contain; display: flex; gap: 6px; padding: 8px 12px 6px; overflow-x: auto; background: #fff; border-top: 1px solid #eef0f3; scrollbar-width: thin; scrollbar-color: #c3c9d3 transparent; }
.cb-chips::-webkit-scrollbar { height: 6px; }
.cb-chips::-webkit-scrollbar-thumb { background: #c3c9d3; border-radius: 6px; }
.cb-chips::-webkit-scrollbar-thumb:hover { background: #e21221; }
.cb-chips::-webkit-scrollbar-track { background: transparent; }
.cb-chip { flex: none; padding: 6px 12px; border-radius: 999px; border: 1px solid #dfe3ea; background: #fff; font-size: 12px; font-weight: 600; color: #3a404b; cursor: pointer; white-space: nowrap; }
.cb-chip:hover { border-color: #e21221; color: #e21221; }
.cb-input { display: flex; gap: 8px; padding: 10px 12px 12px; background: #fff; }
.cb-input input { flex: 1; min-width: 0; border: 1px solid #dfe3ea; border-radius: 999px; padding: 10px 14px; font-size: 13.5px; outline: none; }
.cb-input input:focus { border-color: #e21221; }
.cb-input button { border: none; width: 40px; height: 40px; border-radius: 50%; background: #e21221; color: #fff; font-size: 16px; cursor: pointer; flex: none; }
.cb-input button:disabled { background: #c9ced6; cursor: default; }
@media (max-width: 600px) { .cb-fab { left: 12px; bottom: 20px; width: 52px; height: 52px; } .cb-hint { display: none; } .cb-panel { left: 8px; right: 8px; width: auto; max-width: none; bottom: 84px; height: calc(100vh - 110px); } }
@media (prefers-reduced-motion: reduce) { .cb-panel, .cb-hint, .cb-typing i { animation: none; } }
`;
if (typeof document !== "undefined" && !document.getElementById("chatbot-css")) {
  const el = document.createElement("style");
  el.id = "chatbot-css";
  el.textContent = BOT_CSS;
  document.head.appendChild(el);
}

/* ====================== COMPONENT ====================== */
export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Chào bạn 👋 Mình là trợ lý tự động của GVN Gaming. Mình có thể tìm sản phẩm theo giá, giải đáp bảo hành, giao hàng, thanh toán, địa chỉ showroom… Bạn cần gì nào?",
    },
  ]);
  const catalogRef = useRef(null); // danh sách sản phẩm tải 1 lần
  const showroomsRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // Tự ẩn lời mời sau vài giây
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 9000);
    return () => clearTimeout(t);
  }, []);

  // Cuộn xuống tin mới nhất
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, typing, open]);

  // Lăn chuột trong khung chat thì CHỈ cuộn trong khung, không kéo cả trang theo
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const onWheel = (e) => {
      const chips = e.target.closest?.(".cb-chips");
      const body = e.target.closest?.(".cb-body");
      if (chips) {
        // lăn dọc trên hàng gợi ý -> cuộn ngang hàng đó
        chips.scrollLeft += e.deltaY || e.deltaX;
        e.preventDefault();
      } else if (body) {
        // trong vùng tin nhắn: cuộn bình thường, chạm đầu/cuối cũng không lan ra trang
        const atTop = body.scrollTop <= 0 && e.deltaY < 0;
        const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 1 && e.deltaY > 0;
        if (atTop || atBottom || body.scrollHeight <= body.clientHeight) e.preventDefault();
      } else {
        e.preventDefault(); // tiêu đề, ô nhập...
      }
    };
    panel.addEventListener("wheel", onWheel, { passive: false });
    return () => panel.removeEventListener("wheel", onWheel);
  }, [open]);

  // Esc để đóng
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function getCatalog() {
    if (catalogRef.current) return catalogRef.current;
    try {
      const { data } = await api.get("/products", { params: { limit: 60 } });
      catalogRef.current = data.items || [];
    } catch {
      catalogRef.current = [];
    }
    return catalogRef.current;
  }

  async function getShowrooms() {
    if (showroomsRef.current) return showroomsRef.current;
    try {
      const { data } = await api.get("/showrooms");
      showroomsRef.current = data || [];
    } catch {
      showroomsRef.current = [];
    }
    return showroomsRef.current;
  }

  /** Tìm sản phẩm theo ngành hàng + mức giá + tên/hãng khách nhắc tới */
  async function searchProducts(t) {
    const catalog = await getCatalog();
    const cat = CATEGORY_WORDS.find((c) => c.re.test(t));
    const price = parsePrice(t);
    const wantCheap = /\b(re nhat|gia re|tiet kiem|sinh vien|binh dan)\b/.test(t);
    const wantExpensive = /\b(dat nhat|cao cap|manh nhat|xin nhat|flagship)\b/.test(t);
    const wantSale = /\b(giam gia|khuyen mai|sale)\b/.test(t);
    const tokens = t.split(" ").filter((w) => w.length >= 2 && !STOPWORDS.has(w) && !/^\d+([.,]\d+)?$/.test(w) && !CATEGORY_WORDS.some((c) => c.re.test(w)));

    let list = catalog.filter((p) => p.stock > 0);
    if (cat) list = list.filter((p) => p.categorySlug === cat.slug);
    if (price.min) list = list.filter((p) => p.finalPrice >= price.min);
    if (price.max) list = list.filter((p) => p.finalPrice <= price.max);
    if (wantSale) list = list.filter((p) => p.discountPercent > 0);

    // chấm điểm theo từ khóa tên / hãng / cấu hình khách nhắc
    if (tokens.length) {
      const scored = list
        .map((p) => {
          const hay = norm(`${p.name} ${p.brandName} ${p.cpu} ${p.gpu} ${p.ram} ${p.screen} ${p.description}`);
          const score = tokens.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
          return { p, score };
        })
        .filter((x) => x.score > 0);
      if (scored.length) list = scored.sort((a, b) => b.score - a.score).map((x) => x.p);
      else if (!cat && !price.min && !price.max) list = [];
    }

    if (wantCheap) list = [...list].sort((a, b) => a.finalPrice - b.finalPrice);
    else if (wantExpensive) list = [...list].sort((a, b) => b.finalPrice - a.finalPrice);
    else if (price.min || price.max) list = [...list].sort((a, b) => b.finalPrice - a.finalPrice);

    const priceText = price.min && price.max ? ` trong tầm ${formatVND(Math.round(price.min))} – ${formatVND(Math.round(price.max))}` : price.max ? ` dưới ${formatVND(Math.round(price.max))}` : price.min ? ` từ ${formatVND(Math.round(price.min))} trở lên` : "";
    const what = cat ? cat.label : "sản phẩm";

    if (!list.length) {
      return {
        text: `Mình chưa tìm thấy ${what}${priceText} phù hợp 😅 Bạn thử nới mức giá, đổi hãng hoặc xem toàn bộ danh mục nhé.`,
        links: [{ to: cat ? `/san-pham?category=${cat.slug}` : "/san-pham", label: "Xem tất cả sản phẩm" }],
      };
    }
    const top = list.slice(0, 3);
    return {
      text: `Mình tìm được ${list.length} ${what}${priceText}. Đây là ${top.length} gợi ý${wantCheap ? " giá tốt nhất" : wantExpensive ? " cao cấp nhất" : " nổi bật"}:`,
      products: top,
      links: list.length > 3 && cat ? [{ to: `/san-pham?category=${cat.slug}`, label: `Xem thêm ${cat.label}` }] : [],
    };
  }

  /** Quyết định trả lời gì cho câu khách vừa gõ */
  async function answer(raw) {
    const t = norm(raw);
    if (!t) return { text: "Bạn nhập câu hỏi giúp mình nhé 🙂" };

    // 1. Showroom (lấy từ dữ liệu thật)
    if (/\b(showroom|dia chi|chi nhanh|cua hang o dau|gio mo cua|may gio mo|o dau)\b/.test(t) && !CATEGORY_WORDS.some((c) => c.re.test(t))) {
      const rooms = await getShowrooms();
      const text = rooms.length
        ? "📍 Hệ thống showroom:\n" + rooms.map((s) => `• ${s.name}\n   ${s.address}\n   ⏰ ${s.hours} · ☎ ${s.phone}`).join("\n")
        : `📍 Bạn gọi hotline ${HOTLINE} để được báo showroom gần nhất nhé.`;
      return { text, links: [{ to: "/showroom", label: "Xem bản đồ showroom" }] };
    }

    // 2. Câu hỏi chính sách soạn sẵn — chọn mục khớp nhiều từ khóa nhất
    let best = null;
    let bestScore = 0;
    for (const f of FAQ) {
      const score = f.keys.reduce((s, k) => s + (` ${t} `.includes(` ${k.trim()} `) || t.includes(k) ? k.length : 0), 0);
      if (score > bestScore) { best = f; bestScore = score; }
    }

    // 3. Có nhắc tới ngành hàng / giá / hãng / cấu hình -> tìm sản phẩm
    const catalog = await getCatalog();
    const mentionsCat = CATEGORY_WORDS.some((c) => c.re.test(t));
    const mentionsPrice = parsePrice(t).min || parsePrice(t).max;
    const mentionsBrandOrModel = catalog.some((p) => {
      const hay = norm(`${p.name} ${p.brandName}`);
      return t.split(" ").some((w) => w.length >= 3 && !STOPWORDS.has(w) && hay.includes(w));
    });
    const isProductAsk = mentionsCat || mentionsPrice || mentionsBrandOrModel || /\b(goi y|tu van|nen mua|ban chay|hot|moi nhat)\b/.test(t);

    // câu hỏi chính sách rõ ràng thắng, trừ khi khách hỏi sản phẩm cụ thể (vd "chuột bảo hành bao lâu" vẫn trả lời bảo hành)
    if (best && (!isProductAsk || bestScore >= 7)) return best;
    if (isProductAsk) return searchProducts(t);
    if (best) return best;

    return {
      text: `Mình chưa hiểu rõ ý bạn 😅 Bạn thử hỏi kiểu:\n• "Laptop dưới 30 triệu"\n• "Chuột Razer"\n• "Bảo hành bao lâu?"\n• "Địa chỉ showroom"\nHoặc nhắn trực tiếp nhân viên (hotline ${HOTLINE}).`,
      zalo: true,
    };
  }

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || typing) return;
    setInput("");
    setShowHint(false);
    setMessages((m) => [...m, { from: "me", text: q }]);
    setTyping(true);
    const [reply] = await Promise.all([answer(q), new Promise((r) => setTimeout(r, 550))]);
    setTyping(false);
    setMessages((m) => [...m, { from: "bot", ...reply }]);
    inputRef.current?.focus();
  }

  return (
    <>
      {open && (
        <div className="cb-panel" ref={panelRef} role="dialog" aria-label={`Chat với ${BOT_NAME}`}>
          <div className="cb-head">
            <div className="cb-avatar">🤖</div>
            <div>
              <div className="cb-title">{BOT_NAME}</div>
              <div className="cb-sub">Trả lời tự động 24/7</div>
            </div>
            <button type="button" className="cb-close" onClick={() => setOpen(false)} aria-label="Đóng chat">✕</button>
          </div>

          <div className="cb-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`cb-row ${m.from}`}>
                <div className="cb-bubble">{m.text}</div>
                {m.products?.map((p) => (
                  <Link key={p.id} to={`/san-pham/${p.id}`} className="cb-prod">
                    <span className="cb-prod-img">
                      {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : <span style={{ fontSize: 26, display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}>🎮</span>}
                    </span>
                    <span>
                      <span className="cb-prod-name">{p.name}</span>
                      <div className="cb-prod-price">
                        {formatVND(p.finalPrice)}
                        {p.discountPercent > 0 && <s>{formatVND(p.price)}</s>}
                      </div>
                    </span>
                  </Link>
                ))}
                {(m.links?.length > 0 || m.zalo) && (
                  <div className="cb-links">
                    {m.links?.map((l) => (
                      <Link key={l.to + l.label} to={l.to} className="cb-link">{l.label}</Link>
                    ))}
                    {m.zalo && (
                      <a className="cb-link zalo" href={`https://zalo.me/${ZALO_PHONE}`} target="_blank" rel="noopener noreferrer">Chat Zalo với nhân viên</a>
                    )}
                  </div>
                )}
              </div>
            ))}
            {typing && <div className="cb-typing"><i /><i /><i /></div>}
          </div>

          <div className="cb-chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="cb-chip" onClick={() => send(s)} disabled={typing}>{s}</button>
            ))}
          </div>

          <div className="cb-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Nhập câu hỏi của bạn…"
              aria-label="Nhập câu hỏi"
            />
            <button type="button" onClick={() => send()} disabled={!input.trim() || typing} aria-label="Gửi">➤</button>
          </div>
        </div>
      )}

      {!open && showHint && <div className="cb-hint">Cần tư vấn? Hỏi mình nhé 👋</div>}
      <button type="button" className="cb-fab" onClick={() => setOpen((v) => !v)} aria-label={open ? "Đóng chat" : "Mở chat tư vấn"} title="Chat tư vấn tự động">
        {open ? "✕" : "💬"}
        {!open && <span className="cb-dot" />}
      </button>
    </>
  );
}
