/**
 * Epic "Quản trị" + phần admin của "Thu cũ - Đổi mới" và "Tin tức - Review"
 * US24, US29, US31, US32, US33, US34, US35, US36, US37
 * Toàn bộ route trong file này yêu cầu đăng nhập admin.
 */
const express = require("express");
const { collection, saveCollection, nextId } = require("../db");
const { authRequired, adminRequired } = require("../middleware/auth");
const { auditLog, publicUser } = require("../helpers");
const { decorate } = require("./catalog");

const router = express.Router();
router.use(authRequired, adminRequired);

const ORDER_STATUSES = ["processing", "shipping", "delivered", "cancelled"];

/* ============ US31 — Quản lý sản phẩm ============ */
router.get("/products", (req, res) => {
  const brands = collection("brands");
  const categories = collection("categories");
  const reviews = collection("reviews");
  res.json(collection("products").map((p) => decorate(p, brands, categories, reviews)).sort((a, b) => b.id - a.id));
});

function validateProduct(body) {
  const b = body || {};
  if (!b.name || !b.name.trim()) return "Tên sản phẩm không được để trống.";
  if (!collection("brands").some((x) => x.id === Number(b.brand))) return "Hãng sản xuất không hợp lệ.";
  if (!collection("categories").some((x) => x.id === Number(b.category))) return "Ngành hàng không hợp lệ.";
  if (!(Number(b.price) > 0)) return "Giá bán phải lớn hơn 0.";
  if (b.salePrice && !(Number(b.salePrice) > 0 && Number(b.salePrice) < Number(b.price))) return "Giá khuyến mãi phải nhỏ hơn giá gốc.";
  if (!(Number(b.stock) >= 0)) return "Số lượng tồn kho không hợp lệ.";
  return null;
}

function pickProduct(b) {
  return {
    name: b.name.trim(),
    brand: Number(b.brand),
    category: Number(b.category),
    price: Number(b.price),
    salePrice: b.salePrice ? Number(b.salePrice) : null,
    image: (b.image || "").trim(), // đường dẫn ảnh thật, vd: /products/ten-file.jpg (để trống sẽ dùng hình minh họa mặc định)
    cpu: b.cpu || "—",
    gpu: b.gpu || "—",
    ram: b.ram || "—",
    storage: b.storage || "—",
    screen: b.screen || "—",
    description: b.description || "",
    stock: Math.floor(Number(b.stock)),
    featured: !!b.featured,
  };
}

router.post("/products", (req, res) => {
  const err = validateProduct(req.body);
  if (err) return res.status(400).json({ message: err });
  const products = collection("products");
  const product = { id: nextId("products"), ...pickProduct(req.body), createdAt: new Date().toISOString() };
  products.push(product);
  saveCollection("products", products);
  auditLog(req.user, "Thêm sản phẩm", `#${product.id} ${product.name}`);
  res.status(201).json(product);
});

router.put("/products/:id", (req, res) => {
  const err = validateProduct(req.body);
  if (err) return res.status(400).json({ message: err });
  const products = collection("products");
  const idx = products.findIndex((p) => p.id === Number(req.params.id));
  if (idx < 0) return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
  products[idx] = { ...products[idx], ...pickProduct(req.body) };
  saveCollection("products", products);
  auditLog(req.user, "Sửa sản phẩm", `#${products[idx].id} ${products[idx].name}`);
  res.json(products[idx]);
});

router.delete("/products/:id", (req, res) => {
  const products = collection("products");
  const p = products.find((x) => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
  saveCollection("products", products.filter((x) => x.id !== p.id));
  auditLog(req.user, "Xóa sản phẩm", `#${p.id} ${p.name}`);
  res.json({ message: "Đã xóa sản phẩm." });
});

/* ============ US34 — Quản lý tồn kho ============ */
router.put("/products/:id/stock", (req, res) => {
  const stock = Number(req.body?.stock);
  if (!Number.isInteger(stock) || stock < 0) return res.status(400).json({ message: "Số lượng tồn kho không hợp lệ." });
  const products = collection("products");
  const p = products.find((x) => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ message: "Không tìm thấy sản phẩm." });
  const old = p.stock;
  p.stock = stock;
  saveCollection("products", products);
  auditLog(req.user, "Cập nhật tồn kho", `#${p.id} ${p.name}`, `${old} → ${stock}`);
  res.json(p);
});

/* ============ US32 — Quản lý danh mục hãng ============ */
router.get("/brands", (req, res) => {
  const products = collection("products");
  res.json(collection("brands").map((b) => ({ ...b, productCount: products.filter((p) => p.brand === b.id).length })));
});

router.post("/brands", (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ message: "Tên hãng không được để trống." });
  const brands = collection("brands");
  if (brands.some((b) => b.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ message: "Hãng này đã tồn tại." });
  const brand = { id: (brands.reduce((m, b) => Math.max(m, b.id), 0)) + 1, name };
  brands.push(brand);
  saveCollection("brands", brands);
  auditLog(req.user, "Thêm hãng", name);
  res.status(201).json(brand);
});

