import { defineConfig } from "@playwright/test";

const port = process.env.ORBIT_BROWSER_PORT ?? "4178";
const baseURL = `http://localhost:${port}/orbit-hub/`;

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL,
    channel: process.env.ORBIT_BROWSER_CHANNEL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --host localhost --port ${port} --strictPort`,
    env: { ORBIT_BASE_PATH: "/orbit-hub/" },
    url: baseURL,
  },
});
