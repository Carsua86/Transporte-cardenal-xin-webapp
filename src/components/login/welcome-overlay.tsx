import { HighwayScene } from "@/components/illustrations/highway-scene";

export function WelcomeOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-hidden bg-gradient-to-b from-navy-900 to-navy-800">
      <HighwayScene className="pointer-events-none absolute inset-0 h-full w-full opacity-40" />
      <span className="animate-welcome-pop relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-4xl shadow-2xl ring-2 ring-gold-400/60">
        🐦
      </span>
      <div
        className="animate-fade-in-up relative text-center"
        style={{ animationDelay: "0.35s", animationFillMode: "both" }}
      >
        <p className="text-2xl font-semibold text-white">¡Bienvenido!</p>
        <p className="text-sm text-navy-200">
          <span className="text-gold-400">CARDENAL XIN</span> — Transporte y logística
        </p>
      </div>
    </div>
  );
}
