import { type Page } from "@playwright/test";

/**
 * Console helpers
 */

/**
 * Get all console messages from the page
 */
export async function getConsoleMessages(
  page: Page,
): Promise<{ errors: string[]; warnings: string[] }> {
  const messages = await page.evaluate(() => {
    const captured: { type: string; args: any[] }[] = [];

    // Capture existing console methods
    const original = {
      error: console.error,
      warn: console.warn,
      log: console.log,
      info: console.info,
      debug: console.debug,
    };

    console.error = (...args: any[]) => {
      captured.push({ type: "error", args });
      original.error(...args);
    };

    console.warn = (...args: any[]) => {
      captured.push({ type: "warning", args });
      original.warn(...args);
    };

    console.log = (...args: any[]) => {
      captured.push({ type: "log", args });
      original.log(...args);
    };

    console.info = (...args: any[]) => {
      captured.push({ type: "info", args });
      original.info(...args);
    };

    console.debug = (...args: any[]) => {
      captured.push({ type: "debug", args });
      original.debug(...args);
    };

    return captured;
  });

  const errors = messages.filter((m) => m.type === "error").map((m) => m.args.join(" "));
  const warnings = messages.filter((m) => m.type === "warning").map((m) => m.args.join(" "));

  return { errors, warnings };
}
