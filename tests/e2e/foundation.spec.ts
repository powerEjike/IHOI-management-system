import { expect, test } from "@playwright/test";

test("all public pages render and unknown paths return 404", async ({
  request,
}) => {
  for (const path of [
    "/",
    "/about",
    "/outreach",
    "/discipleship",
    "/resources",
    "/projects",
    "/gallery",
    "/events",
    "/testimonies",
    "/partner",
    "/volunteer",
    "/contact",
    "/privacy",
    "/portal",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  }
  expect((await request.get("/not-a-real-page")).status()).toBe(404);
  expect((await request.get("/resources/" + "a".repeat(32))).status()).toBe(
    404,
  );
  expect((await request.get("/api/media/" + "a".repeat(32))).status()).toBe(
    404,
  );
  expect((await request.get("/portal/not-a-real-page")).status()).toBe(404);
  const protectedPage = await request.get("/portal/converts", {
    maxRedirects: 0,
  });
  expect(protectedPage.status()).toBe(307);
  expect(protectedPage.headers().location).toContain("/portal/login");
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /",
  );
});

test("homepage calls to action navigate to their intended sections", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A heart for God.",
  );
  await page.getByRole("link", { name: "Explore our mission" }).click();
  await expect(page).toHaveURL(/\/#mission$/);
  await expect(page.locator("#mission")).toBeInViewport();
  await page.getByRole("link", { name: "Join the movement" }).click();
  await expect(page).toHaveURL(/\/partner$/);
  await expect(
    page.getByRole("heading", { name: "Pray", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile navigation supports opening, closing, escape, and page changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Menu" });
  await toggle.click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Outreach", exact: true })
    .focus();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Outreach", exact: true })
    .click();
  await expect(page).toHaveURL(/\/outreach$/);
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("phone, tablet, and desktop layouts fit their viewports", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      "/",
      "/partner",
      "/portal",
      "/gallery",
      "/resources",
      "/events",
      "/contact",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${path} at ${width}px`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
});

test("public submissions stay inactive and private staff pages require sign-in", async ({
  page,
}) => {
  for (const path of ["/contact", "/volunteer", "/partner"]) {
    await page.goto(path);
    await expect(page.locator("form, input, textarea")).toHaveCount(0);
  }
  await page.goto("/portal/dashboard");
  await expect(page).toHaveURL(/\/portal\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "leadership portal",
  );
});
