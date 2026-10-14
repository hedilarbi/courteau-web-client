import Footer from "@/components/Footer";
import Header from "@/components/Header";
import EmailVerificationModal from "@/components/EmailVerificationModal";

export default function RootLayout({ children }) {
  return (
    <main>
      <Header />
      <div className="pt-8 md:pt-9">{children}</div>
      <Footer />
      <EmailVerificationModal />
    </main>
  );
}
