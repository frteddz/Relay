import { useState, useRef, useEffect, useCallback } from "react";
import { acceptTerms } from "./termsStorage";

export function TermsPage({ onAccept }: { onAccept: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom !== scrolledToBottom) {
      setScrolledToBottom(atBottom);
    }
  }, [scrolledToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleAccept = () => {
    acceptTerms();
    onAccept();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d12] p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Please read the following agreement carefully before using Relay.
          </p>
        </div>

        <div
          ref={scrollRef}
          className="mb-6 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm leading-relaxed text-white/70 scroll-smooth"
        >
          <h2 className="mb-4 text-base font-semibold text-white/90">Terms of Use</h2>

          <p className="mb-4">
            <strong className="text-white/80">1. Acceptance of Terms.</strong> By using Relay ("the Software"),
            you agree to be bound by these terms. If you do not agree, do not install or use the Software.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">2. Description of Service.</strong> Relay is a peer-to-peer
            local network tool that enables file transfers and clipboard sharing between devices on the same
            local area network. The Software does not transmit data through external servers; all transfers
            occur directly between devices on the same network segment.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">3. User Responsibility.</strong> You are solely responsible for
            all files, text, and other content that you send or receive using the Software. You represent and
            warrant that you have the necessary rights to share any content transmitted through the Software
            and that such content does not violate any applicable law or third-party right.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">4. Acceptable Use.</strong> You agree not to use the Software to
            transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory,
            obscene, or otherwise objectionable. You must comply with all applicable local, state, national,
            and international laws in connection with your use of the Software.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">5. Privacy and Security.</strong> Clipboard content and
            transferred files may contain sensitive or personal information. You assume all responsibility
            for the information you share. You should only pair with devices that you trust. The developers
            cannot access, monitor, or retrieve any data transmitted through the Software.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">6. No Warranty.</strong> THE SOFTWARE IS PROVIDED "AS IS,"
            WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. THE ENTIRE RISK AS TO THE
            QUALITY AND PERFORMANCE OF THE SOFTWARE IS WITH YOU.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">7. Limitation of Liability.</strong> IN NO EVENT SHALL THE
            DEVELOPERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
            DAMAGES (INCLUDING, BUT NOT LIMITED TO, DATA LOSS, DATA CORRUPTION, MISUSE OF THE SOFTWARE, OR
            DAMAGES RESULTING FROM USE OF THE SOFTWARE) ARISING OUT OF OR IN CONNECTION WITH THE USE OR
            INABILITY TO USE THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">8. Data Loss.</strong> The developers are not liable for any
            loss, corruption, or unauthorized access to data transmitted through the Software. You are
            advised to maintain backups of all important files.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">9. Indemnification.</strong> You agree to indemnify, defend,
            and hold harmless the developers from and against any and all claims, damages, losses, costs, and
            expenses arising from or related to your use of the Software or violation of these terms.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">10. Termination.</strong> The developers reserve the right to
            terminate or suspend access to the Software at any time, without notice, for any reason. Upon
            termination, your right to use the Software will immediately cease.
          </p>

          <p className="mb-4">
            <strong className="text-white/80">11. Changes to Terms.</strong> These terms may be updated at
            any time. Continued use of the Software after changes constitutes acceptance of the new terms. The
            current version number is displayed at the top of this agreement.
          </p>

          <p className="text-white/50">
            By clicking "I Agree" below, you acknowledge that you have read, understood, and agree to be
            bound by these terms and conditions.
          </p>

          <div className="mt-6 text-center text-xs text-white/30">
            Relay v0.1.0 · Terms Version 1
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleAccept}
            disabled={!scrolledToBottom}
            className="rounded-xl bg-brand-500/20 px-8 py-3 text-sm font-medium text-brand-300 transition-all duration-200 hover:bg-brand-500/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {!scrolledToBottom ? "Scroll to the bottom to agree" : "I Agree"}
          </button>
        </div>

        {!scrolledToBottom && (
          <p className="mt-3 text-center text-xs text-white/30">
            Please read the entire agreement before accepting
          </p>
        )}
      </div>
    </div>
  );
}
