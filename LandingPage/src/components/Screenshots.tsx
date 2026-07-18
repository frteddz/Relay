import Screenshot from "./Screenshot";

const items = [
  { label: "Dashboard", src: "screenshots/dashboard.png" },
  { label: "Devices", src: "screenshots/devices.png" },
  { label: "Clipboard", src: "screenshots/clipboard.png" },
  { label: "Transfers", src: "screenshots/transfers.png" },
];

export default function Screenshots() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            See it in action
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            A clean, modern interface designed for productivity.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {items.map((item) => (
            <Screenshot key={item.label} src={item.src} label={item.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
