'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, type ComponentType } from 'react';
import {
  ArrowRight,
  ChefHat,
  Cookie,
  Edit2,
  Grid2X2,
  Leaf,
  LayoutGrid,
  Plus,
  Pizza as PizzaIcon,
  Search,
  Sparkles,
  Tag,
  SlidersHorizontal,
  UtensilsCrossed,
  Table2,
} from 'lucide-react';
import { Modal } from '@/components/admin/Modal';
import { PizzaForm } from '@/components/admin/PizzaForm';
import { createPizza } from './actions';
import { AddonsClient } from '@/app/dashboard/addons/AddonsClient';
import CategoriesClient from '@/app/dashboard/categories/CategoriesClient';
import { DessertsClient } from '@/app/dashboard/desserts/DessertsClient';
import { ExtrasClient } from '@/app/dashboard/extras/ExtrasClient';
import { ToppingsClient } from '@/app/dashboard/toppings/ToppingsClient';
import { InlinePrice } from '@/components/admin/InlinePrice';
import { TogglePizzaActive } from '@/components/admin/TogglePizzaActive';
import { DeletePizzaButton } from '@/components/admin/DeletePizzaButton';
import type { Addon, Category, Dessert, Extra, Pizza, Topping } from '@/types';

type TabKey = 'pizzas' | 'categories' | 'toppings' | 'extras' | 'addons' | 'desserts';

const tabs: Array<{
  key: TabKey;
  label: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  { key: 'pizzas', label: 'Pizzas', icon: PizzaIcon },
  { key: 'categories', label: 'Categories', icon: Grid2X2 },
  { key: 'toppings', label: 'Toppings', icon: Leaf },
  { key: 'extras', label: 'Extras', icon: Tag },
  { key: 'addons', label: 'Addons', icon: UtensilsCrossed },
  { key: 'desserts', label: 'Desserts', icon: Cookie },
];

