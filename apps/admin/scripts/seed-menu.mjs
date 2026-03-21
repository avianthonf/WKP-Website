import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(scriptDir, '..', '.env.local');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

loadEnvFile(envPath);

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const categorySeeds = [
  {
    slug: 'veg-pizzas',
    label: 'Veg Pizzas',
    type: 'pizza',
    sort_order: 1,
    is_active: true,
    description: null,
    icon: null,
  },
  {
    slug: 'non-veg-pizzas',
    label: 'Chicken Pizzas',
    type: 'pizza',
    sort_order: 2,
    is_active: true,
    description: null,
    icon: null,
  },
  {
    slug: 'addons',
    label: 'Addons',
    type: 'addon',
    sort_order: 3,
    is_active: true,
    description: null,
    icon: null,
  },
  {
    slug: 'desserts',
    label: 'Desserts',
    type: 'dessert',
    sort_order: 4,
    is_active: true,
    description: null,
    icon: null,
  },
];

const toppingSeeds = [
  { slug: 'mozzarella', name: 'Mozzarella', category: 'cheese', is_veg: true, is_active: true, sort_order: 1 },
  { slug: 'cheddar', name: 'Cheddar', category: 'cheese', is_veg: true, is_active: true, sort_order: 2 },
  { slug: 'basil', name: 'Basil', category: 'herb', is_veg: true, is_active: true, sort_order: 3 },
  { slug: 'onion', name: 'Onion', category: 'vegetable', is_veg: true, is_active: true, sort_order: 4 },
  { slug: 'capsicum', name: 'Capsicum', category: 'vegetable', is_veg: true, is_active: true, sort_order: 5 },
  { slug: 'sweetcorn', name: 'Sweetcorn', category: 'vegetable', is_veg: true, is_active: true, sort_order: 6 },
  { slug: 'mushroom', name: 'Mushroom', category: 'vegetable', is_veg: true, is_active: true, sort_order: 7 },
  { slug: 'black-olives', name: 'Black Olives', category: 'vegetable', is_veg: true, is_active: true, sort_order: 8 },
  { slug: 'jalapeno', name: 'Jalapeno', category: 'vegetable', is_veg: true, is_active: true, sort_order: 9 },
  { slug: 'red-pepper', name: 'Red Pepper', category: 'vegetable', is_veg: true, is_active: true, sort_order: 10 },
  { slug: 'herbed-onion', name: 'Herbed Onion', category: 'herb', is_veg: true, is_active: true, sort_order: 11 },
  { slug: 'paneer', name: 'Paneer', category: 'other', is_veg: true, is_active: true, sort_order: 12 },
  { slug: 'paneer-tikka', name: 'Paneer Tikka', category: 'other', is_veg: true, is_active: true, sort_order: 13 },
  { slug: 'grilled-paneer', name: 'Grilled Paneer', category: 'other', is_veg: true, is_active: true, sort_order: 14 },
  { slug: 'makhani-gravy', name: 'Makhani Gravy', category: 'sauce', is_veg: true, is_active: true, sort_order: 15 },
  { slug: 'roast-chicken', name: 'Roast Chicken', category: 'meat', is_veg: false, is_active: true, sort_order: 16 },
  { slug: 'tandoori-chicken', name: 'Tandoori Chicken', category: 'meat', is_veg: false, is_active: true, sort_order: 17 },
  { slug: 'bbq-chicken', name: 'BBQ Chicken', category: 'meat', is_veg: false, is_active: true, sort_order: 18 },
  { slug: 'chicken-sausage', name: 'Chicken Sausage', category: 'meat', is_veg: false, is_active: true, sort_order: 19 },
  { slug: 'chicken-bacon', name: 'Chicken Bacon', category: 'meat', is_veg: false, is_active: true, sort_order: 20 },
  { slug: 'peri-peri-chicken', name: 'Peri Peri Chicken', category: 'meat', is_veg: false, is_active: true, sort_order: 21 },
  { slug: 'garlic-chicken', name: 'Garlic Chicken', category: 'meat', is_veg: false, is_active: true, sort_order: 22 },
];

