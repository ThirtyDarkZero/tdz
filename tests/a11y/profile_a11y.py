"""
Accessibility regression checks for the fan (Tastemaker) profile.

Verifies:
  1. Skip-to-content link is reachable by keyboard and moves focus into <main>.
  2. Every focused interactive element shows a visible focus indicator.
  3. Tablist / tab / tabpanel ARIA roles are wired up and arrow keys switch tabs.
  4. Reduced-motion preference disables animations/transitions.

Run:  python3 /tmp/browser/a11y-profile/check.py
"""
import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
ROUTE = "/profile"
SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS " if ok else "FAIL ") + name + ((" — " + str(detail)) if detail else ""))


async def restore_session(context, page):
    key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    sess = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cookies = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cookies:
        parsed = json.loads(cookies)
        for c in parsed:
            c["url"] = BASE
        await context.add_cookies(parsed)
    await page.goto(BASE, wait_until="domcontentloaded")
    if key and sess:
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(key)}, {json.dumps(sess)})"
        )


async def run(reduced_motion: str):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            reduced_motion=reduced_motion,
        )
        page = await context.new_page()
        await restore_session(context, page)
        await page.goto(BASE + ROUTE, wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)

        if reduced_motion == "no-preference":
            # 1. Skip link
            await page.keyboard.press("Tab")
            skip = page.locator("a.skip-to-content")
            focused_text = await page.evaluate("document.activeElement?.textContent?.trim()")
            check("skip link is first tab stop", focused_text == "Skip to main content", focused_text)
            await page.wait_for_timeout(400)
            box = await skip.bounding_box()
            visible = box is not None and box["y"] >= 0
            check("skip link becomes visible on focus", bool(visible))
            await page.keyboard.press("Enter")
            await page.wait_for_timeout(400)
            active_id = await page.evaluate("document.activeElement?.id")
            check("skip link moves focus to <main>", active_id == "main-content", active_id)

            # 2. Visible focus indicator
            # keyboard-driven focus so :focus-visible applies
            await page.keyboard.press("Tab")
            outline = await page.evaluate(
                """() => {
                    const s = getComputedStyle(document.activeElement);
                    return { outline: s.outlineWidth, style: s.outlineStyle, shadow: s.boxShadow, tag: document.activeElement.tagName };
                }"""
            )
            has_ring = outline["style"] != "none" and outline["outline"] not in ("0px", "")
            check("focused tab has visible outline", has_ring, outline)

            # 3. ARIA roles + keyboard tab switching
            tablist = page.locator('[role="tablist"]')
            check("tablist exists", await tablist.count() == 1)
            tabs = page.locator('[role="tab"]')
            n = await tabs.count()
            check("four tabs rendered", n == 4, n)
            panel = page.locator('#profile-tabpanel[role="tabpanel"]')
            check("tabpanel exists", await panel.count() == 1)

            first_selected = await page.evaluate(
                "document.querySelector('[role=\"tab\"][aria-selected=\"true\"]')?.id"
            )
            await page.locator('[role="tab"][aria-selected="true"]').focus()
            await page.keyboard.press("ArrowRight")
            await page.wait_for_timeout(400)
            second_selected = await page.evaluate(
                "document.querySelector('[role=\"tab\"][aria-selected=\"true\"]')?.id"
            )
            check("ArrowRight switches selected tab", first_selected != second_selected,
                  f"{first_selected} -> {second_selected}")
            labelled = await page.evaluate(
                "document.getElementById('profile-tabpanel')?.getAttribute('aria-labelledby')"
            )
            check("tabpanel is labelled by active tab", labelled == second_selected, labelled)

            # click switching still works
            await tabs.nth(3).click()
            await page.wait_for_timeout(300)
            clicked = await tabs.nth(3).get_attribute("aria-selected")
            check("click switches tab", clicked == "true", clicked)

            # stat pills / perk tiles are real buttons with labels
            unlabeled = await page.evaluate(
                """() => [...document.querySelectorAll('button')]
                     .filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length"""
            )
            check("no unlabeled buttons", unlabeled == 0, unlabeled)

            await page.screenshot(path=str(SHOTS / "profile_a11y.png"))
        else:
            # 4. Reduced motion
            durations = await page.evaluate(
                """() => [...document.querySelectorAll('*')]
                     .map(el => getComputedStyle(el))
                     .filter(s => parseFloat(s.transitionDuration) > 0.01 ||
                                  parseFloat(s.animationDuration) > 0.01).length"""
            )
            check("reduced-motion disables transitions/animations", durations == 0, durations)
            await page.screenshot(path=str(SHOTS / "profile_reduced_motion.png"))

        await browser.close()


async def main():
    await run("no-preference")
    await run("reduce")
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    if failed:
        raise SystemExit(1)

asyncio.run(main())
