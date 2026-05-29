"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/positions", label: "Positions" },
  { href: "/history", label: "History" },
  { href: "/discover", label: "Discover" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      padding: "0 1.5rem",
      height: "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "#0a0800",
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <span style={{
          fontFamily: "Playfair Display, serif",
          color: "var(--gold-light)",
          fontSize: "1.1rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}>
          HARVESTER
        </span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: "flex", gap: "0.25rem" }}>
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            padding: "0.375rem 0.75rem",
            fontSize: "0.65rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textDecoration: "none",
            color: pathname === href ? "var(--gold-light)" : "var(--text-dim)",
            borderBottom: pathname === href ? "1px solid var(--gold)" : "1px solid transparent",
            transition: "color 0.2s",
          }}>
            {label}
          </Link>
        ))}
      </nav>

      {/* Wallet */}
      <WalletMultiButton />
    </header>
  );
}