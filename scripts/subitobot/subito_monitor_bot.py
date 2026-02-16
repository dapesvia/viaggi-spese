"""
Subito.it Monitor Bot - GitHub Actions & Supabase Version
Esegue un singolo controllo e salva i risultati su Supabase (Tier Gratuito)
"""

import asyncio
import json
import random
import sys
import os
from datetime import datetime
from typing import List, Dict, Optional
import logging

from playwright.async_api import async_playwright, Browser, Page
from telegram import Bot
from telegram.constants import ParseMode
from supabase import create_client, Client

# ============================================================================
# CONFIGURAZIONE - Da Environment Variables (GitHub Secrets)
# ============================================================================

# Carica variabili d'ambiente (utili per GitHub Actions)
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
CHAT_ID = os.environ.get("CHAT_ID")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# URL da monitorare (BMW 320d 2005-2007)
# Nota: Puoi aggiungere più URL separati da virgola nella variabile d'ambiente SEARCH_URLS
# oppure lasciarli hardcoded qui se preferisci.
DEFAULT_SEARCH_URLS = [
    "https://www.subito.it/annunci-italia/vendita/auto/bmw/serie-3/diesel/?me=31&ys=2005&ye=2007",
]

# Se SEARCH_URLS è impostato nelle variabili d'ambiente, usa quello (separato da virgola)
env_urls = os.environ.get("SEARCH_URLS")
SEARCH_URLS = env_urls.split(",") if env_urls else DEFAULT_SEARCH_URLS

# ============================================================================
# LOGGING
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# USER AGENTS
# ============================================================================

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

# ============================================================================
# SUPABASE MANAGER
# ============================================================================

class SupabaseManager:
    """Gestisce il database Supabase per tracciare annunci già visti"""
    
    def __init__(self, url: str, key: str):
        if not url or not key:
            raise ValueError("SUPABASE_URL e SUPABASE_KEY sono richiesti!")
        self.client: Client = create_client(url, key)
    
    def is_ad_seen(self, ad_id: str) -> bool:
        """Controlla se un annuncio è già stato visto"""
        try:
            # Query alla tabella 'seen_ads'
            response = self.client.table("seen_ads").select("ad_id").eq("ad_id", ad_id).execute()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"Errore controllo Supabase: {e}")
            return False
    
    def mark_ad_seen(self, ad_id: str, title: str, price: str, url: str):
        """Segna un annuncio come visto"""
        try:
            data = {
                "ad_id": ad_id,
                "title": title,
                "price": price,
                "url": url,
                "created_at": datetime.now().isoformat()
            }
            self.client.table("seen_ads").insert(data).execute()
            logger.info(f"Annuncio salvato su Supabase: {ad_id}")
        except Exception as e:
            # Ignora errore se duplicato (unique constraint)
            if "duplicate key value" not in str(e):
                logger.error(f"Errore salvataggio Supabase: {e}")

# ============================================================================
# SCRAPER
# ============================================================================

