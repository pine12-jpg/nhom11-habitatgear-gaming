/** Ảnh bìa bài viết — dùng ảnh (SVG/URL) thay cho icon emoji */
export const NEWS_COVERS = [
  { src: "/news/news-gpu-compare.svg", label: "Card đồ họa" },
  { src: "/news/news-keyboard-review.svg", label: "Bàn phím" },
  { src: "/news/news-monitor-guide.svg", label: "Màn hình" },
  { src: "/news/news-default.svg", label: "Mặc định" },
];

export default function NewsCover({ post, style }) {
  const src = post?.coverImage || "/news/news-default.svg";
  return (
    <div className="cover" style={style}>
      <img src={src} alt={post?.title || "Ảnh bìa"} loading="lazy" onError={(e) => { e.currentTarget.src = "/news/news-default.svg"; }} />
    </div>
  );
}
