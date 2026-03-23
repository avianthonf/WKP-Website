'use client';

import Link from 'next/link';
import { useState, useEffect, useTransition, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { createClient } from '@/lib/supabaseClient';
import { MenuImageField } from '@/components/admin/MenuImageField';
import {
  updateSiteConfig,
  upsertSiteConfig,
} from './actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ChefHat,
  Contact2,
  Globe2,
  Image as ImageIcon,
  Home,
  ListChecks,
  Power,
  Search,
  Settings as SettingsIcon,
  Shield,
  ShoppingCart,
  Store,
  Trash2,
  X,
  Plus,
} from 'lucide-react';
import { Pizza, SiteConfigItem } from '@/types';

interface SettingsClientProps {
  initialConfigs: SiteConfigItem[];
  initialPizzas: Pizza[];
}

type RealtimeSiteConfigPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: SiteConfigItem;
  old: SiteConfigItem;
};

export default function SettingsClient({ initialConfigs, initialPizzas }: SettingsClientProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isPending, startTransition] = useTransition();
  const [configs, setConfigs] = useState<SiteConfigItem[]>(initialConfigs);
  const [pizzas] = useState<Pizza[]>(initialPizzas);
  const [search, setSearch] = useState('');
  const [powerStates, setPowerStates] = useState<Record<string, boolean>>(() => {
    const states: Record<string, boolean> = {};
    initialConfigs.forEach((cfg) => {
      if (cfg.type === 'boolean') {
        states[cfg.key] = cfg.value === 'true';
      }
    });
    return states;
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
        await updateSiteConfig(key, String(!current));
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

  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch = (...values: Array<string | null | undefined>) =>
    !normalizedSearch || values.some((value) => (value || '').toLowerCase().includes(normalizedSearch));

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

  const upsertConfigInState = (
    prev: SiteConfigItem[],
    key: string,
    label: string,
    type: string,
    value: string,
    description: string
  ) => {
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
  };

  const saveHomepagePizzaSelections = (
    heroPizzaId: string,
    featuredPizzaIds: [string, string, string, string]
  ) => {
    const updates = [
      {
        key: 'home_hero_pizza_id',
        label: 'Homepage hero pizza',
        value: heroPizzaId,
        description: 'Pizza shown in the homepage hero showcase.',
      },
      {
        key: 'home_featured_pizza_1_id',
        label: 'Homepage featured pizza 1',
        value: featuredPizzaIds[0],
        description: 'First curated pizza shown on the homepage.',
      },
      {
        key: 'home_featured_pizza_2_id',
        label: 'Homepage featured pizza 2',
        value: featuredPizzaIds[1],
        description: 'Second curated pizza shown on the homepage.',
      },
      {
        key: 'home_featured_pizza_3_id',
        label: 'Homepage featured pizza 3',
        value: featuredPizzaIds[2],
        description: 'Third curated pizza shown on the homepage.',
      },
      {
        key: 'home_featured_pizza_4_id',
        label: 'Homepage featured pizza 4',
        value: featuredPizzaIds[3],
        description: 'Fourth curated pizza shown on the homepage.',
      },
    ] as const;

    startTransition(async () => {
      try {
        for (const update of updates) {
          await upsertSiteConfig(update.key, update.value, update.label, 'text', update.description, true);
        }

        setConfigs((prev) => {
          let next = prev;
          for (const update of updates) {
            next = upsertConfigInState(next, update.key, update.label, 'text', update.value, update.description);
          }
          return next;
        });

        toast.success('Homepage pizzas saved');
      } catch (error: any) {
        toast.error(error.message || 'Failed to save homepage pizzas');
      }
    });
  };

  const getPowerControlData = () => {
    const isOpenConfig = configs.find((c) => c.key === 'is_open');
    const maintenanceConfig = configs.find((c) => c.key === 'site_maintenance_mode');

    return [
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
        { key: 'site_theme_color', label: 'Theme color', kind: 'text', fallback: '#F5F0E8', description: 'Browser theme color in hex format.' },
      ],
    },
    {
      title: 'Storefront Images',
      description: 'Homepage, menu, cart, builder, and brand artwork shown on the storefront.',
      icon: ImageIcon,
      fields: [
        { key: 'brand_logo_image_url', label: 'Brand logo image', kind: 'image', fallback: '', description: 'Shown in the top-left brand area and mobile drawer when set. Leave blank to use the text mark.' },
        { key: 'hero_bg_url', label: 'Home hero background image', kind: 'image', fallback: '', description: 'Background image for the immersive home hero. Falls back behind the home showcase.' },
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
        { key: 'delivery_radius_km', label: 'Delivery radius (km)', kind: 'number', fallback: '0', description: 'Optional delivery radius shown on the delivery information page.' },
        { key: 'opening_time', label: 'Opening time', kind: 'time', fallback: '11:00', description: 'Opening time used across the storefront.' },
        { key: 'closing_time', label: 'Closing time', kind: 'time', fallback: '23:00', description: 'Closing time used across the storefront.' },
        { key: 'store_timezone', label: 'Store timezone', kind: 'text', fallback: 'Asia/Kolkata', description: 'IANA timezone used for open/closed logic and scheduled order validation.' },
        { key: 'min_order_amount', label: 'Minimum order', kind: 'number', fallback: '0', description: 'Shown in cart and delivery pages.' },
      ],
    },
    {
      title: 'Size Labels',
      description: 'Small, medium, and large size names used across the storefront.',
      icon: SettingsIcon,
      fields: [
        { key: 'size_small_label', label: 'Small label', kind: 'text', fallback: 'S', description: 'Short size label for the small pizza size.' },
        { key: 'size_medium_label', label: 'Medium label', kind: 'text', fallback: 'M', description: 'Short size label for the medium pizza size.' },
        { key: 'size_large_label', label: 'Large label', kind: 'text', fallback: 'L', description: 'Short size label for the large pizza size.' },
        { key: 'size_small_name', label: 'Small name', kind: 'text', fallback: 'Small', description: 'Full name for the small pizza size.' },
        { key: 'size_medium_name', label: 'Medium name', kind: 'text', fallback: 'Medium', description: 'Full name for the medium pizza size.' },
        { key: 'size_large_name', label: 'Large name', kind: 'text', fallback: 'Large', description: 'Full name for the large pizza size.' },
      ],
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
        { key: 'home_signature_eyebrow', label: 'Signature eyebrow', kind: 'text', fallback: 'Signature picks', description: 'Section label above the featured pizzas.' },
        { key: 'home_signature_title', label: 'Signature title', kind: 'text', fallback: 'Tap a favorite, feel the rhythm, and order', description: 'Signature section title.' },
        { key: 'home_signature_copy', label: 'Signature copy', kind: 'textarea', fallback: 'A curated line-up that feels more like browsing a chef\'s counter than a spreadsheet.', description: 'Signature section supporting copy.' },
        { key: 'home_signature_tag_bestseller_label', label: 'Signature bestseller tag', kind: 'text', fallback: 'Bestseller', description: 'Tag used on featured cards when an item is a bestseller.' },
        { key: 'home_signature_tag_signature_label', label: 'Signature tag', kind: 'text', fallback: 'Signature', description: 'Tag used on featured cards when an item is not a bestseller.' },
        { key: 'home_signature_fallback_copy', label: 'Signature fallback copy', kind: 'textarea', fallback: 'A crowd-pleasing favorite from the live menu.', description: 'Fallback copy shown on featured cards.' },
        { key: 'home_signature_details_label', label: 'Signature details label', kind: 'text', fallback: 'Details', description: 'Label for the featured card details button.' },
        { key: 'home_signature_order_label', label: 'Signature order label', kind: 'text', fallback: 'Order', description: 'Label for the featured card order button.' },
        { key: 'home_closing_eyebrow', label: 'Closing eyebrow', kind: 'text', fallback: "Tonight's move", description: 'Closing banner eyebrow.' },
        { key: 'home_closing_title', label: 'Closing title', kind: 'text', fallback: 'Pick a craving and let the site do the rest', description: 'Closing banner title.' },
        { key: 'home_closing_primary_cta', label: 'Closing CTA 1', kind: 'text', fallback: 'Start with menu', description: 'First closing banner CTA.' },
        { key: 'home_closing_secondary_cta', label: 'Closing CTA 2', kind: 'text', fallback: 'Build custom', description: 'Second closing banner CTA.' },
        { key: 'home_hero_menu_label', label: 'Hero menu label', kind: 'text', fallback: 'Browse the menu', description: 'Primary action label in the hero button row.' },
        { key: 'home_hero_build_label', label: 'Hero build label', kind: 'text', fallback: 'Build your pizza', description: 'Secondary action label in the hero button row.' },
        { key: 'home_hero_checkout_label', label: 'Hero checkout label', kind: 'text', fallback: 'Checkout now', description: 'Third action label in the hero button row.' },
        { key: 'home_feature_eyebrow_label', label: 'Feature eyebrow label', kind: 'text', fallback: "Chef's pick", description: 'Label shown above the home hero showcase.' },
      ],
    },
    {
      title: 'Menu & Builder',
      description: 'Browse page, detail page, and pizza builder copy.',
      icon: ShoppingCart,
      fields: [
        { key: 'menu_hero_eyebrow', label: 'Hero eyebrow', kind: 'text', fallback: "Tonight's selection", description: 'Eyebrow at the top of the menu hero.' },
        { key: 'menu_whats_showing_label', label: "What's showing label", kind: 'text', fallback: "What's showing", description: 'Stat card label for the live menu count.' },
        { key: 'menu_whats_showing_copy', label: "What's showing copy", kind: 'textarea', fallback: 'A live selection from the kitchen.', description: 'Stat card supporting copy for the live menu count.' },
        { key: 'menu_pizza_moods_label', label: 'Pizza moods label', kind: 'text', fallback: 'Pizza moods', description: 'Stat card label for pizza categories.' },
        { key: 'menu_pizza_moods_copy', label: 'Pizza moods copy', kind: 'textarea', fallback: 'Each one is a different craving lane.', description: 'Stat card supporting copy for pizza categories.' },
        { key: 'menu_fresh_pairings_label', label: 'Fresh pairings label', kind: 'text', fallback: 'Fresh pairings', description: 'Stat card label for topping counts.' },
        { key: 'menu_fresh_pairings_copy', label: 'Fresh pairings copy', kind: 'textarea', fallback: 'Everything that makes the pizza sing.', description: 'Stat card supporting copy for topping counts.' },
        { key: 'menu_browse_label', label: 'Browse label', kind: 'text', fallback: 'Browse the menu', description: 'Label above the browser section.' },
        { key: 'menu_learn_more_label', label: 'Learn more label', kind: 'text', fallback: 'Learn more', description: 'Link label in empty menu states.' },
        { key: 'menu_search_label', label: 'Search label', kind: 'text', fallback: 'Search', description: 'Label above the search field.' },
        { key: 'menu_search_placeholder', label: 'Search placeholder', kind: 'text', fallback: 'Search by craving, topping, or favorite', description: 'Placeholder text for the menu search field.' },
        { key: 'menu_filter_all_label', label: 'All filter label', kind: 'text', fallback: 'All', description: 'Filter chip for all items.' },
        { key: 'menu_filter_pizzas_label', label: 'Pizzas filter label', kind: 'text', fallback: 'Pizzas', description: 'Filter chip for pizzas.' },
        { key: 'menu_filter_addons_label', label: 'Addons filter label', kind: 'text', fallback: 'Addons', description: 'Filter chip for addons.' },
        { key: 'menu_filter_desserts_label', label: 'Desserts filter label', kind: 'text', fallback: 'Desserts', description: 'Filter chip for desserts.' },
        { key: 'menu_filter_veg_label', label: 'Veg filter label', kind: 'text', fallback: 'Veg', description: 'Diet filter chip for vegetarian items.' },
        { key: 'menu_filter_nonveg_label', label: 'Non-veg filter label', kind: 'text', fallback: 'Non-veg', description: 'Diet filter chip for non-vegetarian items.' },
        { key: 'menu_section_eyebrow', label: 'Section eyebrow', kind: 'text', fallback: 'Browse the menu', description: 'Label above the menu browser section.' },
        { key: 'menu_hero_title', label: 'Menu hero title', kind: 'text', fallback: 'A menu that feels like a craving, not a catalog.', description: 'Top title on the menu page.' },
        { key: 'menu_hero_copy', label: 'Menu hero copy', kind: 'textarea', fallback: 'Slide through the menu, find the thing that clicks, and move from discovery to checkout without breaking the mood.', description: 'Top subtitle on the menu page.' },
        { key: 'menu_section_title', label: 'Browse title', kind: 'text', fallback: 'Find the thing that feels right', description: 'Section title above menu filters.' },
        { key: 'menu_section_copy', label: 'Browse copy', kind: 'textarea', fallback: 'Search the live menu and add items with one tap. Pizzas can also be customized in the builder.', description: 'Section copy above menu filters.' },
        { key: 'menu_counts_template', label: 'Counts template', kind: 'text', fallback: '{pizzas} pizzas, {addons} addons, {desserts} desserts', description: 'Summary string shown above the menu grid.' },
        { key: 'menu_empty_matches_title', label: 'No matches title', kind: 'text', fallback: 'No matches found', description: 'Title shown when the search returns no results.' },
        { key: 'menu_empty_matches_body', label: 'No matches body', kind: 'textarea', fallback: 'Try a different search term or clear the filters.', description: 'Body copy shown when the search returns no results.' },
        { key: 'menu_empty_none_title', label: 'No items title', kind: 'text', fallback: 'No menu items yet', description: 'Title shown when the kitchen has not published items yet.' },
        { key: 'menu_empty_open_body', label: 'Open empty body', kind: 'textarea', fallback: 'The menu is waiting for the kitchen to publish items.', description: 'Body copy when the store is open but the menu is empty.' },
        { key: 'menu_empty_closed_body', label: 'Closed empty body', kind: 'textarea', fallback: 'The menu is live, but ordering is paused until the store reopens.', description: 'Body copy when the store is closed.' },
        { key: 'menu_empty_open_action', label: 'Open empty action', kind: 'text', fallback: 'Open builder', description: 'Action label when the store is open but the menu is empty.' },
        { key: 'menu_empty_closed_action', label: 'Closed empty action', kind: 'text', fallback: 'View live status', description: 'Action label when the store is closed.' },
        { key: 'menu_hero_open_builder_label', label: 'Hero open builder', kind: 'text', fallback: 'Open Builder', description: 'Hero CTA when ordering is open.' },
        { key: 'menu_hero_view_status_label', label: 'Hero view status', kind: 'text', fallback: 'View live status', description: 'Hero CTA when ordering is paused.' },
        { key: 'menu_hero_contact_label', label: 'Hero contact label', kind: 'text', fallback: 'Contact us', description: 'Hero secondary CTA when ordering is paused.' },
        { key: 'menu_hero_review_cart_label', label: 'Hero review cart', kind: 'text', fallback: 'Review Cart', description: 'Hero secondary CTA when ordering is open.' },
        { key: 'menu_hero_preview_fallback_title', label: 'Hero fallback title', kind: 'text', fallback: 'Chef Special', description: 'Fallback title shown in the menu hero preview.' },
        { key: 'menu_hero_preview_fallback_copy', label: 'Hero fallback copy', kind: 'textarea', fallback: 'A signature bite from the kitchen right now.', description: 'Fallback copy shown in the menu hero preview.' },
        { key: 'menu_hero_preview_fallback_alt', label: 'Hero fallback alt', kind: 'text', fallback: 'Live menu', description: 'Alt text when the menu hero preview image is missing.' },
        { key: 'menu_pairings_eyebrow', label: 'Pairings eyebrow', kind: 'text', fallback: 'Pairings', description: 'Eyebrow above the toppings grid.' },
        { key: 'menu_pairings_title', label: 'Pairings title', kind: 'text', fallback: 'The little things that complete the bite', description: 'Title above the toppings grid.' },
        { key: 'menu_pairings_copy', label: 'Pairings copy', kind: 'textarea', fallback: 'Toppings are shown as a live ingredient library so customers can see what rounds out the menu.', description: 'Supporting copy for the toppings grid.' },
        { key: 'menu_pairings_none_title', label: 'Pairings empty title', kind: 'text', fallback: 'No pairings yet', description: 'Title shown when no toppings are available.' },
        { key: 'menu_pairings_none_copy', label: 'Pairings empty copy', kind: 'textarea', fallback: 'The kitchen has not published pairings yet. Once they do, they will appear here.', description: 'Body copy shown when no toppings are available.' },
        { key: 'menu_ingredient_veg_label', label: 'Veg ingredient label', kind: 'text', fallback: 'Vegetarian ingredient', description: 'Label used for vegetarian toppings.' },
        { key: 'menu_ingredient_nonveg_label', label: 'Non-veg ingredient label', kind: 'text', fallback: 'Non-veg ingredient', description: 'Label used for non-veg toppings.' },
        { key: 'menu_card_bestseller_label', label: 'Card bestseller label', kind: 'text', fallback: 'Bestseller', description: 'Badge for bestselling items.' },
        { key: 'menu_card_new_label', label: 'Card new label', kind: 'text', fallback: 'New', description: 'Badge for new items.' },
        { key: 'menu_card_spicy_label', label: 'Card spicy label', kind: 'text', fallback: 'Spicy', description: 'Badge for spicy items.' },
        { key: 'menu_card_soldout_label', label: 'Card sold out label', kind: 'text', fallback: 'Sold out', description: 'Badge for sold out items.' },
        { key: 'menu_card_veg_label', label: 'Card veg label', kind: 'text', fallback: 'Veg', description: 'Badge for vegetarian items.' },
        { key: 'menu_card_nonveg_label', label: 'Card non-veg label', kind: 'text', fallback: 'Non-veg', description: 'Badge for non-veg items.' },
        { key: 'menu_card_selected_price_label', label: 'Selected price label', kind: 'text', fallback: 'Selected price', description: 'Label above the selected size price.' },
        { key: 'menu_card_price_note_template', label: 'Price note template', kind: 'text', fallback: '{size} size, ready to add', description: 'Template shown under the selected price.' },
        { key: 'menu_card_pick_size_label', label: 'Pick size label', kind: 'text', fallback: 'Pick a size', description: 'Label above size selection.' },
        { key: 'menu_card_in_cart_label', label: 'In cart label', kind: 'text', fallback: 'In cart', description: 'Label above the cart counts.' },
        { key: 'menu_card_details_label', label: 'Details label', kind: 'text', fallback: 'Details', description: 'Button label for item details.' },
        { key: 'menu_card_add_template', label: 'Add template', kind: 'text', fallback: 'Add {size}', description: 'Button template for adding a size.' },
        { key: 'menu_card_add_to_cart_label', label: 'Add to cart label', kind: 'text', fallback: 'Add to cart', description: 'Button label used for non-pizza cards.' },
        { key: 'menu_card_house_recipe_copy', label: 'House recipe copy', kind: 'textarea', fallback: 'House recipe from the live menu.', description: 'Fallback copy for pizza cards.' },
        { key: 'menu_card_addon_copy', label: 'Addon copy', kind: 'textarea', fallback: 'Flat-price side item', description: 'Fallback copy for addon cards.' },
        { key: 'menu_card_dessert_copy', label: 'Dessert copy', kind: 'textarea', fallback: 'Sweet finish to the meal', description: 'Fallback copy for dessert cards.' },
        { key: 'menu_card_addon_kind_label', label: 'Addon kind label', kind: 'text', fallback: 'Addon', description: 'Kind label for addon cards.' },
        { key: 'menu_card_dessert_kind_label', label: 'Dessert kind label', kind: 'text', fallback: 'Dessert', description: 'Kind label for dessert cards.' },
        { key: 'menu_card_ordering_paused_label', label: 'Ordering paused label', kind: 'text', fallback: 'Ordering paused', description: 'Button label when ordering is paused.' },
        { key: 'menu_card_cart_aria_label', label: 'Cart aria label', kind: 'text', fallback: 'Pizza sizes already in cart', description: 'Accessible label above the cart size counts.' },
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
        { key: 'menu_detail_back_to_menu_label', label: 'Back to menu label', kind: 'text', fallback: 'Back to menu', description: 'Button label returning from the detail page.' },
        { key: 'menu_detail_view_status_label', label: 'View status label', kind: 'text', fallback: 'View live status', description: 'Button label when ordering is paused.' },
        { key: 'menu_detail_view_cart_label', label: 'View cart label', kind: 'text', fallback: 'View cart', description: 'Button label when ordering is open.' },
        { key: 'menu_detail_ordering_paused_label', label: 'Ordering paused label', kind: 'text', fallback: 'Ordering paused', description: 'State label shown when ordering is paused.' },
        { key: 'menu_detail_live_price_label', label: 'Live price label', kind: 'text', fallback: 'Live price', description: 'Label for the live price block.' },
        { key: 'menu_detail_ready_to_add_label', label: 'Ready to add label', kind: 'text', fallback: 'Ready to add', description: 'Label for the ready-to-add block.' },
        { key: 'menu_detail_one_tap_label', label: 'One tap label', kind: 'text', fallback: 'One tap to cart', description: 'Support text for the ready-to-add block.' },
        { key: 'menu_detail_add_from_menu_label', label: 'Add from menu label', kind: 'text', fallback: 'Add from menu', description: 'Action label when the item can be added.' },
        { key: 'menu_detail_status_first_label', label: 'Status first label', kind: 'text', fallback: 'Status first', description: 'Label shown when ordering is paused.' },
        { key: 'menu_detail_fast_lane_label', label: 'Fast lane label', kind: 'text', fallback: 'Fast lane', description: 'Label shown when ordering is open.' },
        { key: 'menu_detail_sold_out_label', label: 'Sold out label', kind: 'text', fallback: 'Sold out', description: 'Status label for sold-out items.' },
        { key: 'menu_detail_available_label', label: 'Available label', kind: 'text', fallback: 'Available', description: 'Status label for available items.' },
        { key: 'menu_detail_paused_copy', label: 'Paused copy', kind: 'textarea', fallback: 'The kitchen is not accepting new orders at the moment.', description: 'Copy shown on detail pages when ordering is paused.' },
        { key: 'menu_detail_status_paused_label', label: 'Paused status copy', kind: 'textarea', fallback: 'Ordering paused while the storefront is closed or in maintenance mode.', description: 'Copy shown in the detail status block while paused.' },
        { key: 'builder_eyebrow', label: 'Builder eyebrow', kind: 'text', fallback: 'Pizza builder', description: 'Eyebrow at the top of the builder page.' },
        { key: 'builder_no_pizzas_title', label: 'No pizzas title', kind: 'text', fallback: 'No pizzas are currently available.', description: 'Title shown when no pizzas exist.' },
        { key: 'builder_no_pizzas_body', label: 'No pizzas body', kind: 'textarea', fallback: 'The menu is empty or all pizzas are disabled.', description: 'Body shown when no pizzas exist.' },
        { key: 'builder_view_status_label', label: 'View status label', kind: 'text', fallback: 'View live status', description: 'Button label when ordering is paused.' },
        { key: 'builder_back_to_menu_label', label: 'Back to menu label', kind: 'text', fallback: 'Back to menu', description: 'Button label returning to the menu.' },
        { key: 'builder_add_custom_label', label: 'Add custom label', kind: 'text', fallback: 'Add custom pizza', description: 'Primary builder CTA when ordering is open.' },
        { key: 'builder_add_to_cart_label', label: 'Add to cart label', kind: 'text', fallback: 'Add to cart', description: 'Primary builder CTA text.' },
        { key: 'builder_notice_copy', label: 'Builder notice copy', kind: 'textarea', fallback: 'Builder selections flow directly into the cart and order handoff.', description: 'Builder notice copy.' },
        { key: 'builder_paused_notice_copy', label: 'Builder paused notice', kind: 'textarea', fallback: 'The storefront is paused, so builder changes will wait until the store reopens.', description: 'Builder paused notice copy.' },
        { key: 'builder_base_pizza_label', label: 'Base pizza label', kind: 'text', fallback: 'Base pizza', description: 'Label for the pizza selector.' },
        { key: 'builder_size_label', label: 'Size label', kind: 'text', fallback: 'Size', description: 'Label for the size selector.' },
        { key: 'builder_quantity_label', label: 'Quantity label', kind: 'text', fallback: 'Quantity', description: 'Label for the quantity input.' },
        { key: 'builder_extras_label', label: 'Extras label', kind: 'text', fallback: 'Extras', description: 'Label for the extras row.' },
        { key: 'builder_notes_label', label: 'Notes label', kind: 'text', fallback: 'Notes', description: 'Label for the notes textarea.' },
        { key: 'builder_notes_placeholder', label: 'Notes placeholder', kind: 'textarea', fallback: 'Sauce preference, crust notes, or any special instruction', description: 'Placeholder for builder notes.' },
        { key: 'builder_preview_copy', label: 'Preview copy', kind: 'textarea', fallback: 'A live recipe from the menu.', description: 'Preview card copy on the builder page.' },
        { key: 'builder_summary_title', label: 'Summary title', kind: 'text', fallback: 'Live summary', description: 'Builder summary title.' },
        { key: 'builder_summary_copy', label: 'Summary copy', kind: 'textarea', fallback: 'This is the exact payload that lands in the cart and final handoff.', description: 'Builder summary copy.' },
        { key: 'builder_summary_base_label', label: 'Summary base label', kind: 'text', fallback: 'Base pizza', description: 'Summary label for the base pizza.' },
        { key: 'builder_summary_size_label', label: 'Summary size label', kind: 'text', fallback: 'Size', description: 'Summary label for the size.' },
        { key: 'builder_summary_extras_label', label: 'Summary extras label', kind: 'text', fallback: 'Extras', description: 'Summary label for extras.' },
        { key: 'builder_summary_none_label', label: 'Summary none label', kind: 'text', fallback: 'None', description: 'Summary label when no extras are selected.' },
        { key: 'builder_summary_quantity_label', label: 'Summary quantity label', kind: 'text', fallback: 'Quantity', description: 'Summary label for quantity.' },
        { key: 'builder_summary_total_label', label: 'Summary total label', kind: 'text', fallback: 'Total', description: 'Summary label for the total price.' },
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
        { key: 'cart_hours_copy', label: 'Hours label', kind: 'text', fallback: 'Store hours:', description: 'Prefix text before hours.' },
        { key: 'cart_empty_copy', label: 'Empty cart copy', kind: 'textarea', fallback: 'Your cart is empty. Add items from Menu or Build first.', description: 'Empty cart message.' },
        { key: 'cart_view_live_status_label', label: 'View live status label', kind: 'text', fallback: 'View live status', description: 'Button label used when ordering is paused.' },
        { key: 'cart_continue_browsing_label', label: 'Continue browsing label', kind: 'text', fallback: 'Continue browsing', description: 'Button label for returning to the menu.' },
        { key: 'cart_customer_name_label', label: 'Customer name label', kind: 'text', fallback: 'Name', description: 'Label for the customer name field.' },
        { key: 'cart_customer_phone_label', label: 'Customer phone label', kind: 'text', fallback: 'Phone', description: 'Label for the customer phone field.' },
        { key: 'cart_customer_name_placeholder', label: 'Customer name placeholder', kind: 'text', fallback: 'Customer name', description: 'Placeholder for the customer name field.' },
        { key: 'cart_customer_phone_placeholder', label: 'Customer phone placeholder', kind: 'text', fallback: '+91 ...', description: 'Placeholder for the customer phone field.' },
        { key: 'cart_fulfillment_label', label: 'Fulfillment label', kind: 'text', fallback: 'Fulfillment', description: 'Label for the fulfillment selector.' },
        { key: 'cart_delivery_option_label', label: 'Delivery option label', kind: 'text', fallback: 'Delivery', description: 'Delivery option label.' },
        { key: 'cart_pickup_option_label', label: 'Pickup option label', kind: 'text', fallback: 'Pickup', description: 'Pickup option label.' },
        { key: 'cart_schedule_notice_copy', label: 'Schedule notice', kind: 'textarea', fallback: 'The kitchen is currently outside its live window, so this order will be scheduled for a later time.', description: 'Callout shown when only scheduled orders are available.' },
        { key: 'cart_schedule_delivery_label', label: 'Delivery time label', kind: 'text', fallback: 'Delivery time', description: 'Label for the scheduled delivery time picker.' },
        { key: 'cart_schedule_pickup_label', label: 'Pickup time label', kind: 'text', fallback: 'Pickup time', description: 'Label for the scheduled pickup time picker.' },
        { key: 'cart_schedule_placeholder', label: 'Schedule placeholder', kind: 'text', fallback: 'Select a time', description: 'Placeholder shown in the schedule time picker.' },
        { key: 'cart_schedule_helper_copy', label: 'Schedule helper copy', kind: 'textarea', fallback: 'Choose a time within {hours}.', description: 'Helper copy shown below the schedule time picker. Supports {hours}.' },
        { key: 'cart_schedule_confirmed_copy', label: 'Schedule confirmed copy', kind: 'textarea', fallback: 'Scheduled for {time}.', description: 'Confirmation copy shown after a valid schedule is selected. Supports {time}.' },
        { key: 'cart_schedule_required_message', label: 'Schedule required message', kind: 'textarea', fallback: 'Choose a delivery time within {hours} before placing the order.', description: 'Validation error shown when a schedule time is missing. Supports {hours}.' },
        { key: 'cart_schedule_invalid_message', label: 'Schedule invalid message', kind: 'textarea', fallback: 'Choose a valid delivery time within {hours}.', description: 'Validation error shown when the chosen schedule is outside the open window. Supports {hours}.' },
        { key: 'cart_delivery_address_label', label: 'Delivery address label', kind: 'text', fallback: 'Delivery address', description: 'Label for the delivery address field.' },
        { key: 'cart_pickup_note_label', label: 'Pickup note label', kind: 'text', fallback: 'Pickup note', description: 'Label for the pickup note field.' },
        { key: 'cart_delivery_address_placeholder', label: 'Delivery placeholder', kind: 'textarea', fallback: 'House, street, landmark', description: 'Placeholder for the delivery address field.' },
        { key: 'cart_pickup_note_placeholder', label: 'Pickup placeholder', kind: 'textarea', fallback: 'Pickup timing or note', description: 'Placeholder for the pickup note field.' },
        { key: 'cart_location_section_title', label: 'Location section title', kind: 'text', fallback: 'Delivery location', description: 'Heading above the delivery location capture section.' },
        { key: 'cart_location_section_copy', label: 'Location section copy', kind: 'textarea', fallback: 'Use your current pin first, then add a typed address only if needed.', description: 'Supporting copy above the delivery location capture controls.' },
        { key: 'cart_location_request_label', label: 'Use current location button', kind: 'text', fallback: 'Use current location', description: 'Button label for requesting geolocation.' },
        { key: 'cart_location_refresh_label', label: 'Refresh location button', kind: 'text', fallback: 'Refresh location', description: 'Button label after a location has already been detected.' },
        { key: 'cart_location_detecting_label', label: 'Finding location label', kind: 'text', fallback: 'Finding your current location...', description: 'Button or status label shown while geolocation is in progress.' },
        { key: 'cart_location_detected_label', label: 'Detected location label', kind: 'text', fallback: 'Detected pin', description: 'Label shown beside the detected coordinates.' },
        { key: 'cart_location_accuracy_label', label: 'Location accuracy label', kind: 'text', fallback: 'Accuracy', description: 'Label shown beside the geolocation accuracy.' },
        { key: 'cart_location_detected_copy', label: 'Detected location helper', kind: 'textarea', fallback: 'Check the pin, then confirm it or switch to a typed address.', description: 'Helper copy shown after a location has been detected.' },
        { key: 'cart_location_confirm_label', label: 'Confirm location button', kind: 'text', fallback: 'Use this location', description: 'Button label for confirming the detected location.' },
        { key: 'cart_location_confirmed_label', label: 'Location confirmed copy', kind: 'textarea', fallback: 'Location confirmed. This pin will be included with the order.', description: 'Success copy shown after confirming the detected location.' },
        { key: 'cart_location_map_link_label', label: 'Open map pin label', kind: 'text', fallback: 'Open pin in Google Maps', description: 'Link label for opening the detected pin in Google Maps.' },
        { key: 'cart_location_manual_show_label', label: 'Show manual address button', kind: 'text', fallback: 'Type address instead', description: 'Button label for revealing the typed address textarea.' },
        { key: 'cart_location_manual_hide_label', label: 'Hide manual address button', kind: 'text', fallback: 'Hide address box', description: 'Button label for hiding the typed address textarea.' },
        { key: 'cart_location_manual_label', label: 'Manual address label', kind: 'text', fallback: 'Delivery address', description: 'Label for the typed address textarea.' },
        { key: 'cart_location_manual_placeholder', label: 'Manual address placeholder', kind: 'textarea', fallback: 'House, street, landmark', description: 'Placeholder for the typed address textarea.' },
        { key: 'cart_notes_label', label: 'Notes label', kind: 'text', fallback: 'Notes', description: 'Label for the order notes field.' },
        { key: 'cart_notes_placeholder', label: 'Notes placeholder', kind: 'textarea', fallback: 'Allergies, sauce preference, or timing notes', description: 'Placeholder for the order notes field.' },
        { key: 'cart_place_order_label', label: 'Place order label', kind: 'text', fallback: 'Place order', description: 'Submit button label.' },
        { key: 'cart_sending_label', label: 'Sending label', kind: 'text', fallback: 'Sending...', description: 'Submit button label while sending.' },
        { key: 'cart_empty_summary_title', label: 'Empty summary title', kind: 'text', fallback: 'Your cart is empty', description: 'Title shown when the cart has no items.' },
        { key: 'cart_empty_summary_copy', label: 'Empty summary copy', kind: 'textarea', fallback: 'Add items from Menu or Build first.', description: 'Body shown when the cart has no items.' },
        { key: 'cart_order_summary_title', label: 'Order summary title', kind: 'text', fallback: 'Order summary', description: 'Title above the cart summary list.' },
        { key: 'cart_items_label', label: 'Cart items label', kind: 'text', fallback: 'Cart items', description: 'Title above the line item list.' },
        { key: 'cart_subtotal_label', label: 'Subtotal label', kind: 'text', fallback: 'Subtotal', description: 'Label for the subtotal row.' },
        { key: 'cart_items_count_label', label: 'Items count label', kind: 'text', fallback: 'Items', description: 'Label for the item count row.' },
        { key: 'cart_remove_label', label: 'Remove label', kind: 'text', fallback: 'Remove', description: 'Label for removing an item.' },
        { key: 'cart_item_kind_pizza_label', label: 'Pizza kind label', kind: 'text', fallback: 'Pizza', description: 'Label for pizza items in the cart summary.' },
        { key: 'cart_item_kind_addon_label', label: 'Addon kind label', kind: 'text', fallback: 'Addon', description: 'Label for addon items in the cart summary.' },
        { key: 'cart_item_kind_extra_label', label: 'Extra kind label', kind: 'text', fallback: 'Extra', description: 'Label for extra items in the cart summary.' },
        { key: 'cart_item_kind_dessert_label', label: 'Dessert kind label', kind: 'text', fallback: 'Dessert', description: 'Label for dessert items in the cart summary.' },
        { key: 'cart_order_saved_label', label: 'Order saved label', kind: 'text', fallback: 'The order is saved and ready to send.', description: 'Success block title after checkout.' },
        { key: 'cart_order_number_label', label: 'Order number label', kind: 'text', fallback: 'Order number', description: 'Label for the order number.' },
        { key: 'cart_next_step_label', label: 'Next step label', kind: 'text', fallback: 'Next step', description: 'Label for the next step block.' },
        { key: 'cart_next_step_copy', label: 'Next step copy', kind: 'textarea', fallback: 'Scan the QR or open the link', description: 'Copy for the next step block.' },
        { key: 'cart_scan_qr_label', label: 'QR label', kind: 'textarea', fallback: 'Scan the QR code with your phone to open the exact order message, then send it from there.', description: 'Helper copy for the QR block.' },
        { key: 'cart_open_pc_label', label: 'Open on PC label', kind: 'text', fallback: 'Open on this computer', description: 'Button label to open the chat on desktop.' },
        { key: 'cart_back_to_menu_label', label: 'Back to menu label', kind: 'text', fallback: 'Back to menu', description: 'Button label returning to the menu from handoff.' },
        { key: 'cart_view_status_label', label: 'View status label', kind: 'text', fallback: 'View status', description: 'Button label to view live status from handoff.' },
        { key: 'cart_handoff_title', label: 'Handoff title', kind: 'text', fallback: 'Send from your phone', description: 'Title above the post-checkout handoff.' },
        { key: 'cart_handoff_order_prefix', label: 'Handoff order prefix', kind: 'text', fallback: 'Order #', description: 'Prefix before the order number.' },
        { key: 'cart_size_summary_label', label: 'Size summary label', kind: 'text', fallback: 'Pizza sizes in cart', description: 'Label above the size count pills.' },
        { key: 'cart_handoff_ready_copy', label: 'Handoff ready copy', kind: 'textarea', fallback: 'The order is saved and ready to send.', description: 'Copy shown when the order is ready to send.' },
        { key: 'cart_handoff_open_pc_copy', label: 'Handoff open PC copy', kind: 'text', fallback: 'Open on this computer', description: 'Copy shown below the QR block.' },
        { key: 'cart_order_saved_copy', label: 'Order saved copy', kind: 'textarea', fallback: 'The order is saved for kitchen tracking and reporting before the handoff opens.', description: 'Footnote shown after checkout.' },
        { key: 'cart_preview_image_alt', label: 'Preview image alt', kind: 'text', fallback: 'Live menu preview', description: 'Alt text for the cart preview image.' },
        { key: 'cart_qr_alt_prefix', label: 'QR alt prefix', kind: 'text', fallback: 'QR code for order', description: 'Alt prefix for the QR code image.' },
        { key: 'cart_minimum_not_set_label', label: 'Minimum not set label', kind: 'text', fallback: 'not set', description: 'Text shown when no minimum order is configured.' },
        { key: 'cart_pizza_summary_template', label: 'Pizza summary template', kind: 'text', fallback: '{count} pizza{plural} across {sizes}', description: 'Template for the cart size summary line.' },
        { key: 'cart_paused_maintenance_message', label: 'Maintenance paused message', kind: 'textarea', fallback: 'Orders are paused while the storefront is in maintenance mode.', description: 'Message shown when checkout is paused for maintenance.' },
        { key: 'cart_paused_closed_message', label: 'Closed paused message', kind: 'textarea', fallback: 'Orders are currently closed. Please try again when the store is open.', description: 'Message shown when checkout is paused because the store is closed.' },
        { key: 'cart_missing_customer_message', label: 'Missing customer message', kind: 'textarea', fallback: 'Please fill the customer details before sending the order.', description: 'Validation error when customer details are incomplete.' },
        { key: 'cart_missing_address_message', label: 'Missing address message', kind: 'textarea', fallback: 'Please add a delivery address or switch to pickup.', description: 'Validation error when a delivery address is missing.' },
        { key: 'cart_location_permission_denied_message', label: 'Location denied message', kind: 'textarea', fallback: 'Location permission was blocked. Type the delivery address instead.', description: 'Validation or helper copy shown when geolocation permission is denied.' },
        { key: 'cart_location_unavailable_message', label: 'Location unavailable message', kind: 'textarea', fallback: 'We could not read your location. Type the address instead.', description: 'Validation or helper copy shown when geolocation cannot return a result.' },
        { key: 'cart_location_missing_message', label: 'Location missing message', kind: 'textarea', fallback: 'Share a pinned location or type the delivery address before sending the order.', description: 'Validation error when neither a confirmed pin nor a typed address is provided.' },
        { key: 'cart_general_error_message', label: 'General error message', kind: 'textarea', fallback: 'We could not place the order.', description: 'Fallback error message for checkout failures.' },
        { key: 'cart_missing_store_name_message', label: 'Missing store name message', kind: 'textarea', fallback: 'Store name is missing. Please try again in a moment.', description: 'Error shown if the storefront is missing the store name setting.' },
        { key: 'cart_missing_whatsapp_number_message', label: 'Missing order number message', kind: 'textarea', fallback: 'Order chat is not configured yet. Please contact the store directly.', description: 'Error shown if the storefront is missing the order chat number.' },
        { key: 'cart_pickup_requested_note', label: 'Pickup requested note', kind: 'text', fallback: 'Pickup requested', description: 'Stored note text when a pickup order is sent without a pickup note.' },
        { key: 'cart_whatsapp_heading_label', label: 'WhatsApp heading label', kind: 'text', fallback: 'Order', description: 'Heading label used in the generated order message.' },
        { key: 'cart_whatsapp_order_number_prefix', label: 'WhatsApp order number prefix', kind: 'text', fallback: '#', description: 'Prefix shown before the order number in the generated order message.' },
        { key: 'cart_whatsapp_name_label', label: 'WhatsApp name label', kind: 'text', fallback: 'Name', description: 'Label for the customer name in the generated order message.' },
        { key: 'cart_whatsapp_fulfillment_label', label: 'WhatsApp fulfillment label', kind: 'text', fallback: 'Fulfillment', description: 'Label for the fulfillment row in the generated order message.' },
        { key: 'cart_whatsapp_delivery_label', label: 'WhatsApp delivery label', kind: 'text', fallback: 'Delivery', description: 'Value used for delivery orders in the generated order message.' },
        { key: 'cart_whatsapp_pickup_label', label: 'WhatsApp pickup label', kind: 'text', fallback: 'Pickup', description: 'Value used for pickup orders in the generated order message.' },
        { key: 'cart_whatsapp_phone_label', label: 'WhatsApp phone label', kind: 'text', fallback: 'Phone', description: 'Label for the customer phone row in the generated order message.' },
        { key: 'cart_whatsapp_address_label', label: 'WhatsApp address label', kind: 'text', fallback: 'Address', description: 'Label for the delivery address row in the generated order message.' },
        { key: 'cart_whatsapp_location_link_label', label: 'WhatsApp location pin label', kind: 'text', fallback: 'Location pin', description: 'Label for the location pin row in the generated order message.' },
        { key: 'cart_whatsapp_pickup_note_label', label: 'WhatsApp pickup note label', kind: 'text', fallback: 'Pickup note', description: 'Label for the pickup note row in the generated order message.' },
        { key: 'cart_whatsapp_notes_label', label: 'WhatsApp notes label', kind: 'text', fallback: 'Notes', description: 'Label for the notes row in the generated order message.' },
        { key: 'cart_whatsapp_schedule_label', label: 'WhatsApp schedule label', kind: 'text', fallback: 'Scheduled for', description: 'Label for the scheduled delivery row in the generated order message.' },
        { key: 'cart_whatsapp_items_heading', label: 'WhatsApp items heading', kind: 'text', fallback: 'Items', description: 'Heading above the line items in the generated order message.' },
        { key: 'cart_whatsapp_total_label', label: 'WhatsApp total label', kind: 'text', fallback: 'Total', description: 'Label for the total row in the generated order message.' },
        { key: 'cart_whatsapp_currency_label', label: 'WhatsApp currency label', kind: 'text', fallback: 'INR', description: 'Currency label used in the generated order message.' },
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
        { key: 'about_hours_label', label: 'About hours label', kind: 'text', fallback: 'Hours', description: 'Label used in the About summary rail for hours.' },
        { key: 'about_min_order_label', label: 'About min order label', kind: 'text', fallback: 'Min order', description: 'Label used in the About summary rail for minimum order.' },
        { key: 'about_address_label', label: 'About address label', kind: 'text', fallback: 'Address', description: 'Label used in the About summary rail for address.' },
        { key: 'about_location_title', label: 'About location title', kind: 'text', fallback: 'Location', description: 'About page location card title.' },
        { key: 'about_map_action_label', label: 'About map action', kind: 'text', fallback: 'Open map', description: 'Link label for the about page map block.' },
        { key: 'about_map_missing_copy', label: 'About map missing copy', kind: 'textarea', fallback: 'Map link is set in the store settings.', description: 'Copy shown when the map link is missing.' },
        { key: 'contact_hero_title', label: 'Contact hero title', kind: 'text', fallback: 'Talk to the kitchen directly.', description: 'Contact page title.' },
        { key: 'contact_hero_copy', label: 'Contact hero copy', kind: 'textarea', fallback: 'Orders, delivery questions, and special notes all work best through WhatsApp. This page exists for convenience and trust.', description: 'Contact page supporting copy.' },
        { key: 'contact_eyebrow', label: 'Contact eyebrow', kind: 'text', fallback: 'Contact', description: 'Eyebrow shown on the Contact page.' },
        { key: 'contact_whatsapp_label', label: 'Contact WhatsApp label', kind: 'text', fallback: 'WhatsApp', description: 'Label used in the Contact summary rail for WhatsApp.' },
        { key: 'contact_address_label', label: 'Contact address label', kind: 'text', fallback: 'Address', description: 'Label used in the Contact summary rail for address.' },
        { key: 'contact_hours_label', label: 'Contact hours label', kind: 'text', fallback: 'Hours', description: 'Label used in the Contact summary rail for hours.' },
        { key: 'contact_map_title', label: 'Contact map title', kind: 'text', fallback: 'Map', description: 'Contact map card title.' },
        { key: 'contact_map_body', label: 'Contact map body', kind: 'text', fallback: 'Find us easily.', description: 'Contact map card body.' },
        { key: 'contact_email_title', label: 'Contact email title', kind: 'text', fallback: 'Email', description: 'Contact email card title.' },
        { key: 'contact_message_label', label: 'Contact message label', kind: 'text', fallback: 'Message us', description: 'Button label for the contact action.' },
        { key: 'contact_order_prefill_message', label: 'Contact order prefill', kind: 'textarea', fallback: 'Hi, I would like to place an order or ask a question.', description: 'Prefilled message used when opening the contact chat action.' },
        { key: 'contact_map_action_label', label: 'Contact map action', kind: 'text', fallback: 'Open in Maps', description: 'Link label for the contact map block.' },
        { key: 'contact_map_missing_copy', label: 'Contact map missing copy', kind: 'textarea', fallback: 'Set the maps link from the store settings.', description: 'Copy shown when the map link is missing on the contact page.' },
        { key: 'delivery_eyebrow', label: 'Delivery eyebrow', kind: 'text', fallback: 'Delivery info', description: 'Eyebrow shown on the Delivery page.' },
        { key: 'delivery_hero_title', label: 'Delivery hero title', kind: 'text', fallback: 'Delivery that is clear before the order starts.', description: 'Delivery page title.' },
        { key: 'delivery_hero_copy', label: 'Delivery hero copy', kind: 'textarea', fallback: 'Hours, address, and minimums are pulled from the store settings.', description: 'Delivery page supporting copy.' },
        { key: 'delivery_hours_title', label: 'Delivery hours title', kind: 'text', fallback: 'Hours', description: 'Delivery hours card title.' },
        { key: 'delivery_hours_copy', label: 'Delivery hours copy', kind: 'textarea', fallback: 'If the store is closed, the open/closed state comes from the live settings.', description: 'Delivery hours card copy.' },
        { key: 'delivery_address_title', label: 'Delivery address title', kind: 'text', fallback: 'Address', description: 'Delivery address card title.' },
        { key: 'delivery_min_title', label: 'Delivery minimum title', kind: 'text', fallback: 'Minimum', description: 'Delivery minimum card title.' },
        { key: 'delivery_min_copy', label: 'Delivery minimum copy', kind: 'textarea', fallback: 'Shown in cart before checkout, so there are no surprises.', description: 'Delivery minimum card copy.' },
        { key: 'delivery_radius_title', label: 'Delivery radius title', kind: 'text', fallback: 'Radius', description: 'Delivery radius card title.' },
        { key: 'delivery_radius_copy', label: 'Delivery radius copy', kind: 'textarea', fallback: 'Approximate delivery coverage from the store.', description: 'Delivery radius card copy.' },
        { key: 'delivery_order_chat_label', label: 'Delivery chat label', kind: 'text', fallback: 'Open order chat', description: 'Button label for the delivery page chat action.' },
        { key: 'delivery_order_prefill_message', label: 'Delivery order prefill', kind: 'textarea', fallback: 'Hi, I would like to check delivery details for my order.', description: 'Prefilled message used when opening the delivery chat action.' },
        { key: 'delivery_map_action_label', label: 'Delivery map action', kind: 'text', fallback: 'Open map', description: 'Link label for the delivery map block.' },
        { key: 'delivery_map_missing_copy', label: 'Delivery map missing copy', kind: 'textarea', fallback: 'Map link is managed from the store settings.', description: 'Copy shown when the map link is missing on the delivery page.' },
        { key: 'status_eyebrow', label: 'Status eyebrow', kind: 'text', fallback: 'Live status', description: 'Eyebrow shown on the Status page.' },
        { key: 'status_title_open', label: 'Status open title', kind: 'text', fallback: 'We are open.', description: 'Live status page title when open.' },
        { key: 'status_title_after_hours', label: 'Status after-hours title', kind: 'text', fallback: 'We are closed right now, but scheduling is open.', description: 'Live status page title when the store is outside the live window but scheduled orders are allowed.' },
        { key: 'status_title_closed', label: 'Status closed title', kind: 'text', fallback: 'We are closed right now.', description: 'Live status page title when closed.' },
        { key: 'status_title_maintenance', label: 'Status maintenance title', kind: 'text', fallback: 'Maintenance mode is active.', description: 'Live status page title during maintenance.' },
        { key: 'status_hero_copy', label: 'Status hero copy', kind: 'textarea', fallback: 'This status follows the live settings and is what the storefront will show before checkout.', description: 'Status page hero copy.' },
        { key: 'status_state_title', label: 'Status state title', kind: 'text', fallback: 'State', description: 'Status card title for the live state.' },
        { key: 'status_state_copy', label: 'Status state copy', kind: 'textarea', fallback: 'The state is live from the store settings.', description: 'Status card copy for the live state.' },
        { key: 'status_hours_title', label: 'Status hours title', kind: 'text', fallback: 'Hours', description: 'Status hours card title.' },
        { key: 'status_hours_copy', label: 'Status hours copy', kind: 'textarea', fallback: 'Update hours in the store settings.', description: 'Status hours card copy.' },
        { key: 'status_path_title', label: 'Status path title', kind: 'text', fallback: 'Order path', description: 'Status order path card title.' },
        { key: 'status_path_copy', label: 'Status path copy', kind: 'textarea', fallback: 'Menu -> cart -> WhatsApp.', description: 'Status order path card copy.' },
        { key: 'status_state_open_label', label: 'Status open label', kind: 'text', fallback: 'Open', description: 'Status value shown when the store is open.' },
        { key: 'status_state_after_hours_label', label: 'Status after-hours label', kind: 'text', fallback: 'Scheduling', description: 'Status value shown when only scheduled orders are available.' },
        { key: 'status_state_closed_label', label: 'Status closed label', kind: 'text', fallback: 'Closed', description: 'Status value shown when the store is closed.' },
        { key: 'status_state_maintenance_label', label: 'Status maintenance label', kind: 'text', fallback: 'Maintenance', description: 'Status value shown during maintenance mode.' },
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
        { key: 'faq_back_to_menu_label', label: 'FAQ back button', kind: 'text', fallback: 'Back to menu', description: 'Button label returning to the menu from the FAQ page.' },
        { key: 'privacy_eyebrow', label: 'Privacy eyebrow', kind: 'text', fallback: 'Privacy', description: 'Eyebrow shown on the Privacy page.' },
        { key: 'privacy_hero_title', label: 'Privacy hero title', kind: 'text', fallback: 'We only keep what we need to fulfill the order.', description: 'Privacy page title.' },
        { key: 'privacy_hero_copy', label: 'Privacy hero copy', kind: 'textarea', fallback: 'The storefront stores customer and order details in Supabase so the kitchen can fulfill, track, and review orders.', description: 'Privacy page supporting copy.' },
        { key: 'privacy_back_to_menu_label', label: 'Privacy back button', kind: 'text', fallback: 'Back to menu', description: 'Button label returning to the menu from the Privacy page.' },
        { key: 'terms_eyebrow', label: 'Terms eyebrow', kind: 'text', fallback: 'Terms', description: 'Eyebrow shown on the Terms page.' },
        { key: 'terms_hero_title', label: 'Terms hero title', kind: 'text', fallback: 'Plain terms for a straightforward order flow.', description: 'Terms page title.' },
        { key: 'terms_hero_copy', label: 'Terms hero copy', kind: 'textarea', fallback: 'Placing an order means the kitchen may contact you through WhatsApp to confirm details or delivery timing.', description: 'Terms page supporting copy.' },
        { key: 'terms_contact_us_label', label: 'Terms contact button', kind: 'text', fallback: 'Contact us', description: 'Button label returning to contact from the Terms page.' },
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
  type CmsField = {
    key: string;
    label: string;
    kind: 'text' | 'textarea' | 'url' | 'image' | 'number' | 'time' | 'boolean' | 'json';
    fallback: string;
    description: string;
  };

  type PageSectionSpec = {
    id: string;
    title: string;
    description: string;
    icon: any;
    fields: CmsField[];
    custom?: 'nav';
    extra?: {
      key: string;
      title: string;
      description: string;
    };
  };

  const allManagedFields: CmsField[] = cmsGroups.flatMap((group) => ('fields' in group ? [...group.fields] : []));
  const storefrontManagedFields = allManagedFields;
  const pageScopedPrefixes = ['home_', 'menu_', 'build_', 'cart_', 'about_', 'contact_', 'delivery_', 'status_', 'faq_', 'privacy_', 'terms_', 'not_found_'] as const;
  const isPageScopedKey = (key: string) => pageScopedPrefixes.some((prefix) => key.startsWith(prefix));
  const getFieldsByPrefix = (...prefixes: string[]) =>
    storefrontManagedFields.filter((field) => prefixes.some((prefix) => field.key.startsWith(prefix)));
  const homepagePizzaKeys = [
    'home_hero_pizza_id',
    'home_featured_pizza_1_id',
    'home_featured_pizza_2_id',
    'home_featured_pizza_3_id',
    'home_featured_pizza_4_id',
  ];
  const globalSharedFields = storefrontManagedFields.filter((field) => !isPageScopedKey(field.key));
  const pageSectionSpecs: PageSectionSpec[] = [
    {
      id: 'global-shared',
      title: 'Global / Shared',
      description: 'Branding, imagery, hours, navigation, and other shared storefront content.',
      icon: Store,
      fields: globalSharedFields,
    },
    {
      id: 'home',
      title: 'Home',
      description: 'Homepage hero, feature copy, curated pizza picks, intro rail, and closing banner.',
      icon: Home,
      fields: getFieldsByPrefix('home_'),
    },
    {
      id: 'menu',
      title: 'Menu',
      description: 'Menu page hero, browsing copy, filters, cards, and menu detail copy.',
      icon: ShoppingCart,
      fields: getFieldsByPrefix('menu_'),
    },
    {
      id: 'build',
      title: 'Build',
      description: 'Pizza builder hero, form labels, and live summary copy.',
      icon: ChefHat,
      fields: getFieldsByPrefix('build_'),
    },
    {
      id: 'cart',
      title: 'Cart',
      description: 'Cart page labels, delivery prompts, scheduling, and WhatsApp handoff copy.',
      icon: ShoppingCart,
      fields: getFieldsByPrefix('cart_'),
    },
    {
      id: 'about',
      title: 'About',
      description: 'About page hero, summary rail labels, and workflow copy.',
      icon: Store,
      fields: getFieldsByPrefix('about_'),
    },
    {
      id: 'contact',
      title: 'Contact',
      description: 'Contact page hero, contact summary rail, and action copy.',
      icon: Contact2,
      fields: getFieldsByPrefix('contact_'),
    },
    {
      id: 'delivery',
      title: 'Delivery',
      description: 'Delivery page hero, radius, address, and minimum-order copy.',
      icon: Globe2,
      fields: getFieldsByPrefix('delivery_'),
    },
    {
      id: 'status',
      title: 'Status',
      description: 'Open, closed, after-hours, and maintenance messaging.',
      icon: Activity,
      fields: getFieldsByPrefix('status_'),
    },
    {
      id: 'faq',
      title: 'FAQ',
      description: 'FAQ page hero copy and structured FAQ blocks.',
      icon: ListChecks,
      fields: getFieldsByPrefix('faq_'),
      extra: {
        key: 'faq_items',
        title: 'FAQ blocks',
        description: 'Structured FAQ entries shown on the FAQ page.',
      },
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Privacy page hero copy and structured privacy blocks.',
      icon: Shield,
      fields: getFieldsByPrefix('privacy_'),
      extra: {
        key: 'privacy_sections',
        title: 'Privacy sections',
        description: 'Structured privacy content shown on the Privacy page.',
      },
    },
    {
      id: 'terms',
      title: 'Terms',
      description: 'Terms page hero copy and structured terms blocks.',
      icon: Shield,
      fields: getFieldsByPrefix('terms_'),
      extra: {
        key: 'terms_sections',
        title: 'Terms sections',
        description: 'Structured terms content shown on the Terms page.',
      },
    },
    {
      id: 'not-found',
      title: '404 Page',
      description: 'Not-found page copy for dead-end routes and missing pages.',
      icon: X,
      fields: getFieldsByPrefix('not_found_'),
    },
  ];
  const managedKeys = new Set<string>([
    'is_open',
    'site_maintenance_mode',
    'nav_links',
    'faq_items',
    'privacy_sections',
    'terms_sections',
    ...homepagePizzaKeys,
    ...storefrontManagedFields.map((field) => field.key),
  ]);
  const managedCount = configs.filter((config) => managedKeys.has(config.key)).length;
  const visibleManagedCount = configs.filter(
    (config) => managedKeys.has(config.key) && matchesSearch(config.key, config.label, config.description, config.value)
  ).length;
  const sectionAnchors: Array<{
    id: string;
    title: string;
    description: string;
    count: number;
  }> = [
    ...pageSectionSpecs.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      count:
        section.fields.length +
        (section.id === 'global-shared' ? 1 : 0) +
        (section.id === 'home' ? homepagePizzaKeys.length : 0) +
        (section.extra ? 1 : 0),
    })),
  ];
  const visibleSectionAnchors = sectionAnchors.filter((section) =>
    matchesSearch(section.title, section.description, String(section.count))
  );
  const visiblePageSections = pageSectionSpecs.filter((section) => {
    const values: Array<string | null | undefined> = [section.title, section.description];

    section.fields.forEach((field) => {
      values.push(field.key, field.label, field.description, getField(field.key)?.value);
    });

    if (section.id === 'global-shared') {
      values.push(getField('nav_links')?.value);
    }

    if (section.extra) {
      values.push(getField(section.extra.key)?.value, section.extra.title, section.extra.description);
    }

    return matchesSearch(...values);
  });

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <p className="mono-label">Storefront CMS</p>
          <h1 className="page-title">Live Config Editor</h1>
          <p className="page-subtitle">Page-wise controls ordered to match the storefront itself.</p>
        </div>
        <div className="dashboard-settings__header-actions">
          <div className="dashboard-search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search settings, keys, or copy"
              aria-label="Search settings"
            />
            {search ? (
              <button type="button" className="dashboard-search__clear" onClick={() => setSearch('')}>
                Clear
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="btn-ghost">
              Open storefront
            </Link>
            <Link href="/dashboard/orders" className="btn-ghost">
              Open active orders
            </Link>
          </div>
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
              The guided panels below update the storefront instantly through Supabase and are arranged in the same
              order customers see them.
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-3">
                <span className="mono-label block text-[9px]">Managed settings</span>
                <div className="mt-1 font-semibold" style={{ color: 'var(--ink)' }}>
                  {visibleManagedCount} matching of {managedCount} managed keys
                </div>
              </div>
            </div>
          </section>

          <section className="card card-premium p-5">
            <p className="mono-label">Jump to</p>
            <nav className="mt-3 space-y-2">
              {visibleSectionAnchors.map((section) => (
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
                      {section.count} controls
                    </span>
                  </div>
                  <div className="mt-1 text-xs leading-5" style={{ color: 'var(--stone)' }}>
                    {section.description}
                  </div>
                </a>
              ))}
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
                  Edit the storefront page by page.
                </h2>
                <p className="mt-2 max-w-3xl text-sm" style={{ color: 'var(--stone)' }}>
                  Brand, shared assets, page copy, and live toggles are grouped below in storefront order.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs font-medium" style={{ color: 'var(--stone)' }}>
                  {visibleManagedCount} visible managed
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
                    value
                      ? 'bg-[var(--ember)] text-white hover:bg-[var(--ember-dark)]'
                      : 'border border-[var(--border-default)] bg-[var(--surface-secondary)] text-[var(--ink)] hover:bg-white'
                  }`}
                >
                  {value ? 'OPEN' : 'CLOSED'}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-6">
              {visiblePageSections.length ? (
                visiblePageSections.map((section) => (
                  <div key={section.id} className="space-y-6">
                    <SettingsPanel
                      id={section.id}
                      title={section.title}
                      description={section.description}
                      icon={section.icon}
                      prefersReducedMotion={prefersReducedMotion}
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        {section.fields.map((field) => (
                          <EditableConfigField
                            key={field.key}
                            config={getField(field.key)}
                            field={field}
                            pending={isPending}
                            onSave={saveCmsSetting}
                          />
                        ))}
                      </div>
                      {section.id === 'global-shared' ? (
                        <div className="mt-6">
                          <NavLinksEditor
                            config={getField('nav_links')}
                            pending={isPending}
                            onSave={(value) =>
                              saveCmsSetting('nav_links', 'Navigation links', 'json', value, 'Primary site navigation', true)
                            }
                          />
                        </div>
                      ) : null}
                    </SettingsPanel>

                    {section.id === 'home' ? (
                      <HomepagePizzaPicker
                        pizzas={pizzas}
                        heroPizzaId={getField('home_hero_pizza_id')?.value || ''}
                        featuredPizzaIds={[
                          getField('home_featured_pizza_1_id')?.value || '',
                          getField('home_featured_pizza_2_id')?.value || '',
                          getField('home_featured_pizza_3_id')?.value || '',
                          getField('home_featured_pizza_4_id')?.value || '',
                        ]}
                        pending={isPending}
                        onSave={saveHomepagePizzaSelections}
                      />
                    ) : null}

                  {section.extra ? (
                    <ContentBlocksEditor
                      id={`${section.id}-blocks`}
                      title={section.extra!.title}
                      description={section.extra!.description}
                      config={getField(section.extra!.key)}
                      pending={isPending}
                      prefersReducedMotion={prefersReducedMotion}
                      onSave={(value) =>
                        saveCmsSetting(
                          section.extra!.key,
                          section.extra!.title,
                          'json',
                          value,
                          section.extra!.description,
                          true
                        )
                      }
                    />
                  ) : null}
                </div>
              ))
            ) : (
              <section className="rounded-3xl border border-dashed border-[var(--border-default)] bg-white/90 p-8 shadow-sm">
                <p className="mono-label">No matches</p>
                <h3 className="mt-2 text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
                  Nothing matches â€œ{search}â€
                </h3>
                <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--stone)' }}>
                  Try a different keyword or clear the search to return to the full settings catalog.
                </p>
              </section>
            )}
          </div>
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

function HomepagePizzaPicker({
  pizzas,
  heroPizzaId,
  featuredPizzaIds,
  pending,
  onSave,
}: {
  pizzas: Pizza[];
  heroPizzaId: string;
  featuredPizzaIds: [string, string, string, string];
  pending: boolean;
  onSave: (heroPizzaId: string, featuredPizzaIds: [string, string, string, string]) => void;
}) {
  const [draftHeroPizzaId, setDraftHeroPizzaId] = useState(heroPizzaId);
  const [draftFeaturedPizzaIds, setDraftFeaturedPizzaIds] = useState<[string, string, string, string]>(featuredPizzaIds);
  const featuredPizzaIdsKey = featuredPizzaIds.join('|');

  useEffect(() => {
    setDraftHeroPizzaId(heroPizzaId);
  }, [heroPizzaId]);

  useEffect(() => {
    setDraftFeaturedPizzaIds(featuredPizzaIds);
  }, [featuredPizzaIdsKey]);

  const selectedIds = [draftHeroPizzaId, ...draftFeaturedPizzaIds].map((value) => value.trim()).filter(Boolean);

  const buildOptions = (currentValue: string, excludedIds: string[]) => {
    const normalizedCurrent = currentValue.trim();
    const excluded = new Set(excludedIds.map((value) => value.trim()).filter(Boolean));
    if (normalizedCurrent) excluded.delete(normalizedCurrent);

    return pizzas.filter((pizza) => !excluded.has(pizza.id) || pizza.id === normalizedCurrent);
  };

  const selectedPizzaById = (id: string) => pizzas.find((pizza) => pizza.id === id) || null;

  const normalizeFeatured = (values: string[], heroId: string) => {
    const seen = new Set<string>(heroId ? [heroId] : []);
    return values.map((value) => {
      const trimmed = value.trim();
      if (!trimmed || seen.has(trimmed)) return '';
      seen.add(trimmed);
      return trimmed;
    }) as [string, string, string, string];
  };

  const handleSave = () => {
    const hero = draftHeroPizzaId.trim();
    const featured = normalizeFeatured(draftFeaturedPizzaIds, hero);
    onSave(hero, featured);
  };

  if (!pizzas.length) {
    return (
      <section className="mt-6 rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] p-5">
        <p className="mono-label text-[10px]">Homepage pizza picks</p>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--stone)' }}>
          Add pizzas first, then return here to choose the homepage hero and the four curated cards.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-secondary)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mono-label text-[10px]">Homepage pizza picks</p>
          <h3 className="mt-1 text-xl font-semibold" style={{ color: 'var(--ink)' }}>
            Pick the hero pizza and four featured cards
          </h3>
          <p className="mt-1 text-sm leading-6" style={{ color: 'var(--stone)' }}>
            Leave a slot blank to fall back to the live menu order. Selections stay unique so the homepage feels curated.
          </p>
        </div>
        <div className="rounded-full border border-[var(--border-default)] bg-white px-3 py-1 text-xs font-medium" style={{ color: 'var(--stone)' }}>
          {selectedIds.length} selected of 5 slots
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
        <div className="space-y-3 rounded-3xl border border-[var(--border-default)] bg-white p-4">
          <div>
            <label className="block text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              Homepage hero pizza
            </label>
            <p className="mt-1 text-xs leading-5" style={{ color: 'var(--stone)' }}>
              This pizza powers the main hero showcase at the top of the homepage.
            </p>
          </div>
          <select
            className="input-base w-full"
            value={draftHeroPizzaId}
            onChange={(event) => setDraftHeroPizzaId(event.target.value)}
            disabled={pending}
          >
            <option value="">Automatic: first pizza</option>
            {buildOptions(draftHeroPizzaId, draftFeaturedPizzaIds).map((pizza) => (
              <option key={pizza.id} value={pizza.id}>
                {pizza.name}
                {pizza.is_sold_out ? ' (sold out)' : ''}
                {pizza.is_active ? '' : ' (hidden)'}
              </option>
            ))}
          </select>
          {selectedPizzaById(draftHeroPizzaId) ? (
            <p className="text-xs leading-5" style={{ color: 'var(--stone)' }}>
              Currently selected: <span className="font-semibold text-[var(--ink)]">{selectedPizzaById(draftHeroPizzaId)?.name}</span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {draftFeaturedPizzaIds.map((slotValue, index) => (
            <div key={index} className="space-y-3 rounded-3xl border border-[var(--border-default)] bg-white p-4">
              <div>
                <label className="block text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  Featured pizza {index + 1}
                </label>
                <p className="mt-1 text-xs leading-5" style={{ color: 'var(--stone)' }}>
                  One of the four curated pizzas shown below the hero.
                </p>
              </div>
              <select
                className="input-base w-full"
                value={slotValue}
                onChange={(event) => {
                  const next = [...draftFeaturedPizzaIds] as [string, string, string, string];
                  next[index] = event.target.value;
                  setDraftFeaturedPizzaIds(next);
                }}
                disabled={pending}
              >
                <option value="">Automatic: fill from live menu</option>
                {buildOptions(slotValue, [draftHeroPizzaId, ...draftFeaturedPizzaIds.filter((_, currentIndex) => currentIndex !== index)]).map((pizza) => (
                  <option key={pizza.id} value={pizza.id}>
                    {pizza.name}
                    {pizza.is_sold_out ? ' (sold out)' : ''}
                    {pizza.is_active ? '' : ' (hidden)'}
                  </option>
                ))}
              </select>
              {selectedPizzaById(slotValue) ? (
                <p className="text-xs leading-5" style={{ color: 'var(--stone)' }}>
                  Currently selected: <span className="font-semibold text-[var(--ink)]">{selectedPizzaById(slotValue)?.name}</span>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5" style={{ color: 'var(--stone)' }}>
          The storefront will use your selected hero pizza and curated cards first, then fill any blank slots from the live menu.
        </p>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={pending}>
          Save homepage pizzas
        </button>
      </div>
    </section>
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
    kind: 'text' | 'textarea' | 'url' | 'image' | 'number' | 'time' | 'boolean' | 'json';
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
    if (field.kind === 'json') {
      try {
        JSON.parse(draft || 'null');
      } catch {
        toast.error(`Invalid JSON for ${field.label.toLowerCase()}`);
        return;
      }
    }

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
      ) : field.kind === 'boolean' ? (
        <button
          type="button"
          onClick={() => setDraft((current) => (current === 'true' ? 'false' : 'true'))}
          className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            draft === 'true'
              ? 'bg-[var(--ember)] text-white'
              : 'border border-[var(--border-default)] bg-[var(--surface-secondary)] text-[var(--ink)]'
          }`}
          disabled={pending}
        >
          {draft === 'true' ? 'TRUE' : 'FALSE'}
        </button>
      ) : field.kind === 'json' ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          className="input-base w-full font-mono text-sm"
          disabled={pending}
          placeholder='[{"label":"Home","href":"/home"}]'
        />
      ) : field.kind === 'image' ? (
        <MenuImageField
          label={field.label}
          description={field.description}
          folder="storefront-images"
          value={draft || null}
          onChange={(next) => setDraft(next || '')}
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
    <div className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4">
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Navigation
        </div>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--stone)' }}>
          Primary links shown in the top bar and mobile drawer.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <motion.div
            key={`${row.label}-${index}`}
            className="grid gap-3 rounded-2xl border border-[var(--border-default)] bg-white p-4 md:grid-cols-[1fr_1fr_auto]"
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
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost" onClick={addRow} disabled={pending}>
          <Plus size={16} />
          Add link
        </button>
        <button type="button" className="btn-primary" onClick={save} disabled={pending}>
          Save navigation
        </button>
      </div>
    </div>
  );
}

function ContentBlocksEditor({
  id,
  title,
  description,
  config,
  pending,
  onSave,
  prefersReducedMotion,
}: {
  id?: string;
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
    <SettingsPanel
      id={id}
      title={title}
      description={description}
      icon={ListChecks}
      prefersReducedMotion={prefersReducedMotion}
    >
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
