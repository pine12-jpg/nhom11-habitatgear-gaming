import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * HeroCarousel — khu vực banner đầu trang chủ, bố cục mô phỏng GEARVN:
 *  - bên trái: banner chính xoay tự động (tiêu đề lớn, khung nhấn mạnh, khung quà tặng)
 *  - bên phải: 2 banner phụ xếp dọc
 * Toàn bộ nội dung do nhóm tự thiết kế bằng CSS (gradient + hoa văn + chữ),
 * KHÔNG dùng icon/emoji. Hình minh họa (public/banners/*.svg) là ảnh vector nhóm tự vẽ,
 * không dùng ảnh banner/sản phẩm thật của GearVN hay hãng nào.
 */
const SLIDES = [
  {
    key: "blackfriday",
    image: "/banners/hero-laptop.svg",
    eyebrow: "Pre - Black Friday",
    date: "17.11 - 23.11.2026",
    title: ["Săn Deal Sớm,", "Laptop Gaming Giảm Đến 15%"],
    highlight: { label: "Ưu đãi đặc biệt", text: "Trả góp 0% lãi suất", value: "Trả trước từ 0đ" },
    perksTitle: "Cùng nhiều phần quà khác",
    perks: ["Chuột gaming", "Balo laptop", "Tai nghe", "Lót chuột"],
    link: "/san-pham?category=laptop-gaming",
    theme: "red",
  },
  {
    key: "pc",
    image: "/banners/hero-pc.svg",
    eyebrow: "PC Gaming build sẵn",
    date: "Tối ưu tản nhiệt",
    title: ["Chiến Mọi Tựa Game", "Ở Mọi Mức Giá"],
    highlight: { label: "Tư vấn miễn phí", text: "Build PC theo ngân sách", value: "Lắp ráp trong 24h" },
    perksTitle: "Cấu hình nổi bật",
    perks: ["Intel Core i5/i7", "RTX 4060 / 4070", "RAM DDR5", "SSD NVMe"],
    link: "/san-pham?category=pc-gaming",
    theme: "blue",
  },
  {
    key: "gear",
    image: "/banners/hero-gear.svg",
    eyebrow: "Combo Gaming Gear",
    date: "Mua combo tiết kiệm hơn",
    title: ["Nâng Cấp Dàn Setup:", "Phím - Chuột - Tai Nghe"],
    highlight: { label: "Thương hiệu", text: "Logitech G, Razer, SteelSeries", value: "Corsair, AKKO" },
    perksTitle: "Danh mục gear",
    perks: ["Bàn phím cơ", "Chuột gaming", "Tai nghe", "Màn hình"],
    link: "/san-pham?category=ban-phim",
    theme: "purple",
  },
  {
    key: "tradein",
    image: "/banners/hero-tradein.svg",
    eyebrow: "Thu cũ - Đổi mới",
    date: "Định giá trong 24h",
    title: ["Lên Đời Máy Mới,", "Trừ Thẳng Tiền Máy Cũ"],
    highlight: { label: "Áp dụng khi mua", text: "Laptop / PC Gaming mới", value: "Trừ trực tiếp hóa đơn" },
    perksTitle: "Quy trình 3 bước",
    perks: ["Gửi thông tin máy", "Nhận báo giá", "Đổi máy mới"],
    link: "/thu-cu-doi-moi",
    theme: "green",
  },
];

const SIDE_BANNERS = [
  {
    key: "acer",
    title: "Sắm Laptop Gaming chỉ từ 17 triệu",
    link: "/san-pham?category=laptop-gaming",
    theme: "red",
    items: [
      { name: "Laptop ASUS TUF / ROG", sub: "Giảm thêm", value: "1.000.000đ", img: "/banners/thumb-laptop-red.svg" },
      { name: "Laptop MSI / Acer Gaming", sub: "Combo quà đến", value: "3 triệu", img: "/banners/thumb-laptop-blue.svg" },
    ],
  },
  {
    key: "gear",
    title: "Gaming Gear giảm sâu cuối tuần",
    link: "/san-pham?sale=1",
    theme: "dark",
    items: [
      { name: "Bàn phím cơ, chuột", sub: "Giảm đến", value: "15%", img: "/banners/thumb-keyboard.svg" },
      { name: "Tai nghe gaming", sub: "Trả góp", value: "0%", img: "/banners/thumb-headset.svg" },
    ],
  },
];

const AUTOPLAY_MS = 5000;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <div className="hero-layout">
      <section
        className={`hero-carousel theme-${slide.theme}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button
          className="hero-arrow left"
          aria-label="Banner trước"
          onClick={() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        >
          ‹
        </button>

        <div className="hero-slide" key={slide.key} onClick={() => navigate(slide.link)}>
          <div className="hero-main">
            <div className="hero-eyebrow">
              <strong>{slide.eyebrow}</strong>
              <i aria-hidden="true" />
              <span>{slide.date}</span>
            </div>
            <h1>
              {slide.title[0]}
              <br />
              {slide.title[1]}
            </h1>
            <div className="hero-highlight">
              <small>{slide.highlight.label}</small>
              <span>{slide.highlight.text}</span>
              <b>{slide.highlight.value}</b>
            </div>
            <div className="hero-perks">
              <span className="hero-perks-title">{slide.perksTitle}:</span>
              {slide.perks.map((p) => (
                <span key={p} className="hero-chip">{p}</span>
              ))}
            </div>
          </div>

          <div className="hero-art">
            <img src={slide.image} alt="" draggable="false" />
          </div>
        </div>

        <button
          className="hero-arrow right"
          aria-label="Banner tiếp theo"
          onClick={() => setIndex((i) => (i + 1) % SLIDES.length)}
        >
          ›
        </button>

        <div className="hero-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              className={i === index ? "active" : ""}
              aria-label={`Xem banner ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </section>

      <div className="hero-side">
        {SIDE_BANNERS.map((b) => (
          <Link key={b.key} to={b.link} className={`side-banner theme-${b.theme}`}>
            <h3>{b.title}</h3>
            <div className="side-banner-items">
              {b.items.map((it) => (
                <div key={it.name} className="side-banner-item">
                  <div className="side-banner-info">
                    <span className="name">{it.name}</span>
                    <span className="sub">{it.sub}</span>
                    <b>{it.value}</b>
                  </div>
                  <img src={it.img} alt="" draggable="false" />
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
