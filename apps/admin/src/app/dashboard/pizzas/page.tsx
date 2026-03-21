import { createSupabaseServer } from '@/lib/supabaseServer';
import { Addon, Category, Dessert, Extra, Pizza, Topping } from '@/types';
import MenuStudio from './MenuStudio';

export const dynamic = 'force-dynamic';

export default async function PizzasPage() {
  const supabase = await createSupabaseServer();

  const [
    { data: pizzas, error: pizzasError },
    { data: categories, error: categoriesError },
    { data: toppings, error: toppingsError },
    { data: extras, error: extrasError },
    { data: addons, error: addonsError },
    { data: desserts, error: dessertsError },
  ] = await Promise.all([
    supabase.from('pizzas').select('*, categories(label)').order('sort_order', { ascending: true }),
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase
      .from('toppings')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase.from('extras').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('addons').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('desserts').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true }),
  ]);

  if (pizzasError) console.error('Error fetching pizzas:', pizzasError);
  if (categoriesError) console.error('Error fetching categories:', categoriesError);
  if (toppingsError) console.error('Error fetching toppings:', toppingsError);
  if (extrasError) console.error('Error fetching extras:', extrasError);
  if (addonsError) console.error('Error fetching addons:', addonsError);
  if (dessertsError) console.error('Error fetching desserts:', dessertsError);

  return (
    <MenuStudio
      pizzas={(pizzas || []) as (Pizza & { categories?: { label: string } })[]}
      categories={(categories || []) as Category[]}
      toppings={(toppings || []) as Topping[]}
      extras={(extras || []) as Extra[]}
      addons={(addons || []) as Addon[]}
      desserts={(desserts || []) as Dessert[]}
    />
  );
}