const pizzaSeeds = [
  {
    slug: 'margarita',
    name: 'Margarita',
    description: 'Blend of Mozzarella and Cheddar, topped with fresh Basil',
    category_slug: 'veg-pizzas',
    price_small: 130,
    price_medium: 230,
    price_large: 350,
    image_url: null,
    is_veg: true,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 1,
  },
  {
    slug: 'veg-delight-pizza',
    name: 'Veg Delight Pizza',
    description: 'Onion, Capsicum and Sweetcorn',
    category_slug: 'veg-pizzas',
    price_small: 250,
    price_medium: 320,
    price_large: 460,
    image_url: null,
    is_veg: true,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 2,
  },
  {
    slug: 'farm-fresh-pizza',
    name: 'Farm Fresh Pizza',
    description: 'Onion, Capsicum, Mushroom and Sweetcorn',
    category_slug: 'veg-pizzas',
    price_small: 270,
    price_medium: 340,
    price_large: 490,
    image_url: null,
    is_veg: true,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 3,
  },
  {
    slug: 'mushroom-garlic-twist',
    name: 'Mushroom Garlic Twist',
    description: 'Garlic Tossed Mushroom, Onion and Black Olives',
    category_slug: 'veg-pizzas',
    price_small: 270,
    price_medium: 340,
    price_large: 490,
    image_url: null,
    is_veg: true,
    is_bestseller: true,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 4,
  },
  {
    slug: 'tangy-veg-pizza',
    name: 'Tangy Veg Pizza',
    description: 'Onion, Capsicum, Jalapeno and Red Pepper',
    category_slug: 'veg-pizzas',
    price_small: 290,
    price_medium: 360,
    price_large: 510,
    image_url: null,
    is_veg: true,
    is_bestseller: false,
    is_spicy: true,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 5,
  },
  {
    slug: 'paneer-tikka-pizza',
    name: 'Paneer Tikka Pizza',
    description: 'Paneer Tikka, Onion and Capsicum',
    category_slug: 'veg-pizzas',
    price_small: 330,
    price_medium: 390,
    price_large: 560,
    image_url: null,
    is_veg: true,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 6,
  },
  {
    slug: 'veg-extravaganza-pizza',
    name: 'Veg Extravaganza Pizza',
    description: 'Herbed Onion, Capsicum, Mushroom, Corn, Black Olives and Grilled Paneer',
    category_slug: 'veg-pizzas',
    price_small: 350,
    price_medium: 450,
    price_large: 640,
    image_url: null,
    is_veg: true,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 7,
  },
  {
    slug: 'paneer-makhani-pizza',
    name: 'Paneer Makhani Pizza',
    description: 'Grilled Paneer and Onion. Topped with Makhani Gravy.',
    category_slug: 'veg-pizzas',
    price_small: 340,
    price_medium: 400,
    price_large: 560,
    image_url: null,
    is_veg: true,
    is_bestseller: true,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 8,
  },
  {
    slug: 'roasted-chicken-pizza',
    name: 'Roasted Chicken Pizza',
    description: 'Roast Chicken, Onion and Sweetcorn',
    category_slug: 'non-veg-pizzas',
    price_small: 310,
    price_medium: 390,
    price_large: 540,
    image_url: null,
    is_veg: false,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 1,
  },
  {
    slug: 'tandoori-chicken-pizza',
    name: 'Tandoori Chicken Pizza',
    description: 'Tandoori Chicken, Onion, Capsicum and Mushroom',
    category_slug: 'non-veg-pizzas',
    price_small: 330,
    price_medium: 420,
    price_large: 580,
    image_url: null,
    is_veg: false,
    is_bestseller: true,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 2,
  },
  {
    slug: 'bbq-chicken-pizza',
    name: 'BBQ Chicken Pizza',
    description: 'BBQ Chicken, Onion, Capsicum and Sweetcorn',
    category_slug: 'non-veg-pizzas',
    price_small: 330,
    price_medium: 420,
    price_large: 580,
    image_url: null,
    is_veg: false,
    is_bestseller: true,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 3,
  },
  {
    slug: 'chicken-sausage-pizza',
    name: 'Chicken Sausage Pizza',
    description: 'Sliced Chicken Sausage, Onion and Capsicum',
    category_slug: 'non-veg-pizzas',
    price_small: 370,
    price_medium: 420,
    price_large: 610,
    image_url: null,
    is_veg: false,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 4,
  },
  {
    slug: 'chicken-makhani-pizza',
    name: 'Chicken Makhani Pizza',
    description: 'Tandoored Chicken and Onions. Finished with Makhani Gravy.',
    category_slug: 'non-veg-pizzas',
    price_small: 330,
    price_medium: 440,
    price_large: 640,
    image_url: null,
    is_veg: false,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 5,
  },
  {
    slug: 'chicken-bacon-pizza',
    name: 'Chicken Bacon Pizza',
    description: 'Chicken-Bacon, Sliced Black Olives and Onion',
    category_slug: 'non-veg-pizzas',
    price_small: 370,
    price_medium: 420,
    price_large: 610,
    image_url: null,
    is_veg: false,
    is_bestseller: false,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 6,
  },
  {
    slug: 'chicken-peri-peri-pizza',
    name: 'Chicken Peri Peri Pizza',
    description: 'Peri Peri Chicken, Onion, Red Pepper and Jalapenos',
    category_slug: 'non-veg-pizzas',
    price_small: 340,
    price_medium: 460,
    price_large: 640,
    image_url: null,
    is_veg: false,
    is_bestseller: false,
    is_spicy: true,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 7,
  },
  {
    slug: 'spicy-chicken-tikka-pizza',
    name: 'Spicy Chicken Tikka Pizza',
    description: 'Tandoori Chicken, Onion and Red Pepper',
    category_slug: 'non-veg-pizzas',
    price_small: 310,
    price_medium: 420,
    price_large: 580,
    image_url: null,
    is_veg: false,
    is_bestseller: false,
    is_spicy: true,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 8,
  },
  {
    slug: 'chicken-garlic-twist',
    name: 'Chicken Garlic Twist',
    description: 'Garlic Chicken, Onion and Sliced Black Olives',
    category_slug: 'non-veg-pizzas',
    price_small: 330,
    price_medium: 400,
    price_large: 550,
    image_url: null,
    is_veg: false,
    is_bestseller: true,
    is_spicy: false,
    is_new: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 9,
  },
];

