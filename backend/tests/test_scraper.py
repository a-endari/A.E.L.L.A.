import requests
from bs4 import BeautifulSoup

def test_scrape_article(word):
    url = f"https://dic.b-amooz.com/de/dictionary/w?word={word}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.78 Safari/537.36",
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            h1 = soup.find("h1", class_="mdc-typography--headline4 ltr d-inline position-relative")
            if h1:
                print(f"H1 Text: '{h1.get_text(strip=True)}'")
            else:
                print("H1 tag not found")
        else:
            print(f"Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_scrape_article("Haus")
