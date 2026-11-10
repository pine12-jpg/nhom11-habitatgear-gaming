import Header from "./Header";
import Footer from "./Footer";
import CompareBar from "./CompareBar";
import SetupBuilder from "./SetupBuilder";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CompareBar />
      <SetupBuilder />
    </>
  );
}
