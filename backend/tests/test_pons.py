from deep_translator import PonsTranslator

def test_pons():
    try:
        # Test German to English
        word = "Haus"
        translator = PonsTranslator(source='de', target='en')
        translation = translator.translate(word)
        print(f"Original: {word}")
        print(f"PONS Translation: {translation}")
        
        # PONS might return a list or detailed string
        word2 = "Bank"
        translation2 = translator.translate(word2)
        print(f"Original: {word2}")
        print(f"PONS Translation: {translation2}")
    except Exception as e:
        print(f"PONS Error: {e}")

if __name__ == "__main__":
    test_pons()
