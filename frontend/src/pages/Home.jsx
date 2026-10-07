import { useState, useEffect } from "react";
import HeroSection from "../components/luxury/HeroSection";
import DressShowcase from "../components/luxury/DressShowcase";
import NewArrivals from "../components/luxury/NewArrivals";
import ShopByOccasion from "../components/luxury/ShopByOccasion";
import FabricCraft from "../components/luxury/FabricCraft";
import Lookbook from "../components/luxury/Lookbook";
import Testimonials from "../components/luxury/Testimonials";
import InstagramStrip from "../components/luxury/InstagramStrip";
import NewsletterFooter from "../components/luxury/NewsletterFooter";
import CartDrawer from "../components/CartDrawer";
import SizeGuideModal from "../components/SizeGuideModal";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear";
  }, []);

  return (
    <>
      <HeroSection />
      <DressShowcase />
      <NewArrivals />
      <ShopByOccasion />
      <FabricCraft />
      <Lookbook />
      <Testimonials />
      <InstagramStrip />
      <NewsletterFooter />

      {/* Global overlays — available site-wide from the home page */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
    </>
  );
}
