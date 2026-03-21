import { createSupabaseServer } from '@/lib/supabaseServer';
import { Pizza, Extra, Addon, Dessert } from '@/types';
import { DollarSign, Tag } from 'lucide-react';
import { MotionSurface } from '@/components/MotionSurface';
import { updateAddonPrice } from '@/app/dashboard/addons/actions';
import { updateDessertPrice } from '@/app/dashboard/desserts/actions';
import { InlinePrice } from '@/components/admin/InlinePrice';
import { InlineExtraPrice } from '@/components/admin/InlineExtraPrice';
import InlineSimplePrice from '@/components/admin/InlineSimplePrice';

async function saveAddonPrice(id: string, price: number) {
  await updateAddonPrice(id, price);
}

async function saveDessertPrice(id: string, price: number) {
  await updateDessertPrice(id, price);
}

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const supabase = await createSupabaseServer();

  // Fetch all data in parallel
  const [pizzasRes, extrasRes, addonsRes, dessertsRes] = await Promise.all([
    supabase
      .from('pizzas')
      .select('*, categories(label)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('extras')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('addons')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('desserts')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const pizzas = pizzasRes.data as (Pizza & { categories: { label: string } })[];
  const extras = extrasRes.data as Extra[];
  const addons = addonsRes.data as Addon[];
  const desserts = dessertsRes.data as Dessert[];

  // Group pizzas by category
  const pizzasByCategory = pizzas.reduce((acc, pizza) => {
    const catName = pizza.categories?.label || 'Uncategorized';
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(pizza);
    return acc;
  }, {} as Record<string, (Pizza & { categories: { label: string } })[]>);

  return (
    <div className="space-y-6 reveal-stagger">
      <header className="page-header">
        <div>
          <h1 className="page-title">Pricing Dashboard</h1>
          <p className="page-subtitle">Centralized price management for all menu items.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* LEFT PANEL - PIZZAS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={24} style={{ color: 'var(--stone)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: "'Cormorant Garamond', serif" }}>
              Pizza Prices
            </h2>
          </div>

          {Object.entries(pizzasByCategory).map(([category, categoryPizzas]) => (
            <MotionSurface
              key={category}
              as="section"
              className="bg-white border border-[#E5E5E0] rounded shadow-sm overflow-hidden"
              delay={0.05}
              hoverLift={-3}
              hoverScale={1.004}
            >
              <div
                className="px-4 py-3 border-b border-[#E5E5E0] bg-gray-50"
                style={{ color: 'var(--stone)' }}
              >
                <span className="font-medium text-sm">{category}</span>
              </div>
              <div className="table-wrap p-2">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {categoryPizzas.map((pizza) => (
                      <tr key={pizza.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 py-2" data-label="Name" style={{ color: 'var(--ink)', fontWeight: 500 }}>
                          {pizza.name}
                        </td>
                        <td className="p-3 py-2" data-label="S">
                          <InlinePrice
                            pizzaId={pizza.id}
                            size="small"
                            initialPrice={pizza.price_small}
                          />
                        </td>
                        <td className="p-3 py-2" data-label="M">
                          <InlinePrice
                            pizzaId={pizza.id}
                            size="medium"
                            initialPrice={pizza.price_medium}
                          />
                        </td>
                        <td className="p-3 py-2" data-label="L">
                          <InlinePrice
                            pizzaId={pizza.id}
                            size="large"
                            initialPrice={pizza.price_large}
                          />
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </MotionSurface>
          ))}

          {Object.keys(pizzasByCategory).length === 0 && (
            <MotionSurface className="text-center p-8 bg-white border border-[#E5E5E0] rounded" hoverLift={-2} hoverScale={1.003}>
              <p className="text-sm" style={{ color: 'var(--stone)' }}>No active pizzas found.</p>
            </MotionSurface>
          )}
        </div>

        {/* RIGHT PANEL - EXTRAS, ADDONS, DESSERTS */}
        <div className="space-y-6">
          {/* EXTRAS SECTION */}
          <MotionSurface as="section" className="bg-white border border-[#E5E5E0] rounded shadow-sm overflow-hidden" delay={0.08} hoverLift={-3} hoverScale={1.004}>
            <div className="px-4 py-3 border-b border-[#E5E5E0] bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm" style={{ color: 'var(--stone)' }}>Extras</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--stone)', opacity: 0.8 }}>Price varies by pizza size</p>
                </div>
                <Tag size={20} style={{ color: 'var(--stone)' }} />
              </div>
            </div>
            <div className="table-wrap p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th className="px-4 py-2 text-xs font-medium" style={{ color: 'var(--stone)' }}>Name</th>
                    <th className="px-4 py-2 text-xs font-medium" style={{ color: 'var(--stone)' }}>S</th>
                    <th className="px-4 py-2 text-xs font-medium" style={{ color: 'var(--stone)' }}>M</th>
                    <th className="px-4 py-2 text-xs font-medium" style={{ color: 'var(--stone)' }}>L</th>
                  </tr>
                </thead>
                <tbody>
                  {extras.map((extra) => (
                    <tr key={extra.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2" data-label="Name" style={{ color: 'var(--ink)' }}>
                        {extra.name}
                      </td>
                      <td className="px-4 py-2" data-label="S">
                        <InlineExtraPrice
                          extraId={extra.id}
                          size="small"
                          initialPrice={extra.price_small}
                        />
                      </td>
                      <td className="px-4 py-2" data-label="M">
                        <InlineExtraPrice
                          extraId={extra.id}
                          size="medium"
                          initialPrice={extra.price_medium}
                        />
                      </td>
                      <td className="px-4 py-2" data-label="L">
                        <InlineExtraPrice
                          extraId={extra.id}
                          size="large"
                          initialPrice={extra.price_large}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {extras.length === 0 && (
                <p className="text-center p-4 text-sm" style={{ color: 'var(--stone)' }}>No active extras</p>
              )}
            </div>
          </MotionSurface>

          {/* ADDONS & DESSERTS SECTION */}
          <MotionSurface as="section" className="bg-white border border-[#E5E5E0] rounded shadow-sm overflow-hidden" delay={0.12} hoverLift={-3} hoverScale={1.004}>
            <div className="px-4 py-3 border-b border-[#E5E5E0] bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm" style={{ color: 'var(--stone)' }}>Addons & Desserts</span>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--stone)', opacity: 0.8 }}>Flat price, size-independent</p>
                </div>
                <Tag size={20} style={{ color: 'var(--stone)' }} />
              </div>
            </div>
            <div className="table-wrap p-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <th className="px-4 py-2 text-xs font-medium" style={{ color: 'var(--stone)' }}>Name</th>
                    <th className="px-4 py-2 text-xs font-medium" style={{ color: 'var(--stone)' }}>Type</th>
                    <th className="px-4 py-2 text-xs font-medium" style={{ color: 'var(--stone)' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {addons.map((addon) => (
                    <tr key={addon.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2" data-label="Name" style={{ color: 'var(--ink)' }}>
                        {addon.name}
                      </td>
                      <td className="px-4 py-2" data-label="Type">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: '#dcfce7', color: '#166534' }}>
                          Addon
                        </span>
                      </td>
                      <td className="px-4 py-2" data-label="Price">
                        <InlineSimplePrice
                          itemId={addon.id}
                          initialPrice={addon.price}
                          onSave={saveAddonPrice}
                        />
                      </td>
                    </tr>
                  ))}
                  {desserts.map((dessert) => (
                    <tr key={dessert.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2" data-label="Name" style={{ color: 'var(--ink)' }}>
                        {dessert.name}
                      </td>
                      <td className="px-4 py-2" data-label="Type">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: '#fce7f3', color: '#9d174d' }}>
                          Dessert
                        </span>
                      </td>
                      <td className="px-4 py-2" data-label="Price">
                        <InlineSimplePrice
                          itemId={dessert.id}
                          initialPrice={dessert.price}
                          onSave={saveDessertPrice}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {addons.length === 0 && desserts.length === 0 && (
                <p className="text-center p-4 text-sm" style={{ color: 'var(--stone)' }}>No active addons or desserts</p>
              )}
            </div>
          </MotionSurface>
        </div>
      </div>
    </div>
  );
}
