from deep_translator import LingueeTranslator

def test_linguee():
    try:
        # Test German to English
        word = "Haus"
        translator = LingueeTranslator(source='german', target='english')
        translation = translator.translate(word)
        print(f"Original: {word}")
        print(f"Linguee Translation: {translation}")
        
    except Exception as e:
        print(f"Linguee Error: {e}")

if __name__ == "__main__":
    test_linguee()
