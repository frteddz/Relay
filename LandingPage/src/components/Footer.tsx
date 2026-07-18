export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-lg bg-gradient-to-br from-relay-500 to-purple-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="font-semibold text-sm">Relay</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-zinc-300 transition-colors">GitHub</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">License</a>
            <span>v0.1.0</span>
          </div>

          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Relay Contributors &middot; MIT License
          </p>
        </div>
      </div>
    </footer>
  );
}
