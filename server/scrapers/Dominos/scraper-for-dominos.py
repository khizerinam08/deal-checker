import json
import time
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv

load_dotenv() # Ensure you have DATABASE_URL in a .env file

def save_to_db(deals_data):
    conn = None
    try:
        # 1. Connect to Neon
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()

        print(f"🚀 Connecting to Neon to sync {len(deals_data)} deals...")

        # 2. Clear old deals (Optional: depending on if you want to refresh or append)
        cur.execute("TRUNCATE TABLE deals RESTART IDENTITY CASCADE;")

        for deal in deals_data:
            # 3. Insert Parent Deal
            cur.execute("""
                INSERT INTO deals (deal_name, price_pkr, description, image_url, product_url, source)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                deal['deal_name'], deal['price_pkr'], deal['description'],
                deal['image_url'], deal['product_url'], deal['source']
            ))
            
            deal_id = cur.fetchone()[0]

            # 4. Insert Child Items (Breakdown)
            if deal['items_breakdown']:
                item_values = [
                    (deal_id, item['item'], item['qty'])
                    for item in deal['items_breakdown']
                ]
                execute_values(cur, """
                    INSERT INTO deal_items (deal_id, item, qty)
                    VALUES %s
                """, item_values)

        conn.commit()
        print("✅ Database sync complete!")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Database error: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

# --- CONFIGURATION ---
URL = "https://www.dominos.com.pk/menu"
# Use absolute path based on script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "../../output-of-scrapers/Dominos/dominos_deals.json")
# Ensure output directory exists
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

# --- ITEM TYPES (for breakdown categorization) ---
ITEM_PATTERNS = {
    "large_pizza": r'(\d+)?\s*large\s*(?:classic\s*)?pizza',
    "medium_pizza": r'(\d+)?\s*medium\s*(?:classic\s*)?pizza',
    "small_pizza": r'(\d+)?\s*small\s*pizza',
    "loaded_pizza_roll": r'loaded\s*pizza\s*roll',
    "pizza_roll": r'pizza\s*roll',
    "meltz": r'meltz',
    "wings_6pcs": r'(\d+)\s*(?:pcs?\s*)?wings',
    "side": r'(\d+)?\s*side',
    "drink_1.5l": r'1\.5.*(?:ltr|liter)',
    "drink_small": r'drink',
    "dessert": r'(?:lava\s*cake|cake|dessert)',
}

def extract_items_breakdown(title, description):
    """
    Extracts items from deal text for categorization (without scoring).
    Returns: items_breakdown list
    """
    text = (title + " " + description).lower()
    items_found = []
    
    # Check for large pizza
    large_match = re.findall(r'(\d+)?\s*large\s*(?:classic\s*)?pizza', text)
    for match in large_match:
        qty = int(match) if match else 1
        items_found.append({"item": "large_pizza", "qty": qty})
    
    # Check for medium pizza
    medium_match = re.findall(r'(\d+)?\s*medium\s*(?:classic\s*)?pizza', text)
    for match in medium_match:
        qty = int(match) if match else 1
        items_found.append({"item": "medium_pizza", "qty": qty})
    
    # Check for small pizza
    small_match = re.findall(r'(\d+)?\s*small\s*pizza', text)
    for match in small_match:
        qty = int(match) if match else 1
        items_found.append({"item": "small_pizza", "qty": qty})
    
    # Check for loaded pizza roll
    if "loaded pizza roll" in text:
        items_found.append({"item": "loaded_pizza_roll", "qty": 1})
    elif "pizza roll" in text:
        items_found.append({"item": "pizza_roll", "qty": 1})
    
    # Check for meltz
    if "meltz" in text:
        items_found.append({"item": "meltz", "qty": 1})
    
    # Check for wings
    wings_match = re.findall(r'(\d+)\s*(?:pcs?\s*)?wings', text)
    if wings_match:
        qty = int(wings_match[0])
        items_found.append({"item": "wings_6pcs", "qty": max(1, qty // 6)})
    
    # Check for sides
    sides_match = re.findall(r'(\d+)?\s*side', text)
    for match in sides_match:
        qty = int(match) if match else 1
        items_found.append({"item": "side", "qty": qty})
    
    # Check for drinks
    if "1.5" in text and ("ltr" in text or "liter" in text):
        items_found.append({"item": "drink_1.5l", "qty": 1})
    elif "drink" in text:
        drink_match = re.findall(r'(\d+)?\s*(?:small\s*)?drink', text)
        qty = int(drink_match[0]) if drink_match and drink_match[0] else 1
        items_found.append({"item": "drink_small", "qty": qty})
    
    # Check for dessert
    if "lava cake" in text or "cake" in text or "dessert" in text:
        items_found.append({"item": "dessert", "qty": 1})
    
    return items_found


# --- MAIN SCRAPER ---
def scrape_dominos():
    # Setup Chrome Driver (Headless for speed, remove 'headless' to see it working)
    options = webdriver.ChromeOptions()
    options.add_argument("--headless") 
    
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    try:
        print(f"🍕 Navigating to {URL}...")
        driver.get(URL)
        
        # Wait for the menu to load (Domino's is a heavy Single Page App)
        wait = WebDriverWait(driver, 15)
        # We wait for any price text to appear as a sign content is ready
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Rs.')]")))
        
        # Scroll down to trigger lazy loading images
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
            
        print("✅ Page loaded. Extracting deals...")

        deals_data = []
        
        # STRATEGY: Use JavaScript to extract ONLY DEALS (not regular menu items)
        # The website distinguishes deals from regular items via href attribute:
        # - Deals: href starts with "#combo_" (e.g., #combo_EPICMediumDeal_224)
        # - Regular items: href starts with "#item_" (e.g., #item_AlfredoPizza_148)
        # 
        # NOTE: Each deal has TWO anchor tags with the same href:
        # 1. First anchor inside .menue-card contains the image
        # 2. Second anchor inside .menue-details contains title/price/description
        # We need to look up the image from the sibling .menue-card element
        extraction_script = """
        const allLinks = document.querySelectorAll('a[href^="#combo_"]');
        let results = [];
        let seen = new Set();
        
        allLinks.forEach((anchor) => {
            const href = anchor.getAttribute('href') || '';
            const priceSpan = anchor.querySelector('.card-price');
            const h3 = anchor.querySelector('h3');
            const p = anchor.querySelector('p');
            
            // Only process anchors that have title and price (these are in .menue-details)
            if (!h3 || !priceSpan) return;
            
            const title = h3.textContent.trim();
            const priceText = priceSpan.textContent.trim();
            const description = p ? p.textContent.trim() : '';
            
            // Find image from sibling .menue-card element
            // Structure: .menu-card > .menue-card (with img) + .menue-card-content (with this anchor)
            // Use .closest('.menu-card') to find the shared parent container
            let imageUrl = null;
            const card = anchor.closest('.menu-card');
            if (card) {
                const img = card.querySelector('.menu-img');
                if (img && img.src) {
                    imageUrl = img.src;
                }
            }
            
            // Create unique ID
            const dealId = title + '-' + priceText;
            if (!seen.has(dealId) && title && priceText.includes('Rs.')) {
                seen.add(dealId);
                results.push({
                    title: title,
                    price: priceText,
                    description: description,
                    imageUrl: imageUrl,
                    href: href
                });
            }
        });
        return results;
        """
        
        menu_items = driver.execute_script(extraction_script)
        print(f"Found {len(menu_items)} DEALS via JavaScript extraction (filtered by #combo_ href)")
        
        unique_deals = set() # To avoid duplicates
        
        for item in menu_items:
            try:
                title = item.get('title', '')
                price_text = item.get('price', '')
                description = item.get('description', '')
                image_url = item.get('imageUrl')
                href = item.get('href', '')
                
                if not title or not price_text or "Rs." not in price_text:
                    continue
                
                # Clean price (Remove "Rs." and commas)
                clean_price = int(''.join(filter(str.isdigit, price_text)))
                
                # Generate Unique ID to prevent duplicates
                deal_id = f"{title}-{clean_price}"
                if deal_id in unique_deals or clean_price < 100: # Skip sauces/tiny items
                    continue
                unique_deals.add(deal_id)

                # Extract items breakdown (for categorization only)
                items_breakdown = extract_items_breakdown(title, description)
                
                # Construct full product URL from href
                product_url = f"{URL}{href}" if href else None

                # Apply Schema (without satiety scoring)
                deal_obj = {
                    "deal_name": title,
                    "price_pkr": clean_price,
                    "description": description,
                    "items_breakdown": items_breakdown,  # List of extracted items
                    "image_url": image_url,
                    "product_url": product_url,          # Link to the deal on Dominos website
                    "source": "Dominos PK"
                }
                
                deals_data.append(deal_obj)
                print(f"Found: {title} - {clean_price} PKR")

            except Exception as e:
                continue # Skip broken items

        # Save to JSON
        with open(OUTPUT_FILE, "w", encoding='utf-8') as f:
            json.dump(deals_data, f, indent=4, ensure_ascii=False)
            
        print(f"\n🎉 Success! Scraped {len(deals_data)} deals. Saved to {OUTPUT_FILE}")
        return deals_data

    finally:
        driver.quit()

if __name__ == "__main__":
    deals_data = scrape_dominos()
    save_to_db(deals_data)