router.put("/brands/:id", (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ message: "Tên hãng không được để trống." });
  const brands = collection("brands");
  const b = brands.find((x) => x.id === Number(req.params.id));
  if (!b) return res.status(404).json({ message: "Không tìm thấy hãng." });
  if (brands.some((x) => x.id !== b.id && x.name.toLowerCase() === name.toLowerCase())) return res.status(409).json({ message: "Tên hãng đã tồn tại." });
  const old = b.name;
  b.name = name;
  saveCollection("brands", brands);
  auditLog(req.user, "Sửa hãng", `${old} → ${name}`);
  res.json(b);
});

router.delete("/brands/:id", (req, res) => {
  const brands = collection("brands");
  const b = brands.find((x) => x.id === Number(req.params.id));
  if (!b) return res.status(404).json({ message: "Không tìm thấy hãng." });
  if (collection("products").some((p) => p.brand === b.id))
    return res.status(400).json({ message: "Không thể xóa hãng đang có sản phẩm. Hãy chuyển/xóa sản phẩm trước." });
  saveCollection("brands", brands.filter((x) => x.id !== b.id));
  auditLog(req.user, "Xóa hãng", b.name);
  res.json({ message: "Đã xóa hãng." });
});

/* ============ US33 — Quản lý đơn hàng ============ */
router.get("/orders", (req, res) => {
  const users = collection("users");
  const items = collection("order_items");
  const { status } = req.query;
  let list = collection("orders");
  if (status) list = list.filter((o) => o.status === status);
  res.json(
    list
      .sort((a, b) => b.id - a.id)
      .map((o) => ({
        ...o,
        customerName: users.find((u) => u.id === o.userId)?.name || o.shipping?.name,
        items: items.filter((i) => i.orderId === o.id),
      }))
  );
});

router.put("/orders/:id/status", (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ message: "Trạng thái không hợp lệ." });
  const orders = collection("orders");
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
  if (order.status === "cancelled") return res.status(400).json({ message: "Đơn hàng đã hủy, không thể đổi trạng thái." });
  if (order.status === "delivered" && status !== "delivered") return res.status(400).json({ message: "Đơn hàng đã giao, không thể đổi trạng thái." });

  const old = order.status;
  order.status = status;

  // Admin hủy đơn -> hoàn kho
  if (status === "cancelled") {
    const products = collection("products");
    collection("order_items").filter((i) => i.orderId === order.id).forEach((i) => {
      const p = products.find((x) => x.id === i.productId);
      if (p) p.stock += i.quantity;
    });
    saveCollection("products", products);
  }
  // Giao thành công: COD coi như đã thu tiền
  if (status === "delivered" && order.paymentMethod === "cod") order.paymentStatus = "paid";
  saveCollection("orders", orders);
  auditLog(req.user, "Cập nhật trạng thái đơn hàng", order.code, `${old} → ${status}`);
  res.json(order);
});

router.put("/orders/:id/payment", (req, res) => {
  const orders = collection("orders");
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
  order.paymentStatus = req.body?.paymentStatus === "paid" ? "paid" : "pending";
  saveCollection("orders", orders);
  auditLog(req.user, "Xác nhận thanh toán", order.code, order.paymentStatus);
  res.json(order);
});

/* ============ US36 — Quản lý tài khoản khách hàng ============ */
router.get("/users", (req, res) => {
  const orders = collection("orders");
  res.json(
    collection("users").map((u) => ({
      ...publicUser(u),
      orderCount: orders.filter((o) => o.userId === u.id).length,
    }))
  );
});

router.put("/users/:id/lock", (req, res) => {
  const users = collection("users");
  const u = users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ message: "Không tìm thấy tài khoản." });
  if (u.role === "admin") return res.status(400).json({ message: "Không thể khóa tài khoản quản trị viên." });
  const wantLock = !!req.body?.locked;
  let detail = "";
  if (wantLock) {
    // days > 0: khóa tạm thời N ngày; để trống / 0: khóa vĩnh viễn
    const days = Math.round(Number(req.body?.days));
    u.locked = true;
    u.lockedUntil = Number.isFinite(days) && days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null;
    u.lockReason = String(req.body?.reason || "").trim().slice(0, 300);
    detail = (u.lockedUntil ? `${days} ngày` : "vĩnh viễn") + (u.lockReason ? ` — Lý do: ${u.lockReason}` : "");
  } else {
    u.locked = false;
    delete u.lockedUntil;
    delete u.lockReason;
  }
  saveCollection("users", users);
  auditLog(req.user, wantLock ? "Khóa tài khoản" : "Mở khóa tài khoản", `#${u.id} ${u.name}`, detail);
  res.json(publicUser(u));
});

