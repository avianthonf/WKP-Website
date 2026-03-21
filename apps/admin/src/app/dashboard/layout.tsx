'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';
import { upsertDashboardLiveMode } from '@/app/dashboard/settings/actions';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { toast } from 'react-hot-toast';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [isDashboardLive, setIsDashboardLive] = useState(true);
  const [isDashboardLiveSaving, setIsDashboardLiveSaving] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const isDev = process.env.NODE_ENV === 'development';
      const autoLogin = process.env.NEXT_PUBLIC_ENABLE_AUTO_LOGIN === 'true';

      if (!session && !(isDev && autoLogin)) {
        router.push('/login');
        return;
      }

      try {
        const [
          { data: dashboardLiveConfig },
          { count: activeNotificationCount },
        ] = await Promise.all([
          supabase.from('site_config').select('value').eq('key', 'dashboard_live_mode').maybeSingle(),
          supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_active', true),
        ]);

        if (!isMounted) {
          return;
        }

        setIsDashboardLive(dashboardLiveConfig?.value !== 'false');
        setNotificationCount(activeNotificationCount || 0);
      } catch {
        if (!isMounted) {
          return;
        }

        setIsDashboardLive(true);
        setNotificationCount(0);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleToggleDashboardLive = async () => {
    if (isDashboardLiveSaving) return;

    const nextValue = !isDashboardLive;
    setIsDashboardLive(nextValue);
    setIsDashboardLiveSaving(true);

    try {
      await upsertDashboardLiveMode(nextValue);
      toast.success(nextValue ? 'Dashboard live mode enabled' : 'Dashboard live mode paused');
    } catch (error: any) {
      setIsDashboardLive(!nextValue);
      toast.error(error.message || 'Failed to update dashboard live mode');
    } finally {
      setIsDashboardLiveSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="w-12 h-12 border-4 border-[var(--ember-light)] border-t-[var(--ember)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`dashboard-shell ${isDrawerExpanded ? 'is-expanded' : 'is-collapsed'}`}>
      <div className="dashboard-shell__ambient" aria-hidden="true">
        <motion.span
          className="dashboard-shell__orb dashboard-shell__orb--one"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  x: [0, 18, 0],
                  y: [0, -14, 0],
                  scale: [1, 1.04, 1],
                }
          }
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="dashboard-shell__orb dashboard-shell__orb--two"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  x: [0, -16, 0],
                  y: [0, 16, 0],
                  scale: [1, 0.98, 1],
                }
          }
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--surface-card)',
            color: 'var(--ink)',
            fontSize: '0.875rem',
            fontFamily: "'DM Sans', sans-serif",
            borderRadius: '1rem',
            padding: '1rem 1.25rem',
            boxShadow: '0 12px 32px rgba(26,23,18,0.12), 0 0 0 1px rgba(229, 229, 224, 0.5)',
            border: '1px solid var(--border-default)',
          },
        }}
      />

      <Sidebar
        isExpanded={isDrawerExpanded}
        onToggleExpanded={() => setIsDrawerExpanded((value) => !value)}
      />

      <div className="dashboard-shell__frame">
        <Navbar
          isDrawerExpanded={isDrawerExpanded}
          onToggleDrawer={() => setIsDrawerExpanded((value) => !value)}
          isDashboardLive={isDashboardLive}
          onToggleDashboardLive={handleToggleDashboardLive}
          isDashboardLiveSaving={isDashboardLiveSaving}
          notificationCount={notificationCount}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={pathname}
            className="dashboard-shell__main"
            initial={
              prefersReducedMotion
                ? false
                : {
                    opacity: 0,
                    y: 16,
                    scale: 0.992,
                  }
            }
            animate={
              prefersReducedMotion
                ? {}
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }
            }
            exit={
              prefersReducedMotion
                ? {}
                : {
                    opacity: 0,
                    y: -10,
                    scale: 0.994,
                  }
            }
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="dashboard-shell__content">
              <div className="reveal-stagger">{children}</div>
            </div>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
