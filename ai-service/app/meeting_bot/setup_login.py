import asyncio
import os
from playwright.async_api import async_playwright

async def setup_persistent_login():
    """
    Launches Chrome in a persistent context.
    Allows the user to log in manually, bypassing bot blocks.
    The session is saved and can be reused by the actual meeting bot.
    """
    profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../google_profile"))
    
    print(f"Creating/Using profile directory at: {profile_dir}")
    print("Launching browser... PLEASE LOG IN TO GOOGLE WHEN IT OPENS.")
    print("Once you are fully logged in and see your Google account picture, you can close the browser window.")

    async with async_playwright() as p:
        # We use a persistent context so cookies and local storage are saved to disk
        context = await p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=False, # Must be False so user can see and type
            args=[
                '--disable-blink-features=AutomationControlled',
                '--start-maximized'
            ]
        )
        
        page = await context.new_page()
        
        # Go to Google Login
        await page.goto("https://accounts.google.com/signin")
        
        print("\n*** Waiting for you to log in... ***")
        print("1. Enter your email")
        print("2. Enter your password")
        print("3. Wait until you are redirected to the Google My Account page.")
        
        # Wait until the user closes the browser manually
        try:
            # We wait until all pages in the context are closed
            while len(context.pages) > 0:
                await asyncio.sleep(1)
        except Exception:
            pass

        print("\nBrowser closed. Persistent session saved successfully!")

if __name__ == "__main__":
    asyncio.run(setup_persistent_login())