const pizzaToppingLinks = {
  margarita: ['mozzarella', 'cheddar', 'basil'],
  'veg-delight-pizza': ['onion', 'capsicum', 'sweetcorn'],
  'farm-fresh-pizza': ['onion', 'capsicum', 'mushroom', 'sweetcorn'],
  'mushroom-garlic-twist': ['mushroom', 'onion', 'black-olives'],
  'tangy-veg-pizza': ['onion', 'capsicum', 'jalapeno', 'red-pepper'],
  'paneer-tikka-pizza': ['paneer-tikka', 'onion', 'capsicum'],
  'veg-extravaganza-pizza': ['herbed-onion', 'capsicum', 'mushroom', 'sweetcorn', 'black-olives', 'grilled-paneer'],
  'paneer-makhani-pizza': ['grilled-paneer', 'onion', 'makhani-gravy'],
  'roasted-chicken-pizza': ['roast-chicken', 'onion', 'sweetcorn'],
  'tandoori-chicken-pizza': ['tandoori-chicken', 'onion', 'capsicum', 'mushroom'],
  'bbq-chicken-pizza': ['bbq-chicken', 'onion', 'capsicum', 'sweetcorn'],
  'chicken-sausage-pizza': ['chicken-sausage', 'onion', 'capsicum'],
  'chicken-makhani-pizza': ['tandoori-chicken', 'onion', 'makhani-gravy'],
  'chicken-bacon-pizza': ['chicken-bacon', 'black-olives', 'onion'],
  'chicken-peri-peri-pizza': ['peri-peri-chicken', 'onion', 'red-pepper', 'jalapeno'],
  'spicy-chicken-tikka-pizza': ['tandoori-chicken', 'onion', 'red-pepper'],
  'chicken-garlic-twist': ['garlic-chicken', 'onion', 'black-olives'],
};

const extraSeeds = [
  {
    slug: 'cheese',
    name: 'Cheese',
    price_small: 40,
    price_medium: 60,
    price_large: 80,
    is_veg: true,
    is_active: true,
    is_sold_out: false,
    sort_order: 1,
  },
  {
    slug: 'onion-capsicum-mushroom-sweetcorn',
    name: 'Onion / Capsicum / Mushroom / Sweetcorn',
    price_small: 20,
    price_medium: 30,
    price_large: 40,
    is_veg: true,
    is_active: true,
    is_sold_out: false,
    sort_order: 2,
  },
  {
    slug: 'red-pepper-olives-jalapenos-paneer',
    name: 'Red Pepper / Olives / Jalapenos / Paneer',
    price_small: 40,
    price_medium: 50,
    price_large: 70,
    is_veg: true,
    is_active: true,
    is_sold_out: false,
    sort_order: 3,
  },
  {
    slug: 'chicken',
    name: 'Chicken',
    price_small: 50,
    price_medium: 70,
    price_large: 100,
    is_veg: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 4,
  },
];

