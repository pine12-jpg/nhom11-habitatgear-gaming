import Header from "./Header";
import Footer from "./Footer";
import CompareBar from "./CompareBar";
import FabMenu from "./FabMenu";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CompareBar />
      <FabMenu />
    </>
  );
}
