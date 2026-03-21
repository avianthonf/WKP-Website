'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LayoutDashboard, Menu, ToggleLeft, ToggleRight } from 'lucide-react';
import { resolveDashboardRouteMeta } from '@/components/dashboard-navigation';

interface NavbarProps {
  isDrawerExpanded: boolean;
  onToggleDrawer: () => void;
  isDashboardLive: boolean;
  onToggleDashboardLive: () => void | Promise<void>;
  isDashboardLiveSaving: boolean;
  notificationCount: number;
}

export function Navbar({
  isDrawerExpanded,
  onToggleDrawer,
  isDashboardLive,
  onToggleDashboardLive,
  isDashboardLiveSaving,
  notificationCount,
}: NavbarProps) {
  const pathname = usePathname();
  const pageMeta = resolveDashboardRouteMeta(pathname);

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <button
          type="button"
          onClick={onToggleDrawer}
          className="dashboard-topbar__menu"
          aria-label={isDrawerExpanded ? 'Collapse navigation drawer' : 'Expand navigation drawer'}
        >
          <Menu size={18} />
        </button>

        <div className="dashboard-topbar__crumbs">
          <span className="dashboard-topbar__crumb dashboard-topbar__crumb--root">
            <LayoutDashboard size={14} />
            Admin Console
          </span>
          <span className="dashboard-topbar__crumb-divider">/</span>
          <div className="dashboard-topbar__page">
            <span className="dashboard-topbar__crumb dashboard-topbar__crumb--current">
              {pageMeta.label}
            </span>
            <span className="dashboard-topbar__page-subtitle">{pageMeta.subtitle}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-topbar__right">
        <button
          type="button"
          className={`dashboard-live-toggle ${isDashboardLive ? 'is-live' : 'is-muted'}`}
          onClick={onToggleDashboardLive}
          aria-pressed={isDashboardLive}
          title="Toggle dashboard live mode"
          disabled={isDashboardLiveSaving}
        >
          {isDashboardLive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          <span>{isDashboardLiveSaving ? 'Saving...' : 'Live mode'}</span>
        </button>

        <Link
          href="/dashboard/notifications"
          className="dashboard-topbar__icon-btn dashboard-topbar__icon-link"
          aria-label={
            notificationCount > 0
              ? `${notificationCount} active notifications`
              : 'Open notifications'
          }
          title="Open notifications"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="dashboard-topbar__badge">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Link>

        <Link href="/dashboard/settings" className="dashboard-topbar__avatar-link" aria-label="Open settings">
          <div className="dashboard-topbar__avatar">WK</div>
        </Link>
      </div>
    </header>
  );
}
