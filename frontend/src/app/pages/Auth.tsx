import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import { ShieldCheck, Sparkles, Truck } from "lucide-react";
import { isAuthenticated, signIn, signInWithGoogleCredential, signUp } from "../utils/auth";
import { cn } from "../utils/classnames";

type AuthMode = "signin" | "signup";

export const Auth = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const heading = useMemo(() => {
    return mode === "signin" ? "Welcome back" : "Create your account";
  }, [mode]);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const ok =
      mode === "signin"
        ? signIn(email.trim(), password)
        : signUp(name.trim(), email.trim(), password);

    if (!ok) {
      setError(mode === "signin" ? "Enter email and password to continue." : "Use a valid name, email, and password (6+ chars).");
      return;
    }

    navigate("/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafaf8] text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          <section className="hidden rounded-3xl border border-emerald-100/60 bg-white/70 p-8 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm lg:block">
            <div className="mb-10 flex items-center gap-3 text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/50 bg-emerald-500/10">
                <Truck className="h-5 w-5 text-emerald-600" />
              </div>
              <h1 className="text-xl font-semibold tracking-wide">FleetFlow</h1>
            </div>

            <h2 className="max-w-sm text-4xl font-semibold leading-tight text-slate-900">
              Logistics visibility that feels effortless.
            </h2>
            <p className="mt-4 max-w-md text-slate-600">
              Sign in to monitor vehicles, routes, maintenance, and trip performance in a single operational cockpit.
            </p>

            <div className="mt-10 space-y-4">
              <Feature label="Real-time trip telemetry" />
              <Feature label="Maintenance and driver tracking" />
              <Feature label="Live KPI and utilization dashboards" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_16px_60px_-35px_rgba(15,23,42,0.45)] sm:p-9">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Fleet Intelligence</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{heading}</h2>
              </div>
              <Sparkles className="h-5 w-5 text-cyan-500" />
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                )}
                onClick={() => setMode("signin")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                )}
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Full Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Alex Morgan"
                    autoComplete="name"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="team@fleetflow.com"
                  autoComplete="email"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </label>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <ShieldCheck className="h-4 w-4" />
                {mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">or continue with</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {googleClientId ? (
              <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <GoogleLogin
                  theme="outline"
                  size="large"
                  text={mode === "signin" ? "signin_with" : "signup_with"}
                  shape="pill"
                  onSuccess={(credentialResponse) => {
                    const credential = credentialResponse.credential;
                    if (!credential || !signInWithGoogleCredential(credential)) {
                      setError("Google authentication failed. Please try again.");
                      return;
                    }
                    navigate("/");
                  }}
                  onError={() => setError("Google authentication failed. Please try again.")}
                />
              </div>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Google auth is not configured yet. Add VITE_GOOGLE_CLIENT_ID in frontend/.env.
              </p>
            )}

            <p className="mt-5 text-center text-xs text-slate-500">
              By continuing, you agree to FleetFlow policies.
              <Link to="/" className="ml-1 text-emerald-700 hover:text-emerald-800">
                Learn more
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ label }: { label: string }) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
      {label}
    </div>
  );
};
