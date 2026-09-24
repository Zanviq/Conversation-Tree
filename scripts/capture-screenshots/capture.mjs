// Captures README screenshots from a running instance (docker compose up).
// Usage:
//   cd scripts/capture-screenshots && npm install && npx playwright install chromium
//   BASE_URL=http://localhost:8080 npm run capture
// Screens are taken with the seeded demo account and no Gemini API key.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8080';
const OUT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../image');
const DEMO = { username: 'demo', password: 'demo1234' };

const settle = async (page) => {
  await page.waitForLoadState('networkidle');
  // d3 transitions in the map (links are drawn after the nodes settle)
  await page.waitForTimeout(3000);
};

const shot = async (page, name) => {
  await settle(page);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  console.log('saved', path.relative(process.cwd(), file));
};

const openConversation = async (page, title) => {
  await page.getByText(title, { exact: true }).first().click();
  await page.waitForTimeout(300);
};

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  // Make sure no Gemini API key is present in the captured browser
  await page.addInitScript(() => localStorage.removeItem('GEMINI_API_KEY'));

  // 1. Landing / sign in
  await page.goto(BASE_URL);
  await page.getByPlaceholder('Username').waitFor();
  await shot(page, 'landing-login');

  // 2. Sign in with the demo account -> main screen (chat + conversation map)
  await page.getByPlaceholder('Username').fill(DEMO.username);
  await page.getByPlaceholder('Password').fill(DEMO.password);
  await page.getByRole('button', { name: 'Sign in' }).last().click();
  await page.getByText('Recents').waitFor();
  await openConversation(page, 'Which database should I use for my side project?');
  await page.getByText('Track A').first().waitFor();
  await shot(page, 'main-timeline-compare');

  // 3. Read-only view of a compared track
  await page.getByRole('button', { name: /Track A/ }).first().click();
  await page.getByText('Historical Track').waitFor();
  await shot(page, 'track-view');
  await page.keyboard.press('Escape');
  await page.mouse.click(10, 10);

  // 4. Connected memory between branches
  await openConversation(page, 'Explain "The Prince" by Machiavelli');
  await page.getByText('Does this idea still apply to modern leadership?').first().waitFor();
  await shot(page, 'connected-memory');

  // 5. Branching conversation map
  await openConversation(page, 'Plan a 3-day trip to Kyoto');
  await page.getByText('Make it more focused on food instead.').first().waitFor();
  await shot(page, 'branching-map');

  // 6. Model selection menu
  await page.getByTitle('Select Model').click();
  await page.getByText('Conversation Model').waitFor();
  // Move the pointer off the button so its hover tooltip does not cover the menu
  await page.mouse.move(700, 600);
  await shot(page, 'model-select');
  await page.mouse.click(700, 450);

  // 7. Gemini API key settings (empty – no key is ever typed here)
  await page.getByRole('button', { name: 'Add API key' }).click();
  await page.getByText('Get a free API key from Google AI Studio').waitFor();
  await shot(page, 'api-key-settings');

  await browser.close();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
