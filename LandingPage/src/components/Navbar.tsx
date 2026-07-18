import { useState, useEffect } from "react";
import { RELEASES_URL } from "../config/downloads";

const links = [
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Changelog", href: "#changelog" },
  { label: "Versions", href: RELEASES_URL, external: true },
  { label: "Download", href: "#download" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.06]" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relay-500 rounded-lg" aria-label="Relay home">
          <div className="size-7 rounded-lg bg-gradient-to-br from-relay-500 to-purple-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">Relay</span>
        </a>

        <div className="hidden sm:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...("external" in link && link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-sm text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relay-500 rounded"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#download"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-relay-500 hover:bg-relay-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relay-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b]"
          >
            Get Relay
          </a>
        </div>

        <a
          href="#download"
          className="sm:hidden text-sm font-medium px-3 py-1.5 rounded-lg bg-relay-500 hover:bg-relay-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relay-500"
        >
          Get Relay
        </a>
      </div>
    </nav>
  );
}
