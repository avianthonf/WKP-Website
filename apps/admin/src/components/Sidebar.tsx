'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';
import { updateSiteConfig } from '@/app/dashboard/settings/actions';
import { toast } from 'react-hot-toast';
import { dashboardSections, type DashboardNavItem } from '@/components/dashboard-navigation';

interface SidebarProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ isExpanded, onToggleExpanded, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const [isSavingStore, setIsSavingStore] = useState(false);

  useEffect(() => {
    const loadStoreState = async () => {
      const { data } = await supabase.from('site_config').select('value').eq('key', 'is_open').single();
      setIsStoreOpen(data?.value === 'true');
    };

    loadStoreState();
  }, [supabase]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        onToggleExpanded();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isExpanded, onToggleExpanded]);

  const activeHref = useMemo(() => {
    const routes = dashboardSections.flatMap((section) => section.items);
    const matches = routes.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
    return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  }, [pathname]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }

    onNavigate?.();
    router.push('/login');
    router.refresh();
  };

  const handleStoreToggle = async () => {
    if (isStoreOpen === null || isSavingStore) return;

    setIsSavingStore(true);
    try {
      await updateSiteConfig('is_open', String(!isStoreOpen));
      setIsStoreOpen(!isStoreOpen);
      toast.success(`Store ${!isStoreOpen ? 'opened' : 'closed'}`);
    } catch (error: any) {
      toast.error(error.message || 'Unable to update store status');
    } finally {
      setIsSavingStore(false);
    }
  };

  return (
    <aside className={`dashboard-drawer ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
      <div className="dashboard-drawer__rail">
        <button
          type="button"
          className="dashboard-drawer__brand"
          onClick={onToggleExpanded}
          aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
        >
          <span className="dashboard-drawer__brand-mark">WKP</span>
          <span className="dashboard-drawer__brand-copy">
            <span className="dashboard-drawer__brand-name">We Knead Pizza</span>
            <span className="dashboard-drawer__brand-sub">Admin Dashboard</span>
          </span>
          <span className="dashboard-drawer__brand-toggle" aria-hidden="true">
            {isExpanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </span>
        </button>

        <nav className="dashboard-drawer__nav" aria-label="Dashboard navigation">
          {dashboardSections.map((section) => (
            <Section
              key={section.label}
              label={section.label}
              items={section.items}
              activeHref={activeHref}
              isExpanded={isExpanded}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="dashboard-drawer__footer">
          <button
            type="button"
            className="dashboard-drawer__status"
            onClick={handleStoreToggle}
            disabled={isSavingStore || isStoreOpen === null}
            title="Toggle store status"
          >
            <span className={`dashboard-drawer__status-dot ${isStoreOpen ? 'is-open' : 'is-closed'}`} />
            <span className="dashboard-drawer__status-label">
              <span className="dashboard-drawer__status-label-top">Store intake</span>
              <span className="dashboard-drawer__status-label-bottom">
                {isStoreOpen ? 'Accepting orders' : 'Orders paused'}
              </span>
            </span>
            <span className={`dashboard-drawer__status-pill ${isStoreOpen ? 'is-open' : 'is-closed'}`}>
              {isStoreOpen ? 'Open' : 'Closed'}
            </span>
          </button>

          <div className="dashboard-drawer__profile">
            <div className="dashboard-drawer__avatar" aria-hidden="true">
              A
            </div>
            <div className="dashboard-drawer__profile-copy">
              <span className="dashboard-drawer__profile-name">Store Admin</span>
              <span className="dashboard-drawer__profile-role">Control room</span>
            </div>
            <button
              type="button"
              className="dashboard-drawer__signout"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Section({
  label,
  items,
  activeHref,
  isExpanded,
  onNavigate,
}: {
  label: string;
  items: DashboardNavItem[];
  activeHref?: string;
  isExpanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="dashboard-drawer__section">
      <p className="dashboard-drawer__section-label">{label}</p>
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`dashboard-drawer__item ${activeHref === item.href ? 'is-active' : ''}`}
            title={isExpanded ? undefined : item.label}
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <span className="dashboard-drawer__icon">
              <Icon size={18} />
            </span>
            <span className="dashboard-drawer__label">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
