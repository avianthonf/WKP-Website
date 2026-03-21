import {
  BarChart3,
  ChefHat,
  Grid2X2,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type DashboardNavSection = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardRouteMeta = {
  label: string;
  subtitle: string;
};

export const dashboardSections: DashboardNavSection[] = [
  {
    label: 'Operations',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/orders', label: 'Live Orders', icon: ChefHat },
      { href: '/dashboard/orders/history', label: 'Order History', icon: Receipt },
      { href: '/dashboard/pizzas', label: 'Menu Studio', icon: Grid2X2 },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/dashboard/settings', label: 'Store Settings', icon: Settings },
      { href: '/dashboard/staff', label: 'Team', icon: Users },
      { href: '/dashboard/prices', label: 'Pricing', icon: ShoppingBag },
    ],
  },
];

export const dashboardRouteMeta: Record<string, DashboardRouteMeta> = {
  '/dashboard': {
    label: 'Overview',
    subtitle: 'A calm snapshot of revenue, live status, and the next best action.',
  },
  '/dashboard/orders': {
    label: 'Live Orders',
    subtitle: 'Move tickets through the kitchen and keep deliveries flowing.',
  },
  '/dashboard/orders/history': {
    label: 'Order History',
    subtitle: 'Review completed, cancelled, and older orders.',
  },
  '/dashboard/pizzas': {
    label: 'Menu Studio',
    subtitle: 'Shape menu items, pricing, categories, and customizations.',
  },
  '/dashboard/categories': {
    label: 'Categories',
    subtitle: 'Organize the menu into customer-friendly groups.',
  },
  '/dashboard/toppings': {
    label: 'Toppings',
    subtitle: 'Control the add-ons customers can choose while building.',
  },
  '/dashboard/extras': {
    label: 'Extras',
    subtitle: 'Manage sides and add-on items.',
  },
  '/dashboard/addons': {
    label: 'Add-ons',
    subtitle: 'Keep bundle options and add-ons in sync.',
  },
  '/dashboard/desserts': {
    label: 'Desserts',
    subtitle: 'Keep sweet finishers available and priced correctly.',
  },
  '/dashboard/prices': {
    label: 'Pricing',
    subtitle: 'Review price bands and menu economics.',
  },
  '/dashboard/analytics': {
    label: 'Analytics',
    subtitle: 'Understand revenue, throughput, and order patterns.',
  },
  '/dashboard/notifications': {
    label: 'Notifications',
    subtitle: 'Review active alerts and important store updates.',
  },
  '/dashboard/settings': {
    label: 'Store Settings',
    subtitle: 'Control storefront content, hours, navigation, and live flags.',
  },
  '/dashboard/staff': {
    label: 'Team',
    subtitle: 'Track the roster, contacts, and shift visibility.',
  },
};

export function resolveDashboardRouteMeta(pathname: string): DashboardRouteMeta {
  const sortedRoutes = Object.entries(dashboardRouteMeta).sort(([a], [b]) => b.length - a.length);
  const match = sortedRoutes.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] || { label: 'Overview', subtitle: 'A live snapshot of the store and the team behind it.' };
}