export default function MenuStudio({
  pizzas,
  categories,
  toppings,
  extras,
  addons,
  desserts,
  }: {
  pizzas: (Pizza & { categories?: { label: string } })[];
  categories: Category[];
  toppings: Topping[];
  extras: Extra[];
  addons: Addon[];
  desserts: Dessert[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('pizzas');
  const [pizzaViewMode, setPizzaViewMode] = useState<'cards' | 'table'>('cards');
  const [pizzaSearch, setPizzaSearch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showBestsellersOnly, setShowBestsellersOnly] = useState(false);
  const [pizzaCreateOpen, setPizzaCreateOpen] = useState(false);
  const [createSignals, setCreateSignals] = useState<Record<Exclude<TabKey, 'pizzas'>, number>>({
    categories: 0,
    toppings: 0,
    extras: 0,
    addons: 0,
    desserts: 0,
  });

  const counts = useMemo(
    () => ({
      pizzas: pizzas.length,
      categories: categories.length,
      toppings: toppings.length,
      extras: extras.length,
      addons: addons.length,
      desserts: desserts.length,
      activeItems:
        pizzas.filter((pizza) => pizza.is_active).length +
        categories.filter((category) => category.is_active).length +
        toppings.filter((topping) => topping.is_active).length +
        extras.filter((extra) => extra.is_active).length +
        addons.filter((addon) => addon.is_active).length +
        desserts.filter((dessert) => dessert.is_active).length,
    }),
    [addons, categories, desserts, extras, pizzas, toppings]
  );
  const filteredPizzas = useMemo(() => {
    const term = pizzaSearch.trim().toLowerCase();

    return pizzas.filter((pizza) => {
      const matchesSearch =
        !term ||
        pizza.name.toLowerCase().includes(term) ||
        (pizza.description || '').toLowerCase().includes(term) ||
        (pizza.categories?.label || '').toLowerCase().includes(term);
      const matchesActive = !showActiveOnly || pizza.is_active;
      const matchesBestseller = !showBestsellersOnly || pizza.is_bestseller;
      return matchesSearch && matchesActive && matchesBestseller;
    });
  }, [pizzaSearch, pizzas, showActiveOnly, showBestsellersOnly]);
  const pizzaStats = useMemo(
    () => ({
      visible: filteredPizzas.length,
      active: filteredPizzas.filter((pizza) => pizza.is_active).length,
      bestselling: filteredPizzas.filter((pizza) => pizza.is_bestseller).length,
      veg: filteredPizzas.filter((pizza) => pizza.is_veg).length,
    }),
    [filteredPizzas]
  );
  const hasPizzaFilters = Boolean(pizzaSearch.trim() || showActiveOnly || showBestsellersOnly);

  const requestCreate = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'pizzas') {
      setPizzaCreateOpen(true);
      return;
    }

    setCreateSignals((prev) => ({
      ...prev,
      [tab]: prev[tab] + 1,
    }));
  };

  return (
    <div className="space-y-8 reveal-stagger">
      <section className="card card-premium overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] px-6 py-6 md:px-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,84,10,0.14)] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--ember)] shadow-sm">
                <Sparkles size={12} />
                Menu studio
              </div>
              <div className="space-y-2">
                <h1 className="page-title">Menu and Pizzas</h1>
                <p className="page-subtitle max-w-2xl">
                  Manage pizzas, toppings, categories, extras, addons, and desserts from one structured workspace.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MenuSummaryStat label="Active items" value={counts.activeItems.toString()} />
                <MenuSummaryStat label="Pizzas" value={counts.pizzas.toString()} />
                <MenuSummaryStat label="Collections" value={String(counts.categories + counts.toppings)} />
                <MenuSummaryStat label="Sides" value={String(counts.extras + counts.addons + counts.desserts)} />
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4 shadow-[0_12px_28px_rgba(26,23,18,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="mono-label text-[10px]">Quick create</p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">Add items here</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--stone)] shadow-sm">
                  <ChefHat size={12} />
                  Live menu
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <MenuActionButton
                  title="Add pizza"
                  description="Recipe, pricing, toppings"
                  icon={PizzaIcon}
                  onClick={() => requestCreate('pizzas')}
                  primary
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <MenuActionButton title="Addon" description="Flat-price side item" icon={UtensilsCrossed} onClick={() => requestCreate('addons')} />
                  <MenuActionButton title="Topping" description="Ingredient or sauce" icon={Leaf} onClick={() => requestCreate('toppings')} />
                  <MenuActionButton title="Extra" description="Sized add-on pricing" icon={Tag} onClick={() => requestCreate('extras')} />
                  <MenuActionButton title="Dessert" description="Sweet standalone item" icon={Cookie} onClick={() => requestCreate('desserts')} />
                  <MenuActionButton title="Category" description="Menu grouping" icon={Grid2X2} onClick={() => requestCreate('categories')} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/dashboard/settings"
                  className="btn-ghost inline-flex items-center justify-center gap-2 border border-[var(--border-default)] px-4 py-2.5"
                >
                  <Tag size={16} />
                  <span>Menu Settings</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-ghost inline-flex items-center justify-center gap-2 border border-[var(--border-default)] px-4 py-2.5"
                >
                  <ArrowRight size={16} />
                  <span>Back to Overview</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--border-subtle)] px-4 py-4 md:px-6">
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full gap-2 rounded-[1.2rem] border border-[var(--border-default)] bg-[var(--surface-secondary)] p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-[1.1rem] px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-white text-[var(--ink)] shadow-[0_8px_20px_rgba(26,23,18,0.08)]'
                        : 'text-[var(--stone)] hover:bg-white/70 hover:text-[var(--ink)]'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    <span className="rounded-full bg-[rgba(232,84,10,0.08)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ember)]">
                      {counts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section hidden={activeTab !== 'pizzas'} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MiniCard title="Visible pizzas" value={pizzaStats.visible} note={hasPizzaFilters ? 'After filters' : 'All pizzas'} />
          <MiniCard title="Active pizzas" value={pizzaStats.active} note="Live in storefront" />
          <MiniCard title="Best sellers" value={pizzaStats.bestselling} note="Featured items" />
          <MiniCard title="Vegetarian" value={pizzaStats.veg} note="Dietary-ready" />
        </div>

        <div className="card card-premium p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[rgba(232,84,10,0.08)] p-3 text-[var(--ember)]">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <p className="mono-label text-[10px]">Browse and filter</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">Find and edit items faster</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--stone)]">
                  Search by name, description, or category. Switch between the friendly card view and the spreadsheet-style table when you need it.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setPizzaSearch('');
                  setShowActiveOnly(false);
                  setShowBestsellersOnly(false);
                }}
                disabled={!hasPizzaFilters}
                className="btn-ghost"
              >
                Clear filters
              </button>
              <button
                type="button"
                onClick={() => setPizzaViewMode('cards')}
                className={`btn-ghost gap-2 ${pizzaViewMode === 'cards' ? 'border-[var(--ember)] bg-[rgba(232,84,10,0.06)] text-[var(--ember)]' : ''}`}
              >
                <LayoutGrid size={16} />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setPizzaViewMode('table')}
                className={`btn-ghost gap-2 ${pizzaViewMode === 'table' ? 'border-[var(--ember)] bg-[rgba(232,84,10,0.06)] text-[var(--ember)]' : ''}`}
              >
                <Table2 size={16} />
                Table
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--stone)]" />
              <input
                type="search"
                value={pizzaSearch}
                onChange={(e) => setPizzaSearch(e.target.value)}
                placeholder="Search pizzas, descriptions, categories..."
                className="input-base w-full pl-11"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowActiveOnly((value) => !value)}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                showActiveOnly
                  ? 'border-[var(--ember)] bg-[rgba(232,84,10,0.08)] text-[var(--ember)]'
                  : 'border-[var(--border-default)] bg-white text-[var(--stone)] hover:border-[var(--ember)] hover:text-[var(--ink)]'
              }`}
            >
              Active only
            </button>

            <button
              type="button"
              onClick={() => setShowBestsellersOnly((value) => !value)}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                showBestsellersOnly
                  ? 'border-[var(--ember)] bg-[rgba(232,84,10,0.08)] text-[var(--ember)]'
                  : 'border-[var(--border-default)] bg-white text-[var(--stone)] hover:border-[var(--ember)] hover:text-[var(--ink)]'
              }`}
            >
              Best sellers
            </button>
          </div>
        </div>

        <div className="card card-premium p-0 overflow-hidden">
          <PizzaSection
            pizzas={filteredPizzas}
            totalCount={pizzas.length}
            viewMode={pizzaViewMode}
            onCreatePizza={() => requestCreate('pizzas')}
          />
        </div>
      </section>

      <section hidden={activeTab !== 'categories'} className="card card-premium p-0 overflow-hidden">
        <CategoriesClient initialCategories={categories} createSignal={createSignals.categories} />
      </section>

      <section hidden={activeTab !== 'toppings'} className="card card-premium p-0 overflow-hidden">
        <ToppingsClient initialToppings={toppings} createSignal={createSignals.toppings} />
      </section>

      <section hidden={activeTab !== 'extras'} className="card card-premium p-0 overflow-hidden">
        <ExtrasClient initialExtras={extras} createSignal={createSignals.extras} />
      </section>

      <section hidden={activeTab !== 'addons'} className="card card-premium p-0 overflow-hidden">
        <AddonsClient initialAddons={addons} createSignal={createSignals.addons} />
      </section>

      <section hidden={activeTab !== 'desserts'} className="card card-premium p-0 overflow-hidden">
        <DessertsClient initialDesserts={desserts} createSignal={createSignals.desserts} />
      </section>

      <Modal
        open={pizzaCreateOpen}
        onClose={() => setPizzaCreateOpen(false)}
        title="New Pizza"
        maxWidth="xl"
      >
        <PizzaForm
          categories={categories}
          toppings={toppings}
          onSubmitAction={createPizza}
          compact
          submitLabel="Add Pizza"
          onCancel={() => setPizzaCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}

function MenuSummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--border-default)] bg-white px-4 py-3 shadow-sm">
      <p className="mono-label text-[10px]">{label}</p>
      <div className="mt-2 text-2xl font-semibold text-[var(--ink)]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        {value}
      </div>
    </div>
  );
}

function MiniCard({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <div className="card card-premium p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="mono-label text-[10px]">{title}</p>
          <div className="font-serif text-3xl font-semibold text-[var(--ink)]">{value}</div>
        </div>
        <div className="rounded-full border border-[rgba(232,84,10,0.12)] bg-[rgba(232,84,10,0.08)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ember)]">
          Menu
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--stone)]">{note}</p>
    </div>
  );
}

function MenuActionButton({
  title,
  description,
  icon: Icon,
  onClick,
  primary = false,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ size?: number }>;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-[1rem] border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(232,84,10,0.25)] ${
        primary
          ? 'border-[rgba(232,84,10,0.18)] bg-white shadow-[0_12px_24px_rgba(26,23,18,0.05)] hover:-translate-y-0.5 hover:border-[rgba(232,84,10,0.32)]'
          : 'border-[var(--border-default)] bg-white hover:-translate-y-0.5 hover:border-[rgba(232,84,10,0.3)] hover:shadow-[0_10px_20px_rgba(26,23,18,0.06)]'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${primary ? 'bg-[rgba(232,84,10,0.10)] text-[var(--ember)]' : 'bg-[var(--surface-secondary)] text-[var(--ink)]'}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--ink)]">{title}</span>
        <span className="block text-xs leading-5 text-[var(--stone)]">{description}</span>
      </span>
      <ArrowRight size={14} className="text-[var(--stone)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--ember)]" />
    </button>
  );
}

