import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173';
const chromiumLaunchOptions = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
  : undefined;
const acquisitionBrowserTests = /(?:browser-accessibility|yard-owner-acquisition|provider-invitation-progress)\.spec\.ts/;

export default defineConfig({
  testDir: './e2e',
  outputDir: '/tmp/grover-playwright-results',
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'], launchOptions: chromiumLaunchOptions },
    },
    {
      name: 'chromium-desktop',
      testMatch: acquisitionBrowserTests,
      use: { ...devices['Desktop Chrome'], launchOptions: chromiumLaunchOptions },
    },
    {
      name: 'firefox-desktop',
      testMatch: acquisitionBrowserTests,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-mobile',
      testMatch: acquisitionBrowserTests,
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
