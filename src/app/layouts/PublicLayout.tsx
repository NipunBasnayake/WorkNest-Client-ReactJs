import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { NetworkStatusBanner } from "@/components/common/NetworkStatusBanner";

export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16">
        <NetworkStatusBanner />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
