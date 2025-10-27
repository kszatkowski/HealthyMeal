import { type Page } from "@playwright/test";

/**
 * Page Object Model - Login Page
 * Handles interactions with the login page view at /login
 */
export class LoginPage {
  private readonly _page: Page;

  constructor(page: Page) {
    this._page = page;
  }

  async navigateToLoginPage() {
    await this._page.goto("/login");
    await this._page.waitForLoadState("networkidle");
  }

  async fillEmail(email: string) {
    const emailInput = await this._page.getByTestId("login-email-input");
    await emailInput.fill(email);
  }

  async fillPassword(password: string) {
    const passwordInput = await this._page.getByTestId("login-password-input");
    await passwordInput.fill(password);
  }

  async clickLoginButton() {
    const loginButton = await this._page.getByTestId("login-button");
    await loginButton.click();
  }
}
