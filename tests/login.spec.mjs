import { createHash, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";

const origin = "http://localhost:8080";
const realm = "bitportal";
const issuer = origin + "/realms/" + realm;
const callback = origin + "/bitportal-test/callback";
const client = "bitportal-e2e";
const password = "BitPortal-local-test-123";
const digest = value => createHash("sha256").update(value);
const run = randomBytes(5).toString("hex");

test.beforeAll(async ({ request }) => {
    test.setTimeout(90_000);
    await expect.poll(async () => {
        try {
            return (await request.get(issuer + "/.well-known/openid-configuration", { timeout: 2000 })).status();
        } catch {
            return 0;
        }
    }, { timeout: 75_000, intervals: [500, 1000] }).toBe(200);
});

async function login(page) {
    const verifier = randomBytes(32).toString("base64url");
    const state = randomBytes(16).toString("hex");
    const url = new URL(issuer + "/protocol/openid-connect/auth");
    url.search = new URLSearchParams({
        client_id: client, redirect_uri: callback, response_type: "code", scope: "openid profile email",
        state, prompt: "login", code_challenge: digest(verifier).digest("base64url"), code_challenge_method: "S256",
    });
    await page.route(callback + "**", route => route.fulfill({ status: 200, body: "OIDC callback" }));
    await page.goto(url.href);
    return { verifier, state };
}

async function redeem(page, authorization) {
    await page.waitForURL(callback + "**");
    const returned = new URL(page.url()).searchParams;
    expect(returned.get("state")).toBe(authorization.state);
    expect(returned.get("code")).toBeTruthy();
    const response = await page.request.post(issuer + "/protocol/openid-connect/token", {
        form: { grant_type: "authorization_code", client_id: client, redirect_uri: callback,
            code: returned.get("code"), code_verifier: authorization.verifier },
    });
    expect(response.ok()).toBeTruthy();
    const { id_token } = await response.json();
    return JSON.parse(Buffer.from(id_token.split(".")[1], "base64url"));
}

function expectProfileWithoutContactDetails(identity, username) {
    expect(identity.preferred_username).toBe(username);
    expect(identity.email).toBeUndefined();
    expect(identity.given_name).toBeUndefined();
    expect(identity.family_name).toBeUndefined();
}

test("standalone theme renders login and registration on desktop and mobile", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 850 });
    await login(page);
    await expect(page.locator("#kc-header-wrapper")).toContainText("BitPortal");
    await expect(page.locator(".pf-v5-c-login__main")).toHaveCSS("display", "grid");
    await page.screenshot({ path: testInfo.outputPath("login-desktop.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#social-lnurl-auth")).toHaveCount(0);
    await expect(page.locator("#social-nostr")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.locator("#kc-registration a").click();
    await expect(page.locator("#kc-register-form")).toBeVisible();
    await expect(page.locator("#register-lnurl-auth")).toHaveCount(0);
    await expect(page.locator("#register-nostr")).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("register-mobile.png") });
});

test("password registration and login using username or email", async ({ browser, page }) => {
    const username = "password-" + run;
    const registration = await login(page);
    await page.locator("#kc-registration a").click();
    const email = username + "@example.test";
    await page.locator("#username").fill(username);
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.locator("#password-confirm").fill(password);
    await page.locator("#kc-register-form [type=submit]").click();
    const registered = await redeem(page, registration);

    for (const loginName of [username, email]) {
        const context = await browser.newContext();
        try {
            const next = await context.newPage();
            const auth = await login(next);
            await next.locator("#username").fill(loginName);
            await next.locator("#password").fill(password);
            await next.locator("#kc-login").click();
            expect((await redeem(next, auth)).sub).toBe(registered.sub);
        } finally {
            await context.close();
        }
    }
});

test("password signup accepts an empty profile and the branded account console saves edits", async ({ page }, testInfo) => {
    const username = "password-minimal-" + run;
    const registration = await login(page);
    await page.locator("#kc-registration a").click();
    await page.locator("#username").fill(username);
    await page.locator("#password").fill(password);
    await page.locator("#password-confirm").fill(password);
    await page.locator("#kc-register-form [type=submit]").click();
    expectProfileWithoutContactDetails(await redeem(page, registration), username);

    await page.setViewportSize({ width: 1280, height: 850 });
    await page.goto(issuer + "/account/");
    await expect(page.getByTestId("page-heading")).toBeVisible();
    await expect(page.locator('img[src$="/img/brand.svg"]')).toBeVisible();
    await expect(page.locator(`link[href*="/account/${realm}/css/account.css"]`)).toHaveCount(1);
    await expect(page.locator("#save-btn")).toHaveCSS("border-radius", "999px");
    await page.screenshot({ path: testInfo.outputPath("account-desktop.png") });

    const firstName = page.locator('input[name="firstName"]');
    await firstName.fill("Casey");
    await Promise.all([
        page.waitForResponse(response => response.request().method() === "POST" &&
            response.url().replace(/\/$/, "") === issuer + "/account" && response.ok()),
        page.getByTestId("save").click(),
    ]);
    await page.reload();
    await expect(firstName).toHaveValue("Casey");
});
