import json
import time
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- CONFIGURATION ---
URL = "https://www.dominos.com.pk/menu"
OUTPUT_FILE = "../../output-of-scrapers/Dominos/dominos_deals.json"

# --- SATIETY SCORING SYSTEM ---
# Base scores for individual items (Fuel Units)
# These can be calibrated based on user feedback
ITEM_SCORES = {
    # Pizzas (by size)
    "large_pizza": 40,      # A large pizza = 40 fuel units
    "medium_pizza": 25,     # A medium pizza = 25 fuel units  
    "small_pizza": 15,      # A small pizza = 15 fuel units
    
    # Other Items (to be calibrated by user)
    "meltz": 12,            # Placeholder - user to provide
    "pizza_roll": 12,       # Placeholder - user to provide
    "loaded_pizza_roll": 12,# Placeholder - user to provide
    "side": 8,              # Generic side item
    "wings_6pcs": 12,       # 6 piece wings
    "wings_4pcs": 8,        # 4 piece wings
    "kickers_6pcs": 10,     # Chicken kickers
    "strips_4pcs": 10,      # Chicken strips
    "dessert": 5,           # Lava cake, etc.
    "drink_small": 2,       # Small drink
    "drink_1.5l": 4,        # 1.5L drink (sharing)
}

def extract_items_and_score(title, description):
    """
    Uses regex to extract quantities and item types from deal text.
    Returns: (total_score, items_breakdown, tier)
    """
    text = (title + " " + description).lower()
    items_found = []
    total_score = 0
    
    # --- PIZZA EXTRACTION ---
    # Pattern: "X Large Pizza" or "Large Pizza" (default qty = 1)
    large_match = re.findall(r'(\d+)?\s*large\s*(?:classic\s*)?pizza', text)
    for match in large_match:
        qty = int(match) if match else 1
        items_found.append({"item": "large_pizza", "qty": qty, "score": qty * ITEM_SCORES["large_pizza"]})
        total_score += qty * ITEM_SCORES["large_pizza"]
    
    medium_match = re.findall(r'(\d+)?\s*medium\s*(?:classic\s*)?pizza', text)
    for match in medium_match:
        qty = int(match) if match else 1
        items_found.append({"item": "medium_pizza", "qty": qty, "score": qty * ITEM_SCORES["medium_pizza"]})
        total_score += qty * ITEM_SCORES["medium_pizza"]
    
    small_match = re.findall(r'(\d+)?\s*small\s*pizza', text)
    for match in small_match:
        qty = int(match) if match else 1
        items_found.append({"item": "small_pizza", "qty": qty, "score": qty * ITEM_SCORES["small_pizza"]})
        total_score += qty * ITEM_SCORES["small_pizza"]
    
    # --- LOADED PIZZA ROLL ---
    if "loaded pizza roll" in text:
        roll_match = re.findall(r'(\d+)?\s*(?:loaded\s*)?pizza\s*roll', text)
        qty = int(roll_match[0]) if roll_match and roll_match[0] else 1
        items_found.append({"item": "loaded_pizza_roll", "qty": qty, "score": qty * ITEM_SCORES["loaded_pizza_roll"]})
        total_score += qty * ITEM_SCORES["loaded_pizza_roll"]
    elif "pizza roll" in text:
        roll_match = re.findall(r'(\d+)?\s*pizza\s*roll', text)
        qty = int(roll_match[0]) if roll_match and roll_match[0] else 1
        items_found.append({"item": "pizza_roll", "qty": qty, "score": qty * ITEM_SCORES["pizza_roll"]})
        total_score += qty * ITEM_SCORES["pizza_roll"]
    
    # --- MELTZ ---
    if "meltz" in text:
        items_found.append({"item": "meltz", "qty": 1, "score": ITEM_SCORES["meltz"]})
        total_score += ITEM_SCORES["meltz"]
    
    # --- WINGS ---
    wings_match = re.findall(r'(\d+)\s*(?:pcs?\s*)?wings', text)
    if wings_match:
        qty = int(wings_match[0])
        if qty >= 6:
            items_found.append({"item": "wings_6pcs", "qty": qty // 6, "score": (qty // 6) * ITEM_SCORES["wings_6pcs"]})
            total_score += (qty // 6) * ITEM_SCORES["wings_6pcs"]
        else:
            items_found.append({"item": "wings_4pcs", "qty": 1, "score": ITEM_SCORES["wings_4pcs"]})
            total_score += ITEM_SCORES["wings_4pcs"]
    
    # --- SIDES (generic) ---
    sides_match = re.findall(r'(\d+)?\s*side', text)
    for match in sides_match:
        qty = int(match) if match else 1
        items_found.append({"item": "side", "qty": qty, "score": qty * ITEM_SCORES["side"]})
        total_score += qty * ITEM_SCORES["side"]
    
    # --- DRINKS ---
    if "1.5" in text and ("ltr" in text or "liter" in text):
        items_found.append({"item": "drink_1.5l", "qty": 1, "score": ITEM_SCORES["drink_1.5l"]})
        total_score += ITEM_SCORES["drink_1.5l"]
    elif "drink" in text:
        drink_match = re.findall(r'(\d+)?\s*(?:small\s*)?drink', text)
        qty = int(drink_match[0]) if drink_match and drink_match[0] else 1
        items_found.append({"item": "drink_small", "qty": qty, "score": qty * ITEM_SCORES["drink_small"]})
        total_score += qty * ITEM_SCORES["drink_small"]
    
    # --- DESSERT (lava cake, etc.) ---
    if "lava cake" in text or "cake" in text or "dessert" in text:
        items_found.append({"item": "dessert", "qty": 1, "score": ITEM_SCORES["dessert"]})
        total_score += ITEM_SCORES["dessert"]
    
    # --- TIERING ---
    if total_score >= 30:
        tier = "Heavy Meal (Sharing)"
    elif total_score >= 15:
        tier = "Standard Meal"
    else:
        tier = "Snack / Light"
    
    return total_score, items_found, tier

# --- MAIN SCRAPER ---
def scrape_dominos():
    # Setup Chrome Driver (Headless for speed, remove 'headless' to see it working)
    options = webdriver.ChromeOptions()
    options.add_argument("--headless") 
    
    
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

                # Extract satiety score and items breakdown
                satiety_score, items_breakdown, satiety_tier = extract_items_and_score(title, description)
                
                # Construct full product URL from href
                product_url = f"{URL}{href}" if href else None

                # Apply Schema with enhanced satiety data
                deal_obj = {
                    "deal_name": title,
                    "price_pkr": clean_price,
                    "description": description,
                    "satiety_score": satiety_score,          # Raw fuel units score
                    "items_breakdown": items_breakdown,       # List of extracted items with individual scores
                    "satiety_tier": satiety_tier,             # Human-readable tier
                    "image_url": image_url,
                    "product_url": product_url,               # Link to the deal on Dominos website
                    "source": "Dominos PK"
                }
                
                deals_data.append(deal_obj)
                print(f"Found: {title} - {clean_price} PKR ({deal_obj['satiety_tier']})")

            except Exception as e:
                continue # Skip broken items

        # Save to JSON
        with open(OUTPUT_FILE, "w", encoding='utf-8') as f:
            json.dump(deals_data, f, indent=4, ensure_ascii=False)
            
        print(f"\n🎉 Success! Scraped {len(deals_data)} deals. Saved to {OUTPUT_FILE}")

    finally:
        driver.quit()

if __name__ == "__main__":
    scrape_dominos()