function PizzaSection({
  pizzas,
  totalCount,
  viewMode,
  onCreatePizza,
}: {
  pizzas: (Pizza & { categories?: { label: string } })[];
  totalCount: number;
  viewMode: 'cards' | 'table';
  onCreatePizza: () => void;
}) {
  return (
    <div className="space-y-0">
      <div className="border-b border-[var(--border-subtle)] px-6 py-5 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mono-label text-[10px]">Pizza inventory</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">Browse, edit, and publish menu items</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--stone)]">
              Cards keep day-to-day editing readable. Switch to the table when you need to scan prices fast.
            </p>
          </div>
          <button type="button" onClick={onCreatePizza} className="group btn-primary inline-flex items-center gap-2 px-5 py-3">
            <Plus size={16} />
            <span>Create pizza</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-6 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--stone)]">
            Showing {pizzas.length} of {totalCount}
          </span>
          <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--stone)]">
            Fast edits on price and availability
          </span>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="px-6 py-6 md:px-8">
          {pizzas.length === 0 ? (
            <EmptyMenuState />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
              {pizzas.map((pizza) => (
                <PizzaCard key={pizza.id} pizza={pizza} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="table-wrap border-0 shadow-none">
          <table>
            <thead>
              <tr>
                <th data-label="" style={{ width: '60px', minWidth: '60px' }} />
                <th data-label="Name">Name</th>
                <th data-label="Category">Category</th>
                <th data-label="Small" style={{ minWidth: '100px' }}>
                  Small
                </th>
                <th data-label="Medium" style={{ minWidth: '100px' }}>
                  Medium
                </th>
                <th data-label="Large" style={{ minWidth: '100px' }}>
                  Large
                </th>
                <th data-label="Active" style={{ minWidth: '100px', textAlign: 'center' }}>
                  Active
                </th>
                <th data-label="Actions" style={{ minWidth: '100px', textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pizzas.map((pizza, index) => (
                <tr key={pizza.id} className="group transition-all" style={{ animationDelay: `${index * 50}ms` }}>
                  <td data-label="">
                    <div
                      className="relative flex aspect-square w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] transition-all group-hover:scale-105 group-hover:rotate-1"
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      {pizza.image_url ? (
                        <Image
                          src={pizza.image_url}
                          alt={pizza.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <PizzaIcon size={20} className="text-[var(--stone)]" />
                      )}
                    </div>
                  </td>
                  <td data-label="Name">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 'var(--text-base)' }}>{pizza.name}</span>
                        {pizza.is_bestseller && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#fbbf24_0%,#f59e0b_100%)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#92400e] shadow-[0_0_0_1px_rgba(251,191,36,0.3)_inset]">
                            Best
                          </span>
                        )}
                      </div>
                      {!pizza.is_veg && (
                        <span className="mono-label mt-1 text-[10px]" style={{ color: 'rgba(220, 38, 38, 0.8)' }}>
                          Non-Veg
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Category">
                    <span className="mono-label rounded-md bg-[var(--surface-secondary)] px-2 py-1 text-xs">
                      {pizza.categories?.label || 'Uncategorized'}
                    </span>
                  </td>
                  <td data-label="Small">
                    <InlinePrice pizzaId={pizza.id} size="small" initialPrice={pizza.price_small} />
                  </td>
                  <td data-label="Medium">
                    <InlinePrice pizzaId={pizza.id} size="medium" initialPrice={pizza.price_medium} />
                  </td>
                  <td data-label="Large">
                    <InlinePrice pizzaId={pizza.id} size="large" initialPrice={pizza.price_large} />
                  </td>
                  <td data-label="Active" style={{ textAlign: 'center' }}>
                    <div className="flex justify-center">
                      <TogglePizzaActive pizzaId={pizza.id} initialActive={pizza.is_active} />
                    </div>
                  </td>
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/pizzas/${pizza.id}/edit`}
                        className="icon-btn shadow-sm transition-all hover:shadow-md"
                        style={{ border: '1px solid var(--border-default)' }}
                      >
                        <Edit2 size={15} />
                      </Link>
                      <DeletePizzaButton pizzaId={pizza.id} pizzaName={pizza.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {pizzas.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyMenuState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PizzaCard({ pizza }: { pizza: Pizza & { categories?: { label: string } } }) {
  return (
    <article className="group flex h-full flex-col rounded-[1.4rem] border border-[var(--border-default)] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(26,23,18,0.08)]">
      <div className="flex items-start gap-4">
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[1.1rem] border border-[var(--border-default)] bg-[var(--surface-secondary)]">
          {pizza.image_url ? (
            <Image
              src={pizza.image_url}
              alt={pizza.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[var(--stone)]">
              <PizzaIcon size={24} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/35 to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-[var(--ink)]">{pizza.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--stone)]">
                {pizza.description || 'No description yet. Add one to help the team and customers understand the item.'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--stone)]">
              {pizza.categories?.label || 'Uncategorized'}
            </span>
            {pizza.is_bestseller && (
              <span className="rounded-full bg-[rgba(251,191,36,0.18)] px-3 py-1 text-xs font-semibold text-[#92400e]">
                Bestseller
              </span>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                pizza.is_active ? 'bg-[rgba(22,163,74,0.12)] text-[var(--success)]' : 'bg-[rgba(220,38,38,0.12)] text-[var(--danger)]'
              }`}
            >
              {pizza.is_active ? 'Active' : 'Hidden'}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                pizza.is_veg ? 'bg-[rgba(22,163,74,0.12)] text-[var(--success)]' : 'bg-[rgba(220,38,38,0.12)] text-[var(--danger)]'
              }`}
            >
              {pizza.is_veg ? 'Veg' : 'Non-veg'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <PriceChip label="Small" value={pizza.price_small} pizzaId={pizza.id} size="small" />
        <PriceChip label="Medium" value={pizza.price_medium} pizzaId={pizza.id} size="medium" />
        <PriceChip label="Large" value={pizza.price_large} pizzaId={pizza.id} size="large" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-center gap-3">
          <TogglePizzaActive pizzaId={pizza.id} initialActive={pizza.is_active} />
          <span className="text-xs text-[var(--stone)]">Tap to publish or hide</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/pizzas/${pizza.id}/edit`} className="btn-ghost px-4">
            Edit
          </Link>
          <DeletePizzaButton pizzaId={pizza.id} pizzaName={pizza.name} />
        </div>
      </div>
    </article>
  );
}

function PriceChip({
  label,
  value,
  pizzaId,
  size,
}: {
  label: string;
  value: number;
  pizzaId: string;
  size: 'small' | 'medium' | 'large';
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="mono-label text-[10px]">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--stone)]">Inline edit</span>
      </div>
      <div className="mt-2">
        <InlinePrice pizzaId={pizzaId} size={size} initialPrice={value} />
      </div>
    </div>
  );
}

function EmptyMenuState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.3rem] border border-dashed border-[var(--border-default)] bg-[var(--surface-secondary)] px-6 py-14 text-center">
      <PizzaIcon size={52} className="text-[var(--linen)]" />
      <h3 className="mt-4 text-xl font-semibold text-[var(--ink)]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        No pizzas match this view
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--stone)]">
        Try clearing the filters, or create a new pizza if the menu is still getting started.
      </p>
    </div>
  );
}
