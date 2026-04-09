import os
from playwright.sync_api import sync_playwright

def test_canvas(page):
    # Navigate to the local server
    page.goto("http://localhost:5176/")

    # Wait for the main app to load
    page.wait_for_selector('text=PCF Studio')

    # Click the PCF Fixer tab (it has the id pcf-fixer-tab, or look for text)
    page.click('text="PCF Fixer"')

    # We need to make sure the tab is open. PCF Fixer tab contains "Data Table"
    page.wait_for_selector('text="Data Table"')

    page.screenshot(path="screenshot_frontend.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        test_canvas(page)
        browser.close()
