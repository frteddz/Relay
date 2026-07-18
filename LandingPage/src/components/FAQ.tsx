import { useState } from "react";

const faqs = [
  {
    q: "What is Relay?",
    a: "Relay is a local-first device hub that lets you share clipboard text and files between your devices over your own network. It is open-source, privacy-focused, and requires no cloud infrastructure or user accounts.",
  },
  {
    q: "How does Relay communicate between devices?",
    a: "Relay uses UDP multicast for local network discovery and direct TCP connections for file transfers. Devices find each other automatically when they are on the same network — no IP addresses or configuration required.",
  },
  {
    q: "Is my data sent over the internet?",
    a: "No. Relay is designed to work entirely on your local network. Clipboard text and files are transferred directly between your devices using peer-to-peer connections. Nothing ever leaves your home or office network.",
  },
  {
    q: "Which platforms are supported?",
    a: "Relay currently supports Windows 10/11 (x64) and Linux (.deb). macOS support is planned for a future release.",
  },
  {
    q: "Is Relay free?",
    a: "Yes, Relay is completely free and open-source under the MIT license. You can use it indefinitely without any restrictions, subscriptions, or hidden costs.",
  },
  {
    q: "How do I pair devices?",
    a: "Install Relay on both devices, open the app, and initiate pairing from one device. The other device will receive a notification. Accept the request, and the devices are securely paired. Once trusted, they will automatically connect when online.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 sm:py-32 border-t border-white/[0.06]">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Everything you need to know about Relay.
          </p>
        </div>

        <div className="mt-16 space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-answer-${i}`}
                className="w-full flex items-center justify-between px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-relay-500"
              >
                <span className="font-medium text-sm sm:text-base pr-4">{faq.q}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-zinc-500 shrink-0 transition-transform duration-300 ${
                    open === i ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                id={`faq-answer-${i}`}
                role="region"
                className={`overflow-hidden transition-all duration-300 ${
                  open === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