const addonSeeds = [
  {
    slug: 'garlic-bread-sticks',
    name: 'Garlic Bread Sticks',
    description: '6 pieces',
    image_url: null,
    price: 70,
    is_veg: true,
    is_bestseller: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 1,
  },
  {
    slug: 'cheesy-garlic-bread',
    name: 'Cheesy Garlic Bread',
    description: 'Calzone Style, 6 Pieces',
    image_url: null,
    price: 150,
    is_veg: true,
    is_bestseller: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 2,
  },
  {
    slug: 'chicken-kheema-calzone',
    name: 'Chicken Kheema Calzone',
    description: '4 pieces',
    image_url: null,
    price: 300,
    is_veg: false,
    is_bestseller: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 3,
  },
  {
    slug: 'rich-chocolate-brownie',
    name: 'Rich Chocolate Brownie',
    description: '80 gms',
    image_url: null,
    price: 90,
    is_veg: false,
    is_bestseller: false,
    is_active: true,
    is_sold_out: false,
    sort_order: 4,
  },
];

async function upsertRecord(table, record) {
  const { category_slug, ...dbRecord } = record;
  const { data: existing, error: fetchError } = await supabase
    .from(table)
    .select('id')
    .eq('slug', dbRecord.slug)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to look up ${table} record "${dbRecord.slug}": ${fetchError.message}`);
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from(table)
      .update(dbRecord)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update ${table} record "${dbRecord.slug}": ${error.message}`);
    }

    return { action: 'updated', row: data };
  }

  const { data, error } = await supabase
    .from(table)
    .insert(dbRecord)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to insert ${table} record "${dbRecord.slug}": ${error.message}`);
  }

  return { action: 'created', row: data };
}

async function seedTable(table, records) {
  const rowsBySlug = new Map();
  const summary = { created: 0, updated: 0 };

  for (const record of records) {
    const result = await upsertRecord(table, record);
    summary[result.action] += 1;
    rowsBySlug.set(record.slug, result.row);
  }

  return { summary, rowsBySlug };
}

async function syncPizzaToppings(pizzaId, toppingIds) {
  const { error: deleteError } = await supabase
    .from('pizza_toppings')
    .delete()
    .eq('pizza_id', pizzaId);

  if (deleteError) {
    throw new Error(`Failed to clear toppings for pizza ${pizzaId}: ${deleteError.message}`);
  }

  if (!toppingIds.length) return;

  const { error: insertError } = await supabase
    .from('pizza_toppings')
    .insert(toppingIds.map((toppingId) => ({ pizza_id: pizzaId, topping_id: toppingId })));

  if (insertError) {
    throw new Error(`Failed to seed toppings for pizza ${pizzaId}: ${insertError.message}`);
  }
}

async function main() {
  console.log('Seeding menu into Supabase...');

  const categoriesResult = await seedTable('categories', categorySeeds);
  const toppingsResult = await seedTable('toppings', toppingSeeds);

  const categoryIdBySlug = new Map(
    Array.from(categoriesResult.rowsBySlug.entries()).map(([slug, row]) => [slug, row.id]),
  );

  const toppingIdBySlug = new Map(
    Array.from(toppingsResult.rowsBySlug.entries()).map(([slug, row]) => [slug, row.id]),
  );

  const pizzaRecords = pizzaSeeds.map((pizza) => {
    const categoryId = categoryIdBySlug.get(pizza.category_slug);
    if (!categoryId) {
      throw new Error(`Missing category for pizza "${pizza.slug}" -> "${pizza.category_slug}"`);
    }

    return {
      ...pizza,
      category_id: categoryId,
    };
  });

  const pizzaResult = await seedTable('pizzas', pizzaRecords);
  const extraResult = await seedTable('extras', extraSeeds);
  const addonResult = await seedTable('addons', addonSeeds);
  const dessertResult = await seedTable('desserts', []);

  for (const pizza of pizzaResult.rowsBySlug.values()) {
    const linkedToppings = pizzaToppingLinks[pizza.slug] || [];
    const toppingIds = linkedToppings.map((slug) => {
      const toppingId = toppingIdBySlug.get(slug);
      if (!toppingId) {
        throw new Error(`Missing topping for pizza "${pizza.slug}" -> "${slug}"`);
      }
      return toppingId;
    });

    await syncPizzaToppings(pizza.id, toppingIds);
  }

  console.log('Seed complete.');
  console.log(`Categories: ${categoriesResult.summary.created} created, ${categoriesResult.summary.updated} updated`);
  console.log(`Toppings: ${toppingsResult.summary.created} created, ${toppingsResult.summary.updated} updated`);
  console.log(`Pizzas: ${pizzaResult.summary.created} created, ${pizzaResult.summary.updated} updated`);
  console.log(`Extras: ${extraResult.summary.created} created, ${extraResult.summary.updated} updated`);
  console.log(`Addons: ${addonResult.summary.created} created, ${addonResult.summary.updated} updated`);
  console.log(`Desserts: ${dessertResult.summary.created} created, ${dessertResult.summary.updated} updated`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
