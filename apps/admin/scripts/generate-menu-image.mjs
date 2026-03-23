import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { InferenceClient } from '@huggingface/inference';
import { createClient } from '@supabase/supabase-js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(scriptDir, '..', '.env.local');
const outputDir = path.join(scriptDir, '..', 'tmp', 'generated-images');
const referenceImagePath = path.join(scriptDir, '..', 'reference-images', 'pizza-reference.jpg');
const HF_TEXT_MODEL = 'black-forest-labs/FLUX.1-schnell';
const HF_REFERENCE_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';
const CONFIG = {
  model: HF_TEXT_MODEL,
  applyByDefault: true,
  jobs: [
    {
      type: 'pizza',
      slug: 'margarita',
      folder: 'pizzas',
    },
  ],
};

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

function joinWithOxford(values) {
  const filtered = values.map((value) => value.trim()).filter(Boolean);
  if (filtered.length <= 1) return filtered[0] || '';
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered.at(-1)}`;
}

function buildPizzaPrompt(item, toppings) {
  const toppingNames = toppings.map((topping) => topping.name);
  const toppingLine = toppingNames.length
    ? `Toppings: ${joinWithOxford(toppingNames)}.`
    : 'Toppings: none visible, keep the pizza simple and balanced.';

  const proteinLine = item.is_veg ? 'Vegetarian pizza.' : 'Non-vegetarian pizza.';
  const styleLine = item.is_bestseller
    ? 'Make it feel like a best-selling signature pizza.'
    : item.is_new
      ? 'Make it feel freshly introduced and premium.'
      : 'Make it feel like a polished menu hero.';

  const spiceLine = item.is_spicy ? 'Add a subtle spicy visual energy, but keep it appetizing.' : '';

  return [
    'Premium editorial food photography of a pizza on a clean warm cream background, square composition, top-down with a slight angle, soft natural window light, crisp cheese pull, rich sauce, textured crust, realistic toppings, high detail, appetizing and clean, no text, no watermark, no packaging, no hands, no clutter.',
    styleLine,
    proteinLine,
    toppingLine,
    spiceLine,
    `Pizza name: ${item.name}.`,
    item.description ? `Menu description: ${item.description}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildReferencePrompt(item, toppings) {
  const toppingNames = toppings.map((topping) => topping.name);
  const toppingLine = toppingNames.length
    ? `Target toppings: ${joinWithOxford(toppingNames)}.`
    : 'Target toppings: keep the pizza simple and balanced.';

  const proteinLine = item.is_veg ? 'Vegetarian pizza target.' : 'Non-vegetarian pizza target.';
  const styleLine = item.is_bestseller
    ? 'Keep the image feeling like a best-selling signature pizza.'
    : item.is_new
      ? 'Keep the image feeling freshly introduced and premium.'
      : 'Keep the image feeling like a polished menu hero.';

  return [
    'Use the reference image as the visual anchor for the pizza only. Preserve the warm cream studio background, the soft lighting, the composition, the plate framing, and the overall polished menu style. Only adapt the pizza itself so it matches the target menu item. Keep the background style identical and do not introduce props, hands, text, packaging, or a different setting.',
    styleLine,
    proteinLine,
    toppingLine,
    `Pizza name: ${item.name}.`,
    item.description ? `Menu description: ${item.description}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildAddonPrompt(item) {
  return [
    'Premium editorial food photography of a single side item on a warm cream background, square composition, soft daylight, minimal plating, crisp texture, realistic shadows, appetizing presentation, no text, no watermark, no hands, no clutter.',
    `Show the addon as a standalone plated item.`,
    `Addon name: ${item.name}.`,
    item.description ? `Menu description: ${item.description}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildDessertPrompt(item) {
  return [
    'Premium editorial dessert photography on a warm cream background, square composition, soft bright light, delicate plating, glossy and rich texture, realistic shadows, no text, no watermark, no hands, no clutter.',
    `Show the dessert as a standalone plated dessert item.`,
    `Dessert name: ${item.name}.`,
    item.description ? `Menu description: ${item.description}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

async function loadSupabase() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function fetchPizzaContext(supabase, slug) {
  const { data: pizza, error: pizzaError } = await supabase
    .from('pizzas')
    .select('id, slug, name, description, image_url, is_veg, is_bestseller, is_new, is_spicy')
    .eq('slug', slug)
    .single();

  if (pizzaError) {
    throw new Error(`Failed to load pizza "${slug}": ${pizzaError.message}`);
  }

  const { data: links, error: linksError } = await supabase
    .from('pizza_toppings')
    .select('topping_id')
    .eq('pizza_id', pizza.id);

  if (linksError) {
    throw new Error(`Failed to load toppings for pizza "${slug}": ${linksError.message}`);
  }

  const toppingIds = (links || []).map((row) => row.topping_id).filter(Boolean);
  if (!toppingIds.length) {
    return { pizza, toppings: [] };
  }

  const { data: toppings, error: toppingsError } = await supabase
    .from('toppings')
    .select('id, name, category, is_veg')
    .in('id', toppingIds);

  if (toppingsError) {
    throw new Error(`Failed to resolve toppings for pizza "${slug}": ${toppingsError.message}`);
  }

  const toppingById = new Map((toppings || []).map((topping) => [topping.id, topping]));
  const orderedToppings = toppingIds.map((id) => toppingById.get(id)).filter(Boolean);

  return { pizza, toppings: orderedToppings };
}

async function fetchMenuItem(supabase, type, slug) {
  if (type === 'addon') {
    const { data, error } = await supabase
      .from('addons')
      .select('id, slug, name, description, image_url, is_veg, is_bestseller')
      .eq('slug', slug)
      .single();

    if (error) {
      throw new Error(`Failed to load addon "${slug}": ${error.message}`);
    }

    return data;
  }

  const { data, error } = await supabase
    .from('desserts')
    .select('id, slug, name, description, image_url, is_veg')
    .eq('slug', slug)
    .single();

  if (error) {
    throw new Error(`Failed to load dessert "${slug}": ${error.message}`);
  }

  return data;
}

async function loadReferenceImage() {
  if (!fs.existsSync(referenceImagePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(referenceImagePath);
  return new Blob([buffer], { type: 'image/jpeg' });
}

function createHfClient() {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    throw new Error('Set HF_TOKEN in apps/admin/.env.local before running the generator');
  }

  return new InferenceClient(hfToken);
}

async function generateTextImage(client, prompt) {
  const blob = await client.textToImage({
    provider: 'hf-inference',
    model: CONFIG.model,
    inputs: prompt,
    parameters: {
      num_inference_steps: 28,
      guidance_scale: 3.5,
      target_size: {
        width: 1024,
        height: 1024,
      },
    },
  });

  return Buffer.from(await blob.arrayBuffer());
}

async function generateImageWithReference(client, prompt, referenceImageBuffer) {
  const blob = await client.imageToImage({
    provider: 'hf-inference',
    model: HF_REFERENCE_MODEL,
    inputs: referenceImageBuffer,
    parameters: {
      prompt,
      guidance_scale: 2.5,
      num_inference_steps: 28,
      strength: 0.4,
      target_size: {
        width: 1024,
        height: 1024,
      },
    },
  });

  return Buffer.from(await blob.arrayBuffer());
}

async function generatePizzaImage(client, prompt, referenceImageBuffer) {
  if (!referenceImageBuffer) {
    return generateTextImage(client, prompt);
  }

  try {
    return await generateImageWithReference(client, prompt, referenceImageBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Reference edit unavailable, falling back to text-to-image: ${message}`);
    return generateTextImage(client, prompt);
  }
}

async function uploadToMenuBucket(supabase, buffer, folder, slug) {
  const filename = `${Date.now()}-${slug}.png`;
  const pathName = `${folder}/${filename}`;
  const { error } = await supabase.storage.from('menu').upload(pathName, buffer, {
    contentType: 'image/png',
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload generated image: ${error.message}`);
  }

  const { data } = supabase.storage.from('menu').getPublicUrl(pathName);
  if (!data?.publicUrl) {
    throw new Error('Generated image uploaded, but no public URL could be created');
  }

  return { pathName, publicUrl: data.publicUrl };
}

async function updateItemImage(supabase, type, id, publicUrl) {
  const tableByType = {
    pizza: 'pizzas',
    addon: 'addons',
    dessert: 'desserts',
  };

  const table = tableByType[type];
  const { error } = await supabase.from(table).update({ image_url: publicUrl }).eq('id', id);

  if (error) {
    throw new Error(`Failed to update ${type} image_url: ${error.message}`);
  }
}

async function ensureOutputDir() {
  await fs.promises.mkdir(outputDir, { recursive: true });
}

async function main() {
  loadEnvFile(envPath);
  const supabase = await loadSupabase();
  const referenceImageBuffer = await loadReferenceImage();
  const referenceModeEnabled = Boolean(referenceImageBuffer);
  const client = createHfClient();

  await ensureOutputDir();
  for (const job of CONFIG.jobs) {
    if (!['pizza', 'addon', 'dessert'].includes(job.type)) {
      throw new Error(`Type must be one of: pizza, addon, dessert. Received "${job.type}"`);
    }

    const context =
      job.type === 'pizza'
        ? await fetchPizzaContext(supabase, job.slug)
        : { [job.type]: await fetchMenuItem(supabase, job.type, job.slug) };

    const item = job.type === 'pizza' ? context.pizza : context[job.type];
    const prompt =
      job.type === 'pizza'
        ? referenceModeEnabled
          ? buildReferencePrompt(item, context.toppings)
          : buildPizzaPrompt(item, context.toppings)
        : job.type === 'addon'
          ? buildAddonPrompt(item)
          : buildDessertPrompt(item);

    const dryRun = process.argv.includes('--dry-run') || !CONFIG.applyByDefault;
    const meta = {
      type: job.type,
      slug: item.slug,
      name: item.name,
      model: CONFIG.model,
      dryRun,
    };

    await fs.promises.writeFile(
      path.join(outputDir, `${job.type}-${job.slug}.prompt.txt`),
      `${prompt}\n`,
      'utf8'
    );

    console.log(JSON.stringify({ ...meta, prompt }, null, 2));

    const buffer =
      referenceModeEnabled && job.type === 'pizza'
        ? await generatePizzaImage(client, prompt, referenceImageBuffer)
        : await generateTextImage(client, prompt);
    await fs.promises.writeFile(path.join(outputDir, `${job.type}-${job.slug}.png`), buffer);

    if (dryRun) {
      console.log(
        JSON.stringify(
          {
            ...meta,
            localOnly: true,
            outputPath: path.join(outputDir, `${job.type}-${job.slug}.png`),
          },
          null,
          2
        )
      );
      console.log('Dry run complete. The image was generated locally only.');
      continue;
    }

    const { publicUrl } = await uploadToMenuBucket(supabase, buffer, job.folder, job.slug);
    await updateItemImage(supabase, job.type, item.id, publicUrl);

    console.log(
      JSON.stringify(
        {
          ...meta,
          applied: true,
          outputPath: path.join(outputDir, `${job.type}-${job.slug}.png`),
          publicUrl,
        },
        null,
        2
      )
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
