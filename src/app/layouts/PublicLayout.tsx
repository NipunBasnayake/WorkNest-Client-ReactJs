import { Outlet, useParams } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { NetworkStatusBanner } from "@/components/common/NetworkStatusBanner";
import { BrandingProvider } from "@/features/branding/BrandingProvider";

export function PublicLayout() {
  const { tenantSlug } = useParams();
  return (
    <BrandingProvider mode={tenantSlug ? "public" : "default"} tenantSlug={tenantSlug}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-16">
          <NetworkStatusBanner />
          <Outlet />
        </main>
        <Footer />
      </div>
    </BrandingProvider>
  );
}
