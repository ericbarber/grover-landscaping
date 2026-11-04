import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const webServerPort = new URL(baseURL).port || (baseURL.startsWith('https:') ? '443' : '80');
const webServerCommand = process.env.CI
  ? `VITE_API_BASE_URL=http://localhost:8080 npm run build && npm run preview -- --host 127.0.0.1 --port ${webServerPort}`
  : `npm run dev -- --host 127.0.0.1 --port ${webServerPort}`;
const chromiumLaunchOptions = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
  : undefined;
const acquisitionBrowserTests = /(?:browser-accessibility|local-role-workspaces|shared-customer-proof|yard-owner-acquisition|provider-entry|provider-invitation-progress)\.spec\.ts/;
const serviceWorkerProductionTests = /service-worker-production\.spec\.ts/;

export default defineConfig({
  testDir: './e2e',
  outputDir: '/tmp/yardfolio-playwright-results',
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  timeout: 60_000,
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile',
      testIgnore: serviceWorkerProductionTests,
      use: { ...devices['Pixel 7'], launchOptions: chromiumLaunchOptions },
    },
    {
      name: 'chromium-desktop',
      testMatch: acquisitionBrowserTests,
      testIgnore: serviceWorkerProductionTests,
      use: { ...devices['Desktop Chrome'], launchOptions: chromiumLaunchOptions },
    },
    {
      name: 'firefox-desktop',
      testMatch: acquisitionBrowserTests,
      testIgnore: serviceWorkerProductionTests,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-mobile',
      testMatch: acquisitionBrowserTests,
      testIgnore: serviceWorkerProductionTests,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'chromium-production-pwa',
      testMatch: serviceWorkerProductionTests,
      use: {
        ...devices['Pixel 7'],
        launchOptions: chromiumLaunchOptions,
        serviceWorkers: 'allow',
      },
    },
  ],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
