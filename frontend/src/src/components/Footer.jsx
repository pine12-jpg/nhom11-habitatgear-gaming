import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>GVN GAMING</h4>
            <p>Website bán thiết bị gaming (laptop gaming, PC gaming, gaming gear) theo phong cách nền tảng GEARVN.</p>
            <p>Đồ án môn Công Nghệ Phần Mềm Nâng Cao — Nhóm 11.</p>
          </div>
          <div>
            <h4>Về chúng tôi</h4>
            <ul>
              <li><Link to="/gioi-thieu">Giới thiệu cửa hàng</Link></li>
              <li><Link to="/showroom">Hệ thống showroom</Link></li>
              <li><Link to="/tin-tuc">Tin tức - Review</Link></li>
              <li><Link to="/thu-cu-doi-moi">Thu cũ - Đổi mới</Link></li>
              <li><Link to="/kiem-tra-gear">🧪 Kiểm tra bàn phím - chuột</Link></li>
            </ul>
          </div>
          <div>
            <h4>Chính sách</h4>
            <ul>
              <li><Link to="/bao-hanh">Chính sách bảo hành</Link></li>
              <li><Link to="/doi-tra">Chính sách đổi trả</Link></li>
              <li><Link to="/huong-dan">Hướng dẫn mua hàng & thanh toán</Link></li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul>
              <li>Hotline: 1900 5301</li>
              <li>Email: cskh@gvngaming.vn</li>
              <li>Giờ làm việc: 8:30 - 21:30 (T2 - CN)</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 GVN Gaming — Đồ án minh họa, không phải website thương mại thật.
        </div>
      </div>
    </footer>
  );
}
