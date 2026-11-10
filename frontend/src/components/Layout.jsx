import Header from "./Header";
import Footer from "./Footer";
import CompareBar from "./CompareBar";
import SetupFab from "./SetupFab";
import ZaloFab from "./ZaloFab";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CompareBar />
      {/* Cụm nút tròn nổi ở mép phải: Zalo (trên) + Dựng setup (dưới) */}
      <div className="fab-stack">
        <ZaloFab />
        <SetupFab />
      </div>
    </>
  );
}
