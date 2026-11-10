import Header from "./Header";
import Footer from "./Footer";
import CompareBar from "./CompareBar";
import SetupFab from "./SetupFab";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CompareBar />
      <SetupFab />
    </>
  );
}
