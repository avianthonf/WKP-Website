import { redirect } from 'next/navigation';
import { StorefrontShell } from '../components/storefront-shell';
import { PizzaBuilder } from '../components/pizza-builder';
import { fetchStorefrontBundle } from '../lib/storefront';

export const dynamic = 'force-dynamic';

export default async function BuildPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const initialPizzaSlug = typeof params.pizza === 'string' ? params.pizza : Array.isArray(params.pizza) ? params.pizza[0] : undefined;
  const bundle = await fetchStorefrontBundle();

  if (!bundle.pizzas.length) {
    redirect('/menu');
  }

  return (
    <StorefrontShell bundle={bundle}>
      <PizzaBuilder bundle={bundle} initialPizzaSlug={initialPizzaSlug} />
    </StorefrontShell>
  );
}
