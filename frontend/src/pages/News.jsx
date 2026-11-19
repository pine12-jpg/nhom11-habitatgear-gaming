import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import NewsCover from "../components/NewsCover";

/** US28 — Đọc tin tức công nghệ, đánh giá, so sánh sản phẩm gaming */
export default function News() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    api.get("/news").then(({ data }) => setPosts(data));
  }, []);

  return (
    <div className="page container">
      <h1 style={{ fontSize: 21 }}>📰 Tin tức - Review</h1>
      <p className="muted">Tổng hợp bài viết giới thiệu, đánh giá và so sánh sản phẩm gaming mới nhất.</p>

      {!posts ? (
        <div className="center muted mt-24">Đang tải…</div>
      ) : (
        <div className="news-grid mt-16">
          {posts.map((n) => (
            <Link key={n.id} to={`/tin-tuc/${n.id}`} className="news-card">
              <NewsCover post={n} />
              <div className="body">
                <div className="meta">{n.author} • {n.createdAt}</div>
                <h3>{n.title}</h3>
                <p className="muted" style={{ fontSize: 12.5 }}>{n.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
