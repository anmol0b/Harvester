import type { Metadata } from "next";
import "./globals.css";
import WalletProviderWrapper from "@/components/WalletProvider";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "HARVESTER — RWA Yield Protocol",
  description: "Real World Asset yield farming on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProviderWrapper>
          <Navbar />
          <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
            {children}
          </main>
        </WalletProviderWrapper>
      </body>
    </html>
  );
}