class SubitoScraper:
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.playwright = None
    
    async def run_check(self, urls: List[str]) -> List[Dict]:
        """Esegue il controllo su tutte le URL e restituisce i nuovi annunci"""
        all_ads = []
        async with async_playwright() as p:
            # Lancia browser (headless=True per GitHub Actions)
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = await context.new_page()
            
            for url in urls:
                try:
                    logger.info(f"Scraping URL: {url}")
                    await page.goto(url, wait_until='domcontentloaded', timeout=60000)
                    await asyncio.sleep(2) # Breve attesa
                    
                    logger.info(f"Page Title: {await page.title()}")

                    # Accetta cookie (nuovo selettore più preciso)
                    try:
                        # Tenta diversi selettori per il banner cookie
                        cookie_selectors = [
                            "#onetrust-accept-btn-handler",
                            "button:has-text('Accetta')",
                            "button:has-text('Acconsento')", 
                            "[id*='cookie'] button"
                        ]
                        for sel in cookie_selectors:
                            if await page.is_visible(sel):
                                await page.click(sel)
                                await asyncio.sleep(1)
                                break
                    except:
                        pass
                    
                    # Scroll per caricare lazy load
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight/2)")
                    await asyncio.sleep(1)

                    # Estrai annunci - Strategia a cascata
                    ads_elements = []
                    selectors = [
                        "div[class*='SmallCard-module_card']", # Lista classica
                        "div[class*='BigCard-module_card']",   # Griglia
                        "div[class*='ItemCard']",              # Generico
                        "div[class*='items_item']",            # Vecchio stile
                        "div[class*='item-card']"              # Altro generico
                    ]
                    
                    for sel in selectors:
                        elements = await page.query_selector_all(sel)
                        if elements:
                            ads_elements = elements
                            logger.info(f"Trovati {len(elements)} elementi con selettore: {sel}")
                            break
                    
                    if not ads_elements:
                         logger.warning(f"NESSUN ANNUNCIO TROVATO SU {url}")
                         # DEBUG: Salva screenshot e HTML
                         timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                         await page.screenshot(path=f"debug_screenshot_{timestamp}.png")
                         content = await page.content()
                         with open(f"debug_page_{timestamp}.html", "w", encoding="utf-8") as f:
                             f.write(content)
                         logger.info(f"Salvati screenshot e HTML di debug per analisi.")


                    logger.info(f"Trovati {len(ads_elements)} potenziali annunci su {url}")
                    
                    for ad_elem in ads_elements[:10]: # Controlla i primi 10
                        try:
                            # Link
                            link_el = await ad_elem.query_selector("a")
                            if not link_el: continue
                            href = await link_el.get_attribute("href")
                            
                            # ID
                            ad_id = href.split('/')[-1].replace('.htm', '').replace('.html', '')
                            
                            # Titolo
                            title = await ad_elem.inner_text()
                            title = title.split('\n')[0] # Prendi la prima riga come titolo approssimativo
                            
                            # Prezzo (cerchiamo € nel testo)
                            text_content = await ad_elem.inner_text()
                            price = "N/A"
                            import re
                            price_match = re.search(r'€\s*[\d.]+', text_content)
                            if price_match:
                                price = price_match.group(0)
                                
                            full_url = href if href.startswith('http') else f"https://www.subito.it{href}"
                            
                            all_ads.append({
                                "id": ad_id,
                                "title": title[:50], # Tronca titolo
                                "price": price,
                                "url": full_url,
                                "location": "Vedi annuncio" # Semplificato
                            })
                            
                        except Exception as e:
                            logger.error(f"Errore parsing annuncio: {e}")
                            continue
                            
                except Exception as e:
                    logger.error(f"Errore caricamento pagina {url}: {e}")
            
            await browser.close()
        return all_ads

# ============================================================================
# NOTIFIER
# ============================================================================

async def send_telegram_notification(token: str, chat_id: str, ad: Dict):
    if not token or not chat_id:
        logger.warning("Telegram Token o Chat ID mancanti. Salto notifica.")
        return

    bot = Bot(token=token)
    message = f"""
🚗 <b>NUOVO ANNUNCIO!</b>

<b>{ad['title']}</b>
💰 {ad['price']}

<a href="{ad['url']}">👉 Vai all'annuncio</a>
    """.strip()
    
    try:
        await bot.send_message(chat_id=chat_id, text=message, parse_mode=ParseMode.HTML)
    except Exception as e:
        logger.error(f"Errore invio Telegram: {e}")

# ============================================================================
# MAIN
# ============================================================================

async def main():
    logger.info("--- Inizio Controllo Subito Bot (GitHub Actions) ---")
    
    # Verifica variabili ambiente
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("ERRORE: Variabili SUPABASE_URL o SUPABASE_KEY mancanti!")
        sys.exit(1)
        
    try:
        db = SupabaseManager(SUPABASE_URL, SUPABASE_KEY)
        scraper = SubitoScraper()
        
        # 1. Scrape
        ads = await scraper.run_check(SEARCH_URLS)
        logger.info(f"Totale annunci trovati nella scansione: {len(ads)}")
        
        # 2. Filter & Notify
        new_ads_count = 0
        for ad in ads:
            if not db.is_ad_seen(ad['id']):
                logger.info(f"Nuovo annuncio trovato: {ad['title']}")
                
                # Salva su DB
                db.mark_ad_seen(ad['id'], ad['title'], ad['price'], ad['url'])
                
                # Invia notifica
                await send_telegram_notification(TELEGRAM_TOKEN, CHAT_ID, ad)
                new_ads_count += 1
                
                # Piccola pausa tra notifiche
                await asyncio.sleep(1)
        
        logger.info(f"Controllo terminato. Nuovi annunci inviati: {new_ads_count}")
        
    except Exception as e:
        logger.error(f"Errore critico durante l'esecuzione: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
