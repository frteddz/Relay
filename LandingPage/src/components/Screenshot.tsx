import { useState } from "react";

interface ScreenshotProps {
  src: string;
  label: string;
}

export default function Screenshot({ src, label }: ScreenshotProps) {
  const [failed, setFailed] = useState(false);
  const base = import.meta.env.BASE_URL ?? "/";
  const imageUrl = `${base.replace(/\/+$/, "")}${src.startsWith("/") ? "" : "/"}${src}`;

  return (
    <div className="glass rounded-2xl overflow-hidden group">
      <div className="aspect-video flex items-center justify-center bg-white/[0.02]">
        {failed ? (
          <div className="text-center px-6">
            <svg
              width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5"
              className="text-zinc-600 mx-auto mb-3"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-zinc-600 text-sm font-medium">Screenshot coming soon</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`${label} screenshot`}
            className="w-full h-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-sm text-zinc-300 font-medium">{label}</p>
      </div>
    </div>
  );
}
