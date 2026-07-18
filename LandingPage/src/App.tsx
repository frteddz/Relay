import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Overview from "./components/Overview";
import Features from "./components/Features";
import CrossPlatform from "./components/CrossPlatform";
import Screenshots from "./components/Screenshots";
import FAQ from "./components/FAQ";
import Download from "./components/Download";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <Navbar />
      <Hero />
      <Overview />
      <Features />
      <CrossPlatform />
      <Screenshots />
      <FAQ />
      <Download />
      <Footer />
    </div>
  );
}
