require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const morgan = require("morgan");

const { ensureSeeded } = require("./src/seed");
ensureSeeded(); // tạo data/db.json với dữ liệu mẫu nếu chưa tồn tại

const authRoutes = require("./src/routes/auth");
const catalogRoutes = require("./src/routes/catalog");
const orderRoutes = require("./src/routes/orders");
const contentRoutes = require("./src/routes/content");
const adminRoutes = require("./src/routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, name: "GVN Gaming API", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api", catalogRoutes); // /categories, /brands, /home, /products...
app.use("/api", orderRoutes); // /orders, /shipping-methods, /vouchers/validate
app.use("/api", contentRoutes); // /news, /showrooms, /tradein
app.use("/api/admin", adminRoutes);
// ---- Swagger API docs ----
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// 404 cho các route /api không tồn tại
app.use("/api", (req, res) => res.status(404).json({ message: "Không tìm thấy API endpoint." }));

// ---- Phục vụ giao diện React đã build (dùng khi deploy lên web) ----
// Khi chạy `npm run build` ở thư mục gốc, frontend/dist sẽ được Express phục vụ luôn,
// nên chỉ cần 1 địa chỉ web duy nhất cho cả giao diện lẫn API.
const distDir = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // React Router dùng BrowserRouter => mọi đường dẫn không phải /api đều trả về index.html
  app.get("*", (req, res) => res.sendFile(path.join(distDir, "index.html")));
}

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Đã có lỗi xảy ra ở server. Vui lòng thử lại." });
});

const { init: initDB } = require("./src/db");
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🎮 GVN Gaming API đang chạy tại http://localhost:${PORT}`);
      console.log(`   Tài khoản admin demo: admin@gvngaming.vn / Admin@123`);
      console.log(`   Tài khoản khách demo: khach@example.com / Khach@123\n`);
    });
  })
  .catch((err) => {
    console.error("Không khởi động được cơ sở dữ liệu:", err);
    process.exit(1);
  });
