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
    <main className="admin-login-page noise-overlay">
      <div aria-hidden="true" className="admin-login-page__ambient" />
      <div aria-hidden="true" className="admin-login-page__mesh admin-login-page__mesh--one" />
      <div aria-hidden="true" className="admin-login-page__mesh admin-login-page__mesh--two" />

      <div className="admin-login-layout">
        <section className="admin-login-story">
          <div className="admin-login-story__content">
            <div className="admin-login-chip">
              <Sparkles size={14} className="text-[var(--ember)]" />
              Admin access
            </div>

            <h1
              className="admin-login-story__title"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}
            >
              A calmer way to run the kitchen.
            </h1>

            <p className="admin-login-story__copy">
              Manage the storefront, menu, live status, and order flow from a polished workspace that feels more like
              a product than a back office.
            </p>

            <div className="admin-login-story__features">
              <FeatureCard title="Live sync" copy="Updates reflect Supabase changes in real time." />
              <FeatureCard title="Guided CMS" copy="Most storefront content is editable without digging for keys." />
              <FeatureCard title="Operational clarity" copy="Open, closed, and maintenance states are visible everywhere." />
            </div>
          </div>

          <div className="admin-login-story__metrics">
            <MetricTile label="Dashboard" value="Live" />
            <MetricTile label="Store state" value="Supabase" />
            <MetricTile label="Surface" value="Polished" />
          </div>
        </section>

        <section className="admin-login-panel-wrap">
          <div className="admin-login-panel">
            <div className="admin-login-panel__chrome" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="admin-login-panel__intro">
              <div className="admin-login-panel__icon">
                <ShieldCheck size={24} />
              </div>
              <h2 className="admin-login-panel__title" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Sign in
              </h2>
              <p className="admin-login-panel__copy">
                Use your admin account to open the storefront control room.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="admin-login-form">
              <div>
                <label className="admin-login-form__label">
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
                <label className="admin-login-form__label">
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
                <div className="admin-login-form__error" role="alert">
                  {error}
                </div>
              ) : null}

              <button type="submit" disabled={loading} className="btn-primary admin-login-form__submit">
                <span>{loading ? 'Signing in...' : 'Open control room'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <p className="admin-login-panel__footnote">
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
    <div className="admin-login-feature-card">
      <div className="admin-login-feature-card__title">{title}</div>
      <p className="admin-login-feature-card__copy">{copy}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-login-metric-tile">
      <div className="admin-login-metric-tile__label">{label}</div>
      <div className="admin-login-metric-tile__value">{value}</div>
    </div>
  );
}
