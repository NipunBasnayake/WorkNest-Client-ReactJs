import { useEffect, type ReactNode } from "react";
import { useNetworkStore } from "@/store/networkStore";

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const setBrowserOnline = useNetworkStore((state) => state.setBrowserOnline);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => setBrowserOnline(navigator.onLine);
    sync();

    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [setBrowserOnline]);

  return <>{children}</>;
}
