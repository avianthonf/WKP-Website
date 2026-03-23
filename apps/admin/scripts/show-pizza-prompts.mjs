import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const promptsPath = path.join(scriptDir, 'pizza-prompts.json');

function loadPrompts() {
  const raw = fs.readFileSync(promptsPath, 'utf8');
  const prompts = JSON.parse(raw);

  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error('pizza-prompts.json is empty or invalid');
  }

  return prompts;
}

function waitForEnter(rl) {
  return new Promise((resolve) => {
    rl.question('Press Enter for the next prompt...', () => resolve());
  });
}

async function main() {
  const prompts = loadPrompts();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    for (let index = 0; index < prompts.length; index += 1) {
      const item = prompts[index];
      const filename = `${item.slug}.png`;
      console.log('');
      console.log(`${index + 1}/${prompts.length}`);
      console.log(`Filename: ${filename}`);
      console.log(`Name: ${item.name}`);
      console.log('Prompt:');
      console.log(item.prompt);

      if (index < prompts.length - 1) {
        await waitForEnter(rl);
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
