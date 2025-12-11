import re
import asyncio
import aiohttp
import requests
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator




def parse_definition(html):
    """Parse HTML to extract definitions list"""
    definitions = []
    
    soup = BeautifulSoup(html, "html.parser")
    # Quick access usually contains the numbered definitions
    quick_access = soup.find("div", id="quick-access")

    if quick_access:
        spans = quick_access.find_all("span")
        # Text cleaning: Remove empty strings
        # Text cleaning: Remove empty strings and numbering "1 . ", "2 . "
        raw_texts = [s.get_text(strip=True) for s in spans]
        
        cleaned_defs = []
        for text in raw_texts:
            if not text:
                continue
            # Remove leading numbers and dots (e.g. "1 . ", "2.")
            clean_text = re.sub(r'^\d+\s*\.\s*', '', text).strip()
            if clean_text:
                cleaned_defs.append(clean_text)
                
        definitions = cleaned_defs
    
    return definitions

async def scrape_persian_definitions(german_word: str) -> list[str]:
    """Async version of definition scraper"""
    url = f"https://dic.b-amooz.com/de/dictionary/w?word={german_word}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.78 Safari/537.36",
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    html = await response.text()
                    loop = asyncio.get_running_loop()
                    return await loop.run_in_executor(None, parse_definition, html)
    except Exception as e:
        print(f"Error fetching definition async: {e}")
    return []




async def translate_text_async(text: str, source: str = 'de', target: str = 'en') -> str:
    """
    Generic async translation using GoogleTranslator (deep-translator).
    This supports the user's desire for a wide variety of languages eventually.
    """
    try:
        # deep-translator is blocking, so run in executor
        loop = asyncio.get_running_loop()
        def _translate():
            translator = GoogleTranslator(source=source, target=target)
            return translator.translate(text)
        
        result = await loop.run_in_executor(None, _translate)
        return result if result else ""
    except Exception as e:
        print(f"Error translating to {target}: {e}")
        return ""
