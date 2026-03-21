'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleSignIn = async (e: React.FormEvent) => {
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
    <main className="min-h-screen flex items-center justify-center p-4 noise-overlay" style={{ background: 'var(--surface-sidebar)' }}>
      <div
        className="w-full max-w-sm animate-scale-in"
        style={{
          background: 'var(--cream)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: '0 25px 50px -12px rgba(26,23,18,0.25)',
          padding: 'var(--space-8)',
        }}
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <h1
            className="text-[1.75rem] italic leading-none mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--ember)' }}
          >
            We Knead Pizza
          </h1>
          <p className="text-xs" style={{ color: 'var(--stone)', fontFamily: "'DM Sans', sans-serif" }}>
            Admin Dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="Email"
              required
              className="input-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              required
              className="input-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div
              className="p-3 rounded-lg text-sm animate-fade-in"
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
            style={{ height: '3rem', fontSize: '0.875rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
