from deep_translator import GoogleTranslator

def test_algo():
    # Test German to English
    word = "Haus"
    translator = GoogleTranslator(source='de', target='en')
    translation = translator.translate(word)
    print(f"Original: {word}")
    print(f"Translation: {translation}")

    word2 = "laufen"
    translation2 = translator.translate(word2)
    print(f"Original: {word2}")
    print(f"Translation: {translation2}")

if __name__ == "__main__":
    test_algo()
