export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-b from-relay-500/[0.08] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-relay-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-zinc-400 mb-8">
          <span className="size-2 rounded-full bg-green-400 animate-pulse" />
          v0.1.0 — Local-first device hub
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
          Your devices,{" "}
          <span className="text-gradient">connected.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Relay is a privacy-first, open-source hub that connects your devices
          over your local network. No cloud, no accounts — just fast, secure
          communication between machines you own.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#download"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-relay-500 hover:bg-relay-600 font-medium text-base transition-all duration-200 hover:scale-[1.02]"
          >
            Download Relay
          </a>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass glass-hover font-medium text-base transition-all duration-200"
          >
            Learn more
          </a>
        </div>

        <div className="mt-16 sm:mt-24 relative">
          <div className="glass rounded-2xl p-2 glow">
            <div className="rounded-xl bg-gradient-to-b from-[#121214] to-[#0a0a0b] border border-white/[0.06] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="size-2.5 rounded-full bg-red-500/80" />
                <span className="size-2.5 rounded-full bg-yellow-500/80" />
                <span className="size-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-zinc-500">Relay</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
                <div className="flex items-center gap-12 sm:gap-20">
                  <div className="flex flex-col items-center gap-2 animate-float" style={{ animationDelay: "0s" }}>
                    <div className="size-12 sm:size-16 rounded-2xl bg-gradient-to-br from-relay-400 to-relay-600 flex items-center justify-center shadow-lg shadow-relay-500/20">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>
                    </div>
                    <span className="text-xs text-zinc-400">Desktop</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 animate-float" style={{ animationDelay: "1s" }}>
                    <div className="size-12 sm:size-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
                    </div>
                    <span className="text-xs text-zinc-400">Phone</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 animate-float" style={{ animationDelay: "2s" }}>
                    <div className="size-12 sm:size-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </div>
                    <span className="text-xs text-zinc-400">Web</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
