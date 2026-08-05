import { LoginForm } from "./login-form";
import { PhotoBackground } from "@/components/illustrations/photo-background";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-900 px-4">
      <PhotoBackground className="h-full w-full" />
      <div className="animate-fade-in-up relative flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-navy-700 bg-white p-8 shadow-2xl">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-3xl shadow-sm ring-2 ring-gold-400/60">
          🐦
        </span>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight text-navy-900">
            CARDENAL <span className="text-gold-500">XIN</span>
          </h1>
          <p className="text-sm text-neutral-500">Transporte y logística — panel de flota</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
