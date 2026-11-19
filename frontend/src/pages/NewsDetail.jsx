import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import NewsCover from "../components/NewsCover";

export default function NewsDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    setPost(null);
    api.get(`/news/${id}`).then(({ data }) => setPost(data)).catch(() => setPost(false));
    window.scrollTo(0, 0);
  }, [id]);

  if (post === null) return <div className="page container center muted">Đang tải…</div>;
  if (post === false) return <div className="page container center muted">Không tìm thấy bài viết.</div>;

  return (
    <div className="page container">
      <div className="breadcrumb"><Link to="/tin-tuc">Tin tức - Review</Link> / {post.title}</div>
      <div className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
        <div className="news-card" style={{ boxShadow: "none" }}>
          <NewsCover post={post} style={{ height: 220, borderRadius: 10 }} />
        </div>
        <h1 className="mt-16" style={{ fontSize: 22 }}>{post.title}</h1>
        <p className="muted">{post.author} • {post.createdAt}</p>
        <p className="mt-16" style={{ lineHeight: 1.7 }}>{post.content}</p>
      </div>
    </div>
  );
}
