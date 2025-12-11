from bs4 import BeautifulSoup
import requests
from deep_translator import LingueeTranslator

def test_persian_multiple_meanings(word):
    print(f"--- Persian (B-amooz) for '{word}' ---")
    url = f"https://dic.b-amooz.com/de/dictionary/w?word={word}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.78 Safari/537.36",
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            definitions_div = soup.find("div", id="quick-access")
            if definitions_div:
                spans = definitions_div.find_all("span")
                # Filter out numbers and punctuation if possible, usually they are itemized
                meanings = [s.get_text(strip=True) for s in spans if s.get_text(strip=True)]
                print(f"Meanings found: {meanings}")
            else:
                print("No quick access definitions found.")
        else:
            print(f"Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

def test_english_multiple_meanings(word):
    print(f"\n--- English (Linguee) for '{word}' ---")
    try:
        # LingueeTranslator usually returns a single string.
        # Let's see if we can get more by using it differently or if it joins them.
        translator = LingueeTranslator(source='german', target='english')
        translation = translator.translate(word)
        print(f"Linguee standard: {translation}")
        
    except Exception as e:
        print(f"Linguee Error: {e}")

def test_dictcc_english(word):
    print(f"\n--- English (Dict.cc) for '{word}' ---")
    url = f"https://www.dict.cc/?s={word}"
    headers = {
        "User-Agent": "Mozilla/5.0",
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            # Dict.cc structure: td class='td7nl' contains the English words
            # But it's a table. A simple approach is finding bold tags inside links?
            # Or rows with id starting with 'tr'
            # Let's just dump the first few 'td7nl'
            tds = soup.find_all("td", class_="td7nl")
            
            # The structure is German col | English col. We need to distinguish.
            # Usually the English column is on one side.
            # Let's just collect all text and see what we get for now.
            results = []
            for td in tds[:10]: # First 10
                 # Filter checks if it is english (usually has specific attributes or position)
                 # For now, just print raw text
                 text = td.get_text(strip=True)
                 if text and word.lower() not in text.lower(): # Basic filter to exclude the German word itself
                     results.append(text)
            
            # Deduplicate
            results = list(dict.fromkeys(results))
            print(f"Dict.cc Candidates: {results}")

    except Exception as e:
        print(f"Dict.cc Error: {e}")

def test_linguee_manual(word):
    print(f"\n--- English (Linguee Manual) for '{word}' ---")
    url = f"https://www.linguee.com/german-english/translation/{word}.html"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            # Linguee 'exact' matches
            exact_div = soup.find("div", class_="exact")
            if exact_div:
                # Lemmas usually in h3 > a.dictLink
                lemmas = exact_div.find_all("a", class_="dictLink")
                # This finds the German word too. We want the translation.
                # Translations are usually in span.tag_trans > a.dictLink
                
                # Better approach: find 'lemma' blocks
                lemma_blocks = exact_div.find_all("div", class_="lemma")
                results = []
                for lemma in lemma_blocks:
                    # The English translations are in 'featured'
                    featured = lemma.find("div", class_="featured")
                    if featured:
                        # translation links
                        trans_links = featured.find_all("a", class_="dictLink")
                        for link in trans_links:
                             if link.get_text(strip=True):
                                 results.append(link.get_text(strip=True))
                
                # Deduplicate
                results = list(dict.fromkeys(results))
                print(f"Linguee Manual: {results}")

    except Exception as e:
        print(f"Linguee Manual Error: {e}")

if __name__ == "__main__":
    word = "Zug"
    test_persian_multiple_meanings(word)
    # test_english_multiple_meanings(word) # Skip lib
    test_linguee_manual(word)
