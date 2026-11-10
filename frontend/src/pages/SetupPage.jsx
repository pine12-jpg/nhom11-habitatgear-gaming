import { Link } from "react-router-dom";
import SetupBuilder from "../components/SetupBuilder";

/** Trang /dung-setup — khách vào từ nút tròn nổi để tự dựng góc setup */
export default function SetupPage() {
  return (
    <div className="page container">
      <div className="breadcrumb">
        <Link to="/">Trang chủ</Link> › Dựng góc setup
      </div>
      <SetupBuilder />
    </div>
  );
}
