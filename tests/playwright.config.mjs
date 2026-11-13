import { defineConfig } from "@playwright/test";

export default defineConfig({
    timeout: 45_000,
    globalTimeout: 240_000,
    use: { browserName: "chromium", baseURL: "http://localhost:8080" },
});
