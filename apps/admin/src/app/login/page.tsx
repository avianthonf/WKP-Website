'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';
import type { FormEvent } from 'react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <main
      className="min-h-screen overflow-hidden noise-overlay"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(232, 84, 10, 0.12), transparent 28%), radial-gradient(circle at bottom right, rgba(22, 163, 74, 0.08), transparent 26%), linear-gradient(180deg, #fbf7f1 0%, #f4ede1 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.75), transparent 20%), radial-gradient(circle at 82% 18%, rgba(232,84,10,0.12), transparent 18%), radial-gradient(circle at 72% 80%, rgba(22,163,74,0.08), transparent 18%)',
          filter: 'blur(24px)',
          opacity: 0.9,
        }}
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between p-10 lg:flex xl:p-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(229,229,224,0.9)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--stone)] shadow-sm">
              <Sparkles size={14} className="text-[var(--ember)]" />
              Control room
            </div>

            <h1
              className="mt-8 text-[clamp(3.4rem,7vw,6rem)] leading-[0.92] tracking-[-0.08em] text-[var(--ink)]"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}
            >
              A calmer way to run the kitchen.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--stone)]">
              Manage the storefront, menu, live status, and order flow from a polished workspace that feels more like
              a product than a back office.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <FeatureCard title="Live sync" copy="Updates reflect Supabase changes in real time." />
              <FeatureCard title="Guided CMS" copy="Most storefront content is editable without digging for keys." />
              <FeatureCard title="Operational clarity" copy="Open, closed, and maintenance states are visible everywhere." />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricTile label="Dashboard" value="Live" />
            <MetricTile label="Store state" value="Supabase" />
            <MetricTile label="Surface" value="Polished" />
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
          <div
            className="w-full max-w-md rounded-[2.25rem] border border-[rgba(229,229,224,0.9)] bg-white/88 p-7 shadow-[0_30px_70px_rgba(26,23,18,0.12)] backdrop-blur-xl sm:p-8"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[1.4rem] bg-[linear-gradient(135deg,var(--ember),#c94b07)] text-white shadow-[0_18px_28px_rgba(232,84,10,0.24)]">
                <ShieldCheck size={24} />
              </div>
              <h2
                className="text-[clamp(2rem,3vw,2.6rem)] leading-none tracking-[-0.06em] text-[var(--ink)]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Sign in
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--stone)]">
                Use your admin account to open the storefront control room.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="mt-8 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--stone)]">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="input-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--stone)]">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="input-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error ? (
                <div
                  className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
                <span>{loading ? 'Signing in...' : 'Open control room'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-[var(--stone)]">
              Secure access is required because this dashboard edits live storefront content and order operations.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[rgba(229,229,224,0.9)] bg-white/82 p-4 shadow-sm backdrop-blur">
      <div className="text-sm font-semibold text-[var(--ink)]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[var(--stone)]">{copy}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[rgba(229,229,224,0.9)] bg-white/82 p-4 shadow-sm backdrop-blur">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--stone)]">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{value}</div>
    </div>
  );
}