/* ============ US35 — Thống kê doanh thu theo ngày / tháng ============ */
router.get("/stats", (req, res) => {
  const range = req.query.range === "month" ? "month" : "day";
  const valid = collection("orders").filter((o) => o.status !== "cancelled");

  const series = [];
  const now = new Date();
  if (range === "day") {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const list = valid.filter((o) => o.createdAt.slice(0, 10) === key);
      series.push({ label: key.slice(8, 10) + "/" + key.slice(5, 7), revenue: list.reduce((s, o) => s + o.total, 0), orders: list.length });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const list = valid.filter((o) => o.createdAt.slice(0, 7) === key);
      series.push({ label: String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(), revenue: list.reduce((s, o) => s + o.total, 0), orders: list.length });
    }
  }

  // Sản phẩm bán chạy
  const validIds = valid.map((o) => o.id);
  const sold = {};
  collection("order_items").filter((i) => validIds.includes(i.orderId)).forEach((i) => {
    sold[i.productId] = sold[i.productId] || { productId: i.productId, name: i.name, quantity: 0, revenue: 0 };
    sold[i.productId].quantity += i.quantity;
    sold[i.productId].revenue += i.price * i.quantity;
  });

  const products = collection("products");
  const allOrders = collection("orders");
  res.json({
    range,
    series,
    totals: {
      revenue: valid.reduce((s, o) => s + o.total, 0),
      orders: allOrders.length,
      pendingOrders: allOrders.filter((o) => o.status === "processing").length,
      customers: collection("users").filter((u) => u.role === "customer").length,
      products: products.length,
    },
    topProducts: Object.values(sold).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    lowStock: products.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock).map((p) => ({ id: p.id, name: p.name, stock: p.stock })),
  });
});

/* ============ US29 — Quản lý tin tức / review ============ */
function validateNews(b) {
  if (!b?.title?.trim()) return "Tiêu đề không được để trống.";
  if (!b?.content?.trim() || b.content.trim().length < 20) return "Nội dung cần ít nhất 20 ký tự.";
  return null;
}

router.post("/news", (req, res) => {
  const err = validateNews(req.body);
  if (err) return res.status(400).json({ message: err });
  const list = collection("news");
  const post = {
    id: nextId("news"),
    title: req.body.title.trim(),
    summary: (req.body.summary || req.body.content.trim().slice(0, 120)).trim(),
    content: req.body.content.trim(),
    coverImage: req.body.coverImage || "/news/news-default.svg",
    author: req.user.name,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  list.push(post);
  saveCollection("news", list);
  auditLog(req.user, "Đăng bài viết", post.title);
  res.status(201).json(post);
});

router.put("/news/:id", (req, res) => {
  const err = validateNews(req.body);
  if (err) return res.status(400).json({ message: err });
  const list = collection("news");
  const post = list.find((n) => n.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết." });
  post.title = req.body.title.trim();
  post.content = req.body.content.trim();
  post.summary = (req.body.summary || post.content.slice(0, 120)).trim();
  post.coverImage = req.body.coverImage || post.coverImage || "/news/news-default.svg";
  saveCollection("news", list);
  auditLog(req.user, "Sửa bài viết", post.title);
  res.json(post);
});

router.delete("/news/:id", (req, res) => {
  const list = collection("news");
  const post = list.find((n) => n.id === Number(req.params.id));
  if (!post) return res.status(404).json({ message: "Không tìm thấy bài viết." });
  saveCollection("news", list.filter((n) => n.id !== post.id));
  auditLog(req.user, "Xóa bài viết", post.title);
  res.json({ message: "Đã xóa bài viết." });
});

/* ============ US24 — Duyệt & báo giá thu cũ đổi mới ============ */
router.get("/tradein", (req, res) => {
  res.json([...collection("tradein_requests")].sort((a, b) => b.id - a.id));
});

router.put("/tradein/:id", (req, res) => {
  const { status, offeredPrice, adminNote } = req.body || {};
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Trạng thái không hợp lệ." });
  if (status === "approved" && !(Number(offeredPrice) > 0)) return res.status(400).json({ message: "Vui lòng nhập giá thu mua lớn hơn 0." });
  const list = collection("tradein_requests");
  const t = list.find((x) => x.id === Number(req.params.id));
  if (!t) return res.status(404).json({ message: "Không tìm thấy yêu cầu." });
  if (t.used) return res.status(400).json({ message: "Yêu cầu này đã được khách dùng cho đơn hàng." });
  t.status = status;
  t.offeredPrice = status === "approved" ? Math.floor(Number(offeredPrice)) : 0;
  t.adminNote = adminNote || "";
  t.reviewedAt = new Date().toISOString();
  saveCollection("tradein_requests", list);
  auditLog(req.user, status === "approved" ? "Duyệt thu cũ đổi mới" : "Từ chối thu cũ đổi mới", `#${t.id} ${t.model}`, status === "approved" ? `${t.offeredPrice}đ` : "");
  res.json(t);
});

/* ============ US37 — Xem nhật ký thao tác ============ */
router.get("/logs", (req, res) => {
  res.json(collection("audit_logs").slice(0, 200));
});

router.get("/mail-outbox", (req, res) => {
  res.json(collection("mail_outbox").slice(0, 50));
});

module.exports = router;
