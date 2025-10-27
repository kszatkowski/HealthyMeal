import { test as setup } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { LoginPage } from "./pages/login.page";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, "../playwright/.auth/user.json");

const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

setup("authenticate user", async ({ page }) => {
  if (!E2E_USERNAME || !E2E_PASSWORD) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required");
  }

  const loginPage = new LoginPage(page);

  // Navigate to login page
  await loginPage.navigateToLoginPage();

  // Fill in login form
  await loginPage.fillEmail(E2E_USERNAME);
  await loginPage.fillPassword(E2E_PASSWORD);

  // Click login button
  await loginPage.clickLoginButton();

  // Wait for successful login - recipes list should appear on home page
  await page.waitForURL(/.*\/$/);
  await page.waitForLoadState("networkidle");

  // Save storage state to use in other tests
  await page.context().storageState({ path: authFile });
});
