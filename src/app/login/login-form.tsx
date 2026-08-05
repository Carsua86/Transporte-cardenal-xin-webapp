"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import { inputClass, labelClass } from "@/lib/ui";
import { WelcomeOverlay } from "@/components/login/welcome-overlay";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, null);
  const [showWelcome, setShowWelcome] = useState(false);
  const wasPending = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (wasPending.current && !pending && error === null) {
      setShowWelcome(true);
    }
    wasPending.current = pending;
  }, [pending, error]);

  useEffect(() => {
    if (!showWelcome) return;
    const timer = setTimeout(() => router.push("/"), 1700);
    return () => clearTimeout(timer);
  }, [showWelcome, router]);

  if (showWelcome) return <WelcomeOverlay />;

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className={labelClass}>
          Correo
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className={labelClass}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
