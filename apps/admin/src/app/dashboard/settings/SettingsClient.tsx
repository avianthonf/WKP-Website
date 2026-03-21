'use client';

import Link from 'next/link';
import { useState, useEffect, useTransition, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { createClient } from '@/lib/supabaseClient';
import { MenuImageField } from '@/components/admin/MenuImageField';
import {
  createSiteConfig,
  updateSiteConfig,
  deleteSiteConfig,
  upsertDashboardLiveMode,
  upsertSiteConfig,
} from './actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Contact2,
  Globe2,
  Image as ImageIcon,
  Home,
  ListChecks,
  Menu,
  Power,
  Settings as SettingsIcon,
  Shield,
  ShoppingCart,
  Store,
  Trash2,
  X,
  Plus,
} from 'lucide-react';
import { SiteConfigItem } from '@/types';

interface SettingsClientProps {
  initialConfigs: SiteConfigItem[];
}

type RealtimeSiteConfigPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: SiteConfigItem;
  old: SiteConfigItem;
};

export default function SettingsClient({ initialConfigs }: SettingsClientProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isPending, startTransition] = useTransition();
  const [configs, setConfigs] = useState<SiteConfigItem[]>(initialConfigs);
  const [powerStates, setPowerStates] = useState<Record<string, boolean>>(() => {
    const states: Record<string, boolean> = {};
    initialConfigs.forEach((cfg) => {
      if (cfg.type === 'boolean') {
        states[cfg.key] = cfg.value === 'true';
      }
    });
    return states;
  });
  const [addConfigOpen, setAddConfigOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    key: '',
    label: '',
    type: 'text' as const,
    value: '',
  });

  // Real-time subscription
  useEffect(() => {
    const client = createClient();

    const channel = client
      .channel('site_config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_config',
        },
        (payload: RealtimeSiteConfigPayload) => {
          const eventType = payload.eventType;
          const config = payload.new as SiteConfigItem;

          setConfigs((prev) => {
            if (eventType === 'DELETE') {
              return prev.filter((c) => c.key !== payload.old.key);
            }
            if (eventType === 'UPDATE' || eventType === 'INSERT') {
              const exists = prev.some((c) => c.key === config.key);
              if (exists) {
                return prev.map((c) => (c.key === config.key ? config : c));
              }
              return [...prev, config].sort((a, b) => a.key.localeCompare(b.key));
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const handlePowerToggle = (key: string, label: string) => {
    const current = powerStates[key];
    startTransition(async () => {
      try {
        if (key === 'dashboard_live_mode') {
          await upsertDashboardLiveMode(!current);
        } else {
          await updateSiteConfig(key, String(!current));
        }
        setPowerStates((prev) => ({ ...prev, [key]: !current }));
        toast.success(`${label} updated`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to update');
      }
    });
  };

  const handleConfigValueChange = async (key: string, newValue: string) => {
    startTransition(async () => {
      try {
        await updateSiteConfig(key, newValue);
        setConfigs((prev) =>
          prev.map((config) =>
            config.key === key
              ? { ...config, value: newValue, updated_at: new Date().toISOString() }
              : config
          )
        );
        // Update local boolean state if it's a boolean key
        const config = configs.find((c) => c.key === key);
        if (config?.type === 'boolean') {
          setPowerStates((prev) => ({ ...prev, [key]: newValue === 'true' }));
        }
        toast.success('Config updated');
      } catch (error: any) {
        toast.error(error.message || 'Failed to update');
        // Revert input handled by component not updating local state before save
      }
    });
  };

  const handleDeleteConfig = async (key: string) => {
    if (!window.confirm(`Delete config key "${key}"? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteSiteConfig(key);
        toast.success('Config deleted');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete');
      }
    });
  };

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfig.key || !newConfig.label) {
      toast.error('Key and label are required');
      return;
    }

    startTransition(async () => {
      try {
        await createSiteConfig(newConfig.key, newConfig.value, newConfig.label, newConfig.type);
        toast.success('Config created');
        setNewConfig({ key: '', label: '', type: 'text', value: '' });
        setAddConfigOpen(false);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || 'Failed to create config');
      }
    });
  };

  const saveCmsSetting = (
    key: string,
    label: string,
    type: string,
    value: string,
    description = '',
    isPublic = true
  ) => {
    startTransition(async () => {
      try {
        await upsertSiteConfig(key, value, label, type, description, isPublic);
        setConfigs((prev) => {
          const current = prev.find((item) => item.key === key);
          const updated: SiteConfigItem = current
            ? {
                ...current,
                label,
                type,
                value,
                description,
                updated_at: new Date().toISOString(),
              }
            : {
                id: key,
                key,
                label,
                value,
                type,
                description,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

          const next = prev.filter((item) => item.key !== key);
          next.push(updated);
          return next.sort((a, b) => a.key.localeCompare(b.key));
        });
        if (type === 'boolean') {
          setPowerStates((prev) => ({ ...prev, [key]: value === 'true' }));
        }
        toast.success(`${label} saved`);
      } catch (error: any) {
        toast.error(error.message || 'Failed to save setting');
      }
    });
  };

  const getPowerControlData = () => {
    const dashboardLiveConfig = configs.find((c) => c.key === 'dashboard_live_mode');
    const isOpenConfig = configs.find((c) => c.key === 'is_open');
    const maintenanceConfig = configs.find((c) => c.key === 'site_maintenance_mode');

    return [
      {
        key: 'dashboard_live_mode',
        value: powerStates.dashboard_live_mode ?? (dashboardLiveConfig?.value !== 'false'),
        label: 'Dashboard Live Mode',
        description: 'Keep the admin chrome synced with live operations.',
        icon: Activity,
      },
      {
        key: 'is_open',
        value: powerStates.is_open ?? (isOpenConfig?.value === 'true'),
        label: 'Accepting Orders',
        description: 'Toggle to allow new orders on the storefront.',
        icon: Power,
      },
      {
        key: 'site_maintenance_mode',
        value: powerStates.site_maintenance_mode ?? (maintenanceConfig?.value === 'true'),
        label: 'Maintenance Mode',
        description: 'Put the storefront into maintenance for all users.',
        icon: SettingsIcon,
      },
    ];
  };

  const powerData = getPowerControlData();
  const getField = (key: string) => configs.find((config) => config.key === key);
  const cmsGroups = [
    {
      title: 'Brand & Identity',
      description: 'Store name, hero copy, footer text, and SEO metadata.',
      icon: Store,
      fields: [
        { key: 'store_name', label: 'Store name', kind: 'text', fallback: 'We Knead Pizza', description: 'Primary brand name across the storefront.' },
        { key: 'hero_title', label: 'Default hero title', kind: 'text', fallback: 'We Knead Pizza', description: 'Fallback title used when a page-specific title is not set.' },
        { key: 'hero_subtitle', label: 'Default hero subtitle', kind: 'textarea', fallback: 'Hand-tossed pizza, warm sides, and a WhatsApp-first order flow built for real life.', description: 'Fallback hero subtitle used across the storefront.' },
        { key: 'announcement_bar', label: 'Announcement bar', kind: 'text', fallback: 'Freshly made daily with premium ingredients and live order handling.', description: 'Short announcement shown at the top of the site.' },
        { key: 'footer_copy', label: 'Footer copy', kind: 'textarea', fallback: 'A premium storefront for pizza, crafted to feel warm, cinematic, and easy to order from.', description: 'Brand copy shown in the footer.' },
        { key: 'brand_tagline', label: 'Brand tagline', kind: 'text', fallback: 'Crafted pizza house', description: 'Small supporting tagline next to the logo.' },
        { key: 'support_email', label: 'Support email', kind: 'text', fallback: 'hello@wkp.local', description: 'Displayed on the Contact page.' },
        { key: 'whatsapp_number', label: 'WhatsApp number', kind: 'text', fallback: '918484802540', description: 'Used for order handoff and quick contact.' },
        { key: 'site_meta_title', label: 'SEO title', kind: 'text', fallback: 'We Knead Pizza | Crafted Pizza Ordering', description: 'Browser title and metadata title.' },
        { key: 'site_meta_description', label: 'SEO description', kind: 'textarea', fallback: 'An editorial pizza storefront with live menu data, WhatsApp ordering, and a premium customer experience.', description: 'Browser description used by search engines.' },
        { key: 'site_theme_color', label: 'Theme color', kind: 'text', fallback: '#050403', description: 'Browser theme color in hex format.' },
      ],
    },
    {
      title: 'Storefront Images',
      description: 'Homepage, menu, cart, builder, and brand artwork shown on the storefront.',
      icon: ImageIcon,
      fields: [
        { key: 'brand_logo_image_url', label: 'Brand logo image', kind: 'image', fallback: '', description: 'Shown in the top-left brand area and mobile drawer when set. Leave blank to use the text mark.' },
        { key: 'home_feature_image_url', label: 'Home feature image', kind: 'image', fallback: '', description: 'Shown in the homepage hero showcase and featured media panel.' },
        { key: 'menu_hero_image_url', label: 'Menu hero image', kind: 'image', fallback: '', description: 'Shown beside the menu intro and browsing summary.' },
        { key: 'cart_hero_image_url', label: 'Cart hero image', kind: 'image', fallback: '', description: 'Shown beside the checkout summary before the WhatsApp handoff.' },
        { key: 'builder_hero_image_url', label: 'Pizza builder image', kind: 'image', fallback: '', description: 'Shown in the pizza builder preview when the selected pizza does not have its own image.' },
        { key: 'menu_detail_image_url', label: 'Menu detail fallback image', kind: 'image', fallback: '', description: 'Shown on menu detail pages when an item does not have its own photo.' },
      ],
    },
    {
      title: 'Location & Hours',
      description: 'Address, map, operating hours, and minimum order.',
      icon: Globe2,
      fields: [
        { key: 'address_line1', label: 'Address line 1', kind: 'text', fallback: 'Carona, Goa', description: 'First line of the public address.' },
        { key: 'address_line2', label: 'Address line 2', kind: 'text', fallback: '', description: 'Optional second line of the public address.' },
        { key: 'google_maps_link', label: 'Google Maps link', kind: 'url', fallback: '', description: 'Link to your business location.' },
        { key: 'opening_time', label: 'Opening time', kind: 'time', fallback: '11:00', description: 'Opening time used across the storefront.' },
        { key: 'closing_time', label: 'Closing time', kind: 'time', fallback: '23:00', description: 'Closing time used across the storefront.' },
        { key: 'min_order_amount', label: 'Minimum order', kind: 'number', fallback: '0', description: 'Shown in cart and delivery pages.' },
      ],
    },
    {
      title: 'Navigation',
      description: 'Primary links shown in the top bar and mobile drawer.',
      icon: Menu,
      custom: 'nav',
    },
    {
      title: 'Home Page',
      description: 'Hero copy, feature copy, and the three-step intro rail.',
      icon: Home,
      fields: [
        { key: 'home_hero_title', label: 'Hero title', kind: 'text', fallback: 'We Knead Pizza', description: 'Main title on the homepage.' },
        { key: 'home_hero_subtitle', label: 'Hero subtitle', kind: 'textarea', fallback: 'Hand-tossed pizza, warm sides, and a WhatsApp-first order flow.', description: 'Homepage hero subtitle.' },
        { key: 'home_announcement', label: 'Homepage announcement', kind: 'text', fallback: 'Freshly made daily.', description: 'Eyebrow announcement at the top of the home page.' },
        { key: 'home_feature_copy', label: 'Feature copy', kind: 'textarea', fallback: 'Rich, hot, and ready to slide from discovery to order with almost no friction.', description: 'Featured pizza callout on the homepage.' },
        { key: 'home_steps_eyebrow', label: 'Steps eyebrow', kind: 'text', fallback: 'Start here', description: 'Label above the intro cards.' },
        { key: 'home_steps_title', label: 'Steps title', kind: 'text', fallback: 'A three-step flow people actually enjoy using', description: 'Headline above the intro cards.' },
        { key: 'home_steps_cta', label: 'Steps CTA', kind: 'text', fallback: 'View all items', description: 'CTA button beside the intro cards.' },
        { key: 'home_step_1_title', label: 'Step 1 title', kind: 'text', fallback: 'Crave something now', description: 'First intro card title.' },
        { key: 'home_step_1_copy', label: 'Step 1 copy', kind: 'textarea', fallback: 'Scroll the menu and tap into a signature pizza in seconds.', description: 'First intro card copy.' },
        { key: 'home_step_1_href', label: 'Step 1 link', kind: 'url', fallback: '/menu', description: 'First intro card link.' },
        { key: 'home_step_2_title', label: 'Step 2 title', kind: 'text', fallback: 'Make it yours', description: 'Second intro card title.' },
        { key: 'home_step_2_copy', label: 'Step 2 copy', kind: 'textarea', fallback: 'Start with a base, add extras, and build the exact bite you want.', description: 'Second intro card copy.' },
        { key: 'home_step_2_href', label: 'Step 2 link', kind: 'url', fallback: '/build', description: 'Second intro card link.' },
        { key: 'home_step_3_title', label: 'Step 3 title', kind: 'text', fallback: 'Send it fast', description: 'Third intro card title.' },
        { key: 'home_step_3_copy', label: 'Step 3 copy', kind: 'textarea', fallback: 'Checkout flows straight into WhatsApp with a clean order summary.', description: 'Third intro card copy.' },
        { key: 'home_step_3_href', label: 'Step 3 link', kind: 'url', fallback: '/cart', description: 'Third intro card link.' },
        { key: 'home_signature_eyebrow', label: 'Signature eyebrow', kind: 'text', fallback: 'Signature picks', description: 'Section label above the featured pizzas.' },
        { key: 'home_signature_title', label: 'Signature title', kind: 'text', fallback: 'Tap a favorite, feel the rhythm, and order', description: 'Signature section title.' },
        { key: 'home_signature_copy', label: 'Signature copy', kind: 'textarea', fallback: 'A curated line-up that feels more like browsing a chef\'s counter than a spreadsheet.', description: 'Signature section supporting copy.' },
        { key: 'home_closing_eyebrow', label: 'Closing eyebrow', kind: 'text', fallback: "Tonight's move", description: 'Closing banner eyebrow.' },
        { key: 'home_closing_title', label: 'Closing title', kind: 'text', fallback: 'Pick a craving and let the site do the rest', description: 'Closing banner title.' },
        { key: 'home_closing_primary_cta', label: 'Closing CTA 1', kind: 'text', fallback: 'Start with menu', description: 'First closing banner CTA.' },
        { key: 'home_closing_secondary_cta', label: 'Closing CTA 2', kind: 'text', fallback: 'Build custom', description: 'Second closing banner CTA.' },
      ],
    },
    {
      title: 'Menu & Builder',
      description: 'Browse page, detail page, and pizza builder copy.',
      icon: ShoppingCart,
      fields: [
        { key: 'menu_hero_title', label: 'Menu hero title', kind: 'text', fallback: 'A menu that feels like a craving, not a catalog.', description: 'Top title on the menu page.' },
        { key: 'menu_hero_copy', label: 'Menu hero copy', kind: 'textarea', fallback: 'Slide through the menu, find the thing that clicks, and move from discovery to checkout without breaking the mood.', description: 'Top subtitle on the menu page.' },
        { key: 'menu_section_title', label: 'Browse title', kind: 'text', fallback: 'Find the thing that feels right', description: 'Section title above menu filters.' },
        { key: 'menu_section_copy', label: 'Browse copy', kind: 'textarea', fallback: 'Search the live menu and add items with one tap. Pizzas can also be customized in the builder.', description: 'Section copy above menu filters.' },
        { key: 'build_hero_title', label: 'Builder hero title', kind: 'text', fallback: 'Build a custom pizza without leaving the menu.', description: 'Top title on the builder page.' },
        { key: 'build_hero_copy', label: 'Builder hero copy', kind: 'textarea', fallback: 'Pick a base recipe, choose a size, layer in extra toppings, then send the final order to WhatsApp with the exact details preserved in the cart.', description: 'Top copy on the builder page.' },
        { key: 'menu_detail_eyebrow', label: 'Detail eyebrow', kind: 'text', fallback: 'Menu detail', description: 'Label on the detail page.' },
        { key: 'menu_detail_copy', label: 'Detail intro copy', kind: 'textarea', fallback: 'Live from the menu.', description: 'Short intro copy shown beside the detail hero.' },
        { key: 'menu_detail_hero_copy', label: 'Detail hero copy', kind: 'textarea', fallback: 'Live from the menu.', description: 'Hero copy on menu detail pages.' },
        { key: 'menu_detail_preview_copy', label: 'Detail preview copy', kind: 'textarea', fallback: 'Medium price shown. Use the builder for size and extra control.', description: 'Preview card supporting text.' },
        { key: 'menu_detail_notice', label: 'Detail notice', kind: 'text', fallback: 'Customizable pizza with live toppings and sizes.', description: 'Notice text on the detail page.' },
        { key: 'menu_detail_price_title', label: 'Price title', kind: 'text', fallback: 'Price', description: 'Price card title.' },
        { key: 'menu_detail_price_copy', label: 'Price copy', kind: 'textarea', fallback: 'Small price to large price', description: 'Price card supporting text.' },
        { key: 'menu_detail_status_title', label: 'Status title', kind: 'text', fallback: 'Status', description: 'Status card title.' },
        { key: 'menu_detail_status_copy', label: 'Status copy', kind: 'textarea', fallback: 'Availability follows the live menu state.', description: 'Status card supporting text.' },
        { key: 'menu_detail_action_title', label: 'Action title', kind: 'text', fallback: 'Action', description: 'Action card title.' },
        { key: 'menu_detail_action_copy', label: 'Action copy', kind: 'textarea', fallback: 'Use the main menu or builder to add this item to your cart.', description: 'Action card supporting text.' },
      ],
    },
    {
      title: 'Cart & Checkout',
      description: 'Checkout copy and cart screen microcopy.',
      icon: ShoppingCart,
      fields: [
        { key: 'cart_eyebrow', label: 'Cart eyebrow', kind: 'text', fallback: 'WhatsApp checkout', description: 'Eyebrow on the cart page.' },
        { key: 'cart_hero_title', label: 'Cart hero title', kind: 'text', fallback: 'Send the order on WhatsApp and keep moving.', description: 'Main title on the cart page.' },
        { key: 'cart_hero_copy', label: 'Cart hero copy', kind: 'textarea', fallback: 'This checkout keeps WhatsApp as the primary customer action while storing the same order for kitchen visibility and reporting.', description: 'Hero supporting copy on the cart page.' },
        { key: 'cart_preview_title', label: 'Cart preview title', kind: 'text', fallback: 'Your cart is ready', description: 'Preview card title.' },
        { key: 'cart_preview_copy', label: 'Cart preview copy', kind: 'textarea', fallback: 'Orders are stored in the system and sent to WhatsApp with the full payload intact.', description: 'Preview card supporting copy.' },
        { key: 'cart_hours_copy', label: 'Hours label', kind: 'text', fallback: 'Store hours:', description: 'Prefix text before hours.' },
        { key: 'cart_minimum_copy', label: 'Minimum label', kind: 'text', fallback: 'Minimum order', description: 'Prefix text before the minimum order amount.' },
        { key: 'cart_empty_copy', label: 'Empty cart copy', kind: 'textarea', fallback: 'Your cart is empty. Add items from Menu or Build first.', description: 'Empty cart message.' },
      ],
    },
    {
      title: 'About, Contact, Delivery, Status',
      description: 'Informational pages and service copy.',
      icon: Contact2,
      fields: [
        { key: 'about_eyebrow', label: 'About eyebrow', kind: 'text', fallback: 'About the kitchen', description: 'Eyebrow on the About page.' },
        { key: 'about_hero_copy', label: 'About hero copy', kind: 'textarea', fallback: 'A warm, editorial storefront for a pizzeria that wants the ordering experience to feel premium and easy.', description: 'About page hero copy.' },
        { key: 'about_notice', label: 'About notice', kind: 'textarea', fallback: 'Fresh ingredients, live data, and a WhatsApp-first ordering experience.', description: 'About page callout.' },
        { key: 'about_recipe_title', label: 'About recipe title', kind: 'text', fallback: 'Recipe', description: 'About page card title.' },
        { key: 'about_recipe_body', label: 'About recipe body', kind: 'text', fallback: 'Built for real operations.', description: 'About page card body.' },
        { key: 'about_recipe_copy', label: 'About recipe copy', kind: 'textarea', fallback: 'The storefront reads categories, pizzas, toppings, extras, addons, desserts, notifications, and site config live from the database.', description: 'About page card copy.' },
        { key: 'about_hours_label', label: 'About hours label', kind: 'text', fallback: 'Hours', description: 'Label used in the About summary rail for hours.' },
        { key: 'about_min_order_label', label: 'About min order label', kind: 'text', fallback: 'Min order', description: 'Label used in the About summary rail for minimum order.' },
        { key: 'about_address_label', label: 'About address label', kind: 'text', fallback: 'Address', description: 'Label used in the About summary rail for address.' },
        { key: 'about_workflow_title', label: 'About workflow title', kind: 'text', fallback: 'Workflow', description: 'About page workflow card title.' },
        { key: 'about_workflow_body', label: 'About workflow body', kind: 'text', fallback: 'Primary order path is WhatsApp.', description: 'About page workflow card body.' },
        { key: 'about_workflow_copy', label: 'About workflow copy', kind: 'textarea', fallback: 'The order is stored in the database first, then the customer is taken to WhatsApp with the message already composed.', description: 'About page workflow card copy.' },
        { key: 'about_location_title', label: 'About location title', kind: 'text', fallback: 'Location', description: 'About page location card title.' },
        { key: 'contact_hero_title', label: 'Contact hero title', kind: 'text', fallback: 'Talk to the kitchen directly.', description: 'Contact page title.' },
        { key: 'contact_hero_copy', label: 'Contact hero copy', kind: 'textarea', fallback: 'Orders, delivery questions, and special notes all work best through WhatsApp. This page exists for convenience and trust.', description: 'Contact page supporting copy.' },
        { key: 'contact_eyebrow', label: 'Contact eyebrow', kind: 'text', fallback: 'Contact', description: 'Eyebrow shown on the Contact page.' },
        { key: 'contact_whatsapp_label', label: 'Contact WhatsApp label', kind: 'text', fallback: 'WhatsApp', description: 'Label used in the Contact summary rail for WhatsApp.' },
        { key: 'contact_address_label', label: 'Contact address label', kind: 'text', fallback: 'Address', description: 'Label used in the Contact summary rail for address.' },
        { key: 'contact_hours_label', label: 'Contact hours label', kind: 'text', fallback: 'Hours', description: 'Label used in the Contact summary rail for hours.' },
        { key: 'contact_map_title', label: 'Contact map title', kind: 'text', fallback: 'Map', description: 'Contact map card title.' },
        { key: 'contact_map_body', label: 'Contact map body', kind: 'text', fallback: 'Find us easily.', description: 'Contact map card body.' },
        { key: 'contact_email_title', label: 'Contact email title', kind: 'text', fallback: 'Email', description: 'Contact email card title.' },
        { key: 'contact_email_copy', label: 'Contact email copy', kind: 'textarea', fallback: 'This can be connected later if you want a public inbox on the site.', description: 'Contact email card copy.' },
        { key: 'contact_ordering_title', label: 'Contact ordering title', kind: 'text', fallback: 'Live ordering', description: 'Contact ordering card title.' },
        { key: 'contact_ordering_body', label: 'Contact ordering body', kind: 'text', fallback: 'WhatsApp-first.', description: 'Contact ordering card body.' },
        { key: 'contact_ordering_copy', label: 'Contact ordering copy', kind: 'textarea', fallback: 'The order is stored and then handed off to WhatsApp, which keeps the customer flow low-friction.', description: 'Contact ordering card copy.' },
        { key: 'delivery_eyebrow', label: 'Delivery eyebrow', kind: 'text', fallback: 'Delivery info', description: 'Eyebrow shown on the Delivery page.' },
        { key: 'delivery_hero_title', label: 'Delivery hero title', kind: 'text', fallback: 'Delivery that is clear before the order starts.', description: 'Delivery page title.' },
        { key: 'delivery_hero_copy', label: 'Delivery hero copy', kind: 'textarea', fallback: 'Hours, address, and minimums are pulled from the store settings.', description: 'Delivery page supporting copy.' },
        { key: 'delivery_hours_title', label: 'Delivery hours title', kind: 'text', fallback: 'Hours', description: 'Delivery hours card title.' },
        { key: 'delivery_hours_copy', label: 'Delivery hours copy', kind: 'textarea', fallback: 'If the store is closed, the open/closed state comes from the live settings.', description: 'Delivery hours card copy.' },
        { key: 'delivery_address_title', label: 'Delivery address title', kind: 'text', fallback: 'Address', description: 'Delivery address card title.' },
        { key: 'delivery_min_title', label: 'Delivery minimum title', kind: 'text', fallback: 'Minimum', description: 'Delivery minimum card title.' },
        { key: 'delivery_min_copy', label: 'Delivery minimum copy', kind: 'textarea', fallback: 'Shown in cart before checkout, so there are no surprises.', description: 'Delivery minimum card copy.' },
        { key: 'status_eyebrow', label: 'Status eyebrow', kind: 'text', fallback: 'Live status', description: 'Eyebrow shown on the Status page.' },
        { key: 'status_title_open', label: 'Status open title', kind: 'text', fallback: 'We are open.', description: 'Live status page title when open.' },
        { key: 'status_title_closed', label: 'Status closed title', kind: 'text', fallback: 'We are closed right now.', description: 'Live status page title when closed.' },
        { key: 'status_title_maintenance', label: 'Status maintenance title', kind: 'text', fallback: 'Maintenance mode is active.', description: 'Live status page title during maintenance.' },
        { key: 'status_hero_copy', label: 'Status hero copy', kind: 'textarea', fallback: 'This status follows the live settings and is what the storefront will show before checkout.', description: 'Status page hero copy.' },
        { key: 'status_state_title', label: 'Status state title', kind: 'text', fallback: 'State', description: 'Status card title for the live state.' },
        { key: 'status_state_copy', label: 'Status state copy', kind: 'textarea', fallback: 'The state is live from the store settings.', description: 'Status card copy for the live state.' },
        { key: 'status_hours_title', label: 'Status hours title', kind: 'text', fallback: 'Hours', description: 'Status hours card title.' },
        { key: 'status_hours_copy', label: 'Status hours copy', kind: 'textarea', fallback: 'Update hours in the store settings.', description: 'Status hours card copy.' },
        { key: 'status_path_title', label: 'Status path title', kind: 'text', fallback: 'Order path', description: 'Status order path card title.' },
        { key: 'status_path_copy', label: 'Status path copy', kind: 'textarea', fallback: 'Menu -> cart -> WhatsApp.', description: 'Status order path card copy.' },
      ],
    },
    {
      title: 'FAQ, Privacy & Terms',
      description: 'Page-level hero copy for support, privacy, and terms pages.',
      icon: ListChecks,
      fields: [
        { key: 'faq_eyebrow', label: 'FAQ eyebrow', kind: 'text', fallback: 'FAQ', description: 'Eyebrow shown on the FAQ page.' },
        { key: 'faq_hero_title', label: 'FAQ hero title', kind: 'text', fallback: 'Everything customers usually ask.', description: 'FAQ page title.' },
        { key: 'faq_hero_copy', label: 'FAQ hero copy', kind: 'textarea', fallback: 'Short answers, no noise, and the same live storefront data underneath.', description: 'FAQ page supporting copy.' },
        { key: 'privacy_eyebrow', label: 'Privacy eyebrow', kind: 'text', fallback: 'Privacy', description: 'Eyebrow shown on the Privacy page.' },
        { key: 'privacy_hero_title', label: 'Privacy hero title', kind: 'text', fallback: 'We only keep what we need to fulfill the order.', description: 'Privacy page title.' },
        { key: 'privacy_hero_copy', label: 'Privacy hero copy', kind: 'textarea', fallback: 'The storefront stores customer and order details in Supabase so the kitchen can fulfill, track, and review orders.', description: 'Privacy page supporting copy.' },
        { key: 'terms_eyebrow', label: 'Terms eyebrow', kind: 'text', fallback: 'Terms', description: 'Eyebrow shown on the Terms page.' },
        { key: 'terms_hero_title', label: 'Terms hero title', kind: 'text', fallback: 'Plain terms for a straightforward order flow.', description: 'Terms page title.' },
        { key: 'terms_hero_copy', label: 'Terms hero copy', kind: 'textarea', fallback: 'Placing an order means the kitchen may contact you through WhatsApp to confirm details or delivery timing.', description: 'Terms page supporting copy.' },
      ],
    },
    {
      title: '404 Page',
      description: 'Not-found copy for dead-end routes and missing pages.',
      icon: Shield,
      fields: [
        { key: 'not_found_eyebrow', label: '404 eyebrow', kind: 'text', fallback: '404', description: 'Eyebrow on the not-found page.' },
        { key: 'not_found_title', label: '404 title', kind: 'text', fallback: 'We could not find that page.', description: 'Title on the not-found page.' },
        { key: 'not_found_copy', label: '404 copy', kind: 'textarea', fallback: 'The link may be outdated or the page may not exist yet. The menu and checkout are still ready.', description: 'Body copy on the not-found page.' },
        { key: 'not_found_primary_cta', label: '404 primary CTA', kind: 'text', fallback: 'Back to menu', description: 'Primary action on the not-found page.' },
        { key: 'not_found_secondary_cta', label: '404 secondary CTA', kind: 'text', fallback: 'Go home', description: 'Secondary action on the not-found page.' },
      ],
    },
  ] as const;
  const managedKeys = new Set<string>([
    'dashboard_live_mode',
    'is_open',
    'site_maintenance_mode',
    'nav_links',
    'faq_items',
    'privacy_sections',
    'terms_sections',
    ...cmsGroups.flatMap((group) => ('fields' in group ? group.fields.map((field) => field.key) : [])),
  ]);
  const sectionAnchors: Array<{
    id: string;
    title: string;
    description: string;
    count: number;
  }> = cmsGroups.map((group) => ({
    id: slugify(group.title),
    title: group.title,
    description: group.description,
    count: 'fields' in group ? group.fields.length : 1,
  }));
  sectionAnchors.push({
    id: 'legal-content',
    title: 'FAQ & legal blocks',
    description: 'Structured content for FAQ, privacy, and terms.',
    count: 3,
  });
  const managedCount = configs.filter((config) => managedKeys.has(config.key)).length;
  const advancedCount = configs.length - managedCount;

  // Render value editor based on type
  const renderValueEditor = (config: SiteConfigItem) => {
    const currentValue = config.value;

    switch (config.type) {
      case 'text':
      case 'url':
      case 'image':
      case 'number':
        return (
          <input
            type={config.type === 'number' ? 'number' : 'text'}
            defaultValue={currentValue}
            onBlur={(e) => handleConfigValueChange(config.key, e.target.value)}
            className="input-base w-full"
            disabled={isPending}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            defaultValue={currentValue}
            onBlur={(e) => handleConfigValueChange(config.key, e.target.value)}
            className="input-base"
            style={{ fontFamily: 'DM Mono', width: '8rem' }}
            disabled={isPending}
          />
        );

      case 'boolean':
        return (
          <button
            type="button"
            onClick={() => handleConfigValueChange(config.key, powerStates[config.key] ? 'false' : 'true')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              powerStates[config.key] ? 'bg-[#E8540A] text-white' : 'bg-gray-200 text-gray-700'
            }`}
            disabled={isPending}
          >
            {powerStates[config.key] ? 'TRUE' : 'FALSE'}
          </button>
        );

      case 'textarea':
        return (
          <textarea
            defaultValue={currentValue}
            onBlur={(e) => handleConfigValueChange(config.key, e.target.value)}
            className="input-base"
            rows={2}
            style={{ width: '100%', fontFamily: 'DM Sans' }}
            disabled={isPending}
          />
        );

      case 'json':
        return (
          <textarea
            defaultValue={currentValue}
            onBlur={async (e) => {
              try {
                JSON.parse(e.target.value); // Validate JSON
                await handleConfigValueChange(config.key, e.target.value);
              } catch {
                toast.error('Invalid JSON format');
              }
            }}
            className="input-base font-mono text-xs"
            rows={3}
            style={{ width: '100%' }}
            placeholder='{"key": "value"}'
            disabled={isPending}
          />
        );

      default:
        return <span className="text-sm" style={{ color: 'var(--stone)' }}>{currentValue}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <p className="mono-label">Storefront CMS</p>
          <h1 className="page-title">Live Config Editor</h1>
          <p className="page-subtitle">Guided controls first, advanced config only when you need it.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="btn-ghost">
            Open storefront
          </Link>
          <Link href="/dashboard/orders" className="btn-ghost">
            Open active orders
          </Link>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className="card card-premium p-5">
            <p className="mono-label">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
              Everything the storefront reads lives here.
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--stone)' }}>
              The guided panels below update the storefront instantly through Supabase. The advanced table is still
              available for edge cases.
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-3">
                <span className="mono-label block text-[9px]">Managed settings</span>
                <div className="mt-1 font-semibold" style={{ color: 'var(--ink)' }}>
                  {managedCount} live storefront keys
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-3">
                <span className="mono-label block text-[9px]">Advanced config</span>
                <div className="mt-1 font-semibold" style={{ color: 'var(--ink)' }}>
                  {advancedCount} manual entries
                </div>
              </div>
            </div>
          </section>

          <section className="card card-premium p-5">
            <p className="mono-label">Jump to</p>
            <nav className="mt-3 space-y-2">
              {sectionAnchors.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-2xl border border-[var(--border-default)] px-4 py-3 transition-all hover:border-[var(--ember)] hover:bg-[var(--surface-secondary)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {section.title}
                    </div>
                    <span className="rounded-full border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--stone)' }}>
                      {section.count}{' '}
                      {section.id === 'legal-content'
                        ? 'blocks'
                        : section.id === 'navigation'
                          ? 'panel'
                          : 'fields'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs leading-5" style={{ color: 'var(--stone)' }}>
                    {section.description}
                  </div>
                </a>
              ))}
              <a
                href="#advanced-config"
                className="block rounded-2xl border border-dashed border-[var(--border-default)] px-4 py-3 transition-all hover:border-[var(--stone)] hover:bg-[var(--surface-secondary)]"
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  Advanced config
                </div>
                <div className="mt-1 text-xs leading-5" style={{ color: 'var(--stone)' }}>
                  Use this only for keys not covered by the guided panels.
                </div>
              </a>
            </nav>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[var(--border-default)] bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mono-label text-[10px] uppercase tracking-[0.3em] text-[var(--stone)]">
                  Storefront control room
                </p>
                <h2 className="mt-2 text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
                  Use the guided controls first.
                </h2>
                <p className="mt-2 max-w-3xl text-sm" style={{ color: 'var(--stone)' }}>
                  Brand, navigation, page copy, legal content, and live toggles are grouped below so the storefront
                  stays easy to manage.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs font-medium" style={{ color: 'var(--stone)' }}>
                  Supabase-backed
                </span>
                <span className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs font-medium" style={{ color: 'var(--stone)' }}>
                  Live sync
                </span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {powerData.map(({ key, value, label, description, icon: Icon }) => (
              <div key={key} className="rounded-3xl border border-[var(--border-default)] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-4">
                  <div className="rounded-2xl bg-[var(--surface-secondary)] p-3">
                    <Icon size={24} style={{ color: 'var(--stone)' }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                      {label}
                    </h3>
                    <p className="text-sm leading-6" style={{ color: 'var(--stone)' }}>
                      {description}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePowerToggle(key, label)}
                  disabled={isPending}
                  className={`w-full rounded-xl py-3.5 font-bold transition-colors ${
                    value ? 'bg-[#E8540A] text-white hover:bg-[#c94607]' : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {value ? 'OPEN' : 'CLOSED'}
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {cmsGroups.map((group: any) =>
              group.custom === 'nav' ? (
                <NavLinksEditor
                  key={group.title}
                  config={getField('nav_links')}
                  pending={isPending}
                  onSave={(value) =>
                    saveCmsSetting('nav_links', 'Navigation links', 'json', value, 'Primary site navigation', true)
                  }
                />
              ) : (
                <SettingsPanel
                  key={group.title}
                  id={slugify(group.title)}
                  title={group.title}
                  description={group.description}
                  icon={group.icon}
                  prefersReducedMotion={prefersReducedMotion}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.fields.map((field: any) => (
                      <EditableConfigField
                        key={field.key}
                        config={getField(field.key)}
                        field={field}
                        pending={isPending}
                        onSave={saveCmsSetting}
                      />
                    ))}
                  </div>
                </SettingsPanel>
              )
            )}
          </div>

          <section
            id="legal-content"
            className="grid gap-6 xl:grid-cols-3"
            style={{ scrollMarginTop: '6rem' }}
          >
            <ContentBlocksEditor
              title="FAQ blocks"
              description="Manage the FAQ page as a structured list."
              config={getField('faq_items')}
              pending={isPending}
              prefersReducedMotion={prefersReducedMotion}
              onSave={(value) =>
                saveCmsSetting('faq_items', 'FAQ Items', 'json', value, 'Structured FAQ blocks', true)
              }
            />
            <ContentBlocksEditor
              title="Privacy sections"
              description="Control the privacy page as structured legal blocks."
              config={getField('privacy_sections')}
              pending={isPending}
              prefersReducedMotion={prefersReducedMotion}
              onSave={(value) =>
                saveCmsSetting(
                  'privacy_sections',
                  'Privacy Sections',
                  'json',
                  value,
                  'Structured privacy blocks',
                  true
                )
              }
            />
            <ContentBlocksEditor
              title="Terms sections"
              description="Control the terms page as structured legal blocks."
              config={getField('terms_sections')}
              pending={isPending}
              prefersReducedMotion={prefersReducedMotion}
              onSave={(value) =>
                saveCmsSetting('terms_sections', 'Terms Sections', 'json', value, 'Structured terms blocks', true)
              }
            />
          </section>

          <details
            id="advanced-config"
            className="rounded-3xl border border-[var(--border-default)] bg-white/90 p-6 shadow-sm"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mono-label">Advanced config</p>
                  <h3 className="mt-2 text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
                    Manual keys and fallback entries
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: 'var(--stone)' }}>
                    Only use this when a key is not covered by the curated panels above.
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs font-medium" style={{ color: 'var(--stone)' }}>
                  {advancedCount} entries
                </span>
              </div>
            </summary>

            <div className="mt-6 space-y-4">
              <div className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden">
                <div className="table-wrap">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#E5E5E0]">
                        <th className="p-4 text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--stone)' }}>
                          Key
                        </th>
                        <th className="p-4 text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--stone)' }}>
                          Label
                        </th>
                        <th className="p-4 text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--stone)' }}>
                          Type
                        </th>
                        <th className="p-4 text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--stone)' }}>
                          Value
                        </th>
                        <th className="p-4 text-xs font-mono uppercase tracking-wider text-right" style={{ color: 'var(--stone)' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E0]">
                      {configs
                        .filter((config) => !managedKeys.has(config.key))
                        .map((config) => (
                          <tr key={config.key} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4" data-label="Key">
                              <code className="text-xs font-mono" style={{ color: 'var(--stone)' }}>
                                {config.key}
                              </code>
                            </td>
                            <td className="p-4 text-sm" data-label="Label" style={{ color: 'var(--ink)' }}>
                              {config.label}
                            </td>
                            <td className="p-4" data-label="Type">
                              <span
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{ background: 'var(--surface-secondary)', color: 'var(--stone)' }}
                              >
                                {config.type}
                              </span>
                            </td>
                            <td className="p-4" data-label="Value">
                              {renderValueEditor(config)}
                            </td>
                            <td className="p-4 text-right" data-label="Actions">
                              <button
                                onClick={() => handleDeleteConfig(config.key)}
                                className="icon-btn text-red-500"
                                disabled={isPending}
                                title="Delete config"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-dashed border-[#E5E5E0] rounded-xl p-4">
                {!addConfigOpen ? (
                  <button
                    onClick={() => setAddConfigOpen(true)}
                    className="w-full py-4 flex items-center justify-center gap-2 text-sm"
                    style={{ color: 'var(--stone)' }}
                  >
                    <Plus size={16} />
                    Add Config Key
                  </button>
                ) : (
                  <form
                    onSubmit={handleAddConfig}
                    className="grid grid-cols-1 gap-4 items-end sm:grid-cols-2 xl:grid-cols-12"
                  >
                    <div className="xl:col-span-2">
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone)' }}>
                        Key
                      </label>
                      <input
                        type="text"
                        value={newConfig.key}
                        onChange={(e) => setNewConfig((prev) => ({ ...prev, key: e.target.value }))}
                        placeholder="config_key"
                        className="input-base"
                        required
                      />
                    </div>
                    <div className="xl:col-span-3">
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone)' }}>
                        Label
                      </label>
                      <input
                        type="text"
                        value={newConfig.label}
                        onChange={(e) => setNewConfig((prev) => ({ ...prev, label: e.target.value }))}
                        placeholder="Display label"
                        className="input-base"
                        required
                      />
                    </div>
                    <div className="xl:col-span-2">
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone)' }}>
                        Type
                      </label>
                      <select
                        value={newConfig.type}
                        onChange={(e) => setNewConfig((prev) => ({ ...prev, type: e.target.value as any }))}
                        className="input-base"
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="url">URL</option>
                        <option value="image">Image</option>
                        <option value="time">Time</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                    <div className="xl:col-span-4">
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--stone)' }}>
                        Value
                      </label>
                      <input
                        type="text"
                        value={newConfig.value}
                        onChange={(e) => setNewConfig((prev) => ({ ...prev, value: e.target.value }))}
                        placeholder="Default value"
                        className="input-base"
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2 xl:col-span-1">
                      <button type="submit" disabled={isPending} className="btn-primary flex-1">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddConfigOpen(false)}
                        className="btn-ghost"
                        disabled={isPending}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}

function SettingsPanel({
  id,
  title,
  description,
  icon: Icon,
  children,
  prefersReducedMotion,
}: {
  id?: string;
  title: string;
  description: string;
  icon: any;
  children: ReactNode;
  prefersReducedMotion: boolean;
}) {
  return (
    <motion.section
      id={id}
      className="rounded-3xl border border-[var(--border-default)] bg-white/90 p-6 shadow-sm"
      style={{ scrollMarginTop: '6rem' }}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-5 flex items-start gap-4">
        <div className="rounded-2xl bg-[var(--surface-secondary)] p-3">
          <Icon size={20} style={{ color: 'var(--stone)' }} />
        </div>
        <div>
          <h3 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
            {title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--stone)' }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function EditableConfigField({
  config,
  field,
  pending,
  onSave,
}: {
  config?: SiteConfigItem;
  field: {
    key: string;
    label: string;
    kind: 'text' | 'textarea' | 'url' | 'image' | 'number' | 'time';
    fallback: string;
    description: string;
  };
  pending: boolean;
  onSave: (
    key: string,
    label: string,
    type: string,
    value: string,
    description?: string,
    isPublic?: boolean
  ) => void;
}) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const initialValue = config?.value ?? field.fallback ?? '';
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    onSave(field.key, field.label, field.kind, draft, field.description, true);
  };

  return (
    <motion.div
      className="rounded-2xl border border-[var(--border-default)] bg-white p-4"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.3 }}
      whileHover={prefersReducedMotion ? {} : { y: -2 }}
    >
      {field.kind !== 'image' ? (
        <div className="mb-3">
          <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {field.label}
          </div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--stone)' }}>
            {field.description}
          </p>
        </div>
      ) : null}

      {field.kind === 'textarea' ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="input-base w-full"
          disabled={pending}
          placeholder={field.fallback}
        />
      ) : field.kind === 'image' ? (
        <MenuImageField
          label={field.label}
          description={field.description}
          folder="storefront-images"
          value={draft || null}
          onChange={(next) => setDraft(next || '')}
          previewAlt={field.label}
        />
      ) : (
        <input
          type={field.kind}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="input-base w-full"
          disabled={pending}
          placeholder={field.fallback}
        />
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--stone)' }}>
          {config ? `Saved as ${config.key}` : 'Will create on save'}
        </span>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={pending}>
          Save
        </button>
      </div>
    </motion.div>
  );
}

function NavLinksEditor({
  config,
  pending,
  onSave,
}: {
  config?: SiteConfigItem;
  pending: boolean;
  onSave: (value: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const fallback = [
    { href: '/home', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/build', label: 'Build' },
    { href: '/cart', label: 'Cart' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const parse = (value: string) => {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) return fallback;
      return parsed
        .filter(
          (item): item is { href: string; label: string } =>
            Boolean(item && typeof item === 'object' && typeof (item as any).href === 'string' && typeof (item as any).label === 'string')
        )
        .map((item) => ({ href: item.href || '/', label: item.label || 'Link' }));
    } catch {
      return fallback;
    }
  };

  const [rows, setRows] = useState(parse(config?.value || ''));

  useEffect(() => {
    setRows(parse(config?.value || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.value]);

  const updateRow = (index: number, key: 'href' | 'label', value: string) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, { href: '/', label: 'New link' }]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  const save = () => onSave(JSON.stringify(rows));

  return (
    <SettingsPanel
      id={slugify('Navigation')}
      title="Navigation"
      description="Primary links shown in the top bar and mobile drawer."
      icon={Menu}
      prefersReducedMotion={prefersReducedMotion}
    >
      <div className="space-y-3">
        {rows.map((row, index) => (
          <motion.div
            key={`${row.label}-${index}`}
            className="grid gap-3 rounded-2xl border border-[var(--border-default)] p-4 md:grid-cols-[1fr_1fr_auto]"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
          >
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--stone)' }}>
                Label
              </label>
              <input
                className="input-base w-full"
                value={row.label}
                onChange={(e) => updateRow(index, 'label', e.target.value)}
                disabled={pending}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--stone)' }}>
                Link
              </label>
              <input
                className="input-base w-full"
                value={row.href}
                onChange={(e) => updateRow(index, 'href', e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => removeRow(index)} disabled={pending}>
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={addRow} disabled={pending}>
          <Plus size={16} />
          Add link
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={pending}>
          Save navigation
        </button>
      </div>
    </SettingsPanel>
  );
}

function ContentBlocksEditor({
  title,
  description,
  config,
  pending,
  onSave,
  prefersReducedMotion,
}: {
  title: string;
  description: string;
  config?: SiteConfigItem;
  pending: boolean;
  onSave: (value: string) => void;
  prefersReducedMotion: boolean;
}) {
  type ContentRow = {
    title: string;
    body: string;
    linkLabel: string;
    linkHref: string;
  };

  const fallback: ContentRow[] = [
    { title: 'Section title', body: 'Section body', linkLabel: '', linkHref: '' },
  ];

  const parse = (value: string) => {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) return fallback;
      return parsed
        .filter((item): item is Partial<ContentRow> =>
          Boolean(
            item &&
              typeof item === 'object' &&
              typeof (item as any).title === 'string' &&
              typeof (item as any).body === 'string'
          )
        )
        .map((item) => ({
          title: item.title || 'Title',
          body: item.body || 'Body',
          linkLabel: typeof item.linkLabel === 'string' ? item.linkLabel : '',
          linkHref: typeof item.linkHref === 'string' ? item.linkHref : '',
        }));
    } catch {
      return fallback;
    }
  };

  const [rows, setRows] = useState<ContentRow[]>(parse(config?.value || ''));

  useEffect(() => {
    setRows(parse(config?.value || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.value]);

  const updateRow = (index: number, key: keyof ContentRow, value: string) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () =>
    setRows((prev) => [...prev, { title: 'New section', body: 'Write the content here.', linkLabel: '', linkHref: '' }]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  const save = () => onSave(JSON.stringify(rows));

  return (
    <SettingsPanel title={title} description={description} icon={ListChecks} prefersReducedMotion={prefersReducedMotion}>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <motion.div
            key={`${row.title}-${index}`}
            className="rounded-2xl border border-[var(--border-default)] p-4"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--stone)' }}>
                  Title
                </label>
                <input
                  className="input-base w-full"
                  value={row.title}
                  onChange={(e) => updateRow(index, 'title', e.target.value)}
                  disabled={pending}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--stone)' }}>
                  Link label
                </label>
                <input
                  className="input-base w-full"
                  value={row.linkLabel || ''}
                  onChange={(e) => updateRow(index, 'linkLabel', e.target.value)}
                  disabled={pending}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--stone)' }}>
                Body
              </label>
              <textarea
                className="input-base w-full"
                rows={3}
                value={row.body}
                onChange={(e) => updateRow(index, 'body', e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--stone)' }}>
                  Link href
                </label>
                <input
                  className="input-base w-full"
                  value={row.linkHref || ''}
                  onChange={(e) => updateRow(index, 'linkHref', e.target.value)}
                  disabled={pending}
                  placeholder="Optional"
                />
              </div>
              <div className="flex items-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => removeRow(index)} disabled={pending}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={addRow} disabled={pending}>
          <Plus size={16} />
          Add block
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={pending}>
          Save {title.toLowerCase()}
        </button>
      </div>
    </SettingsPanel>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
