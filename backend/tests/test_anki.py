from app.services.anki import create_deck
import io

def test_anki_generation():
    cards = [
        {
            "clean_word": "Haus",
            "english_definition": "House",
            "definition": "خانه",
            "synonyms": ["Heim", "Gebäude"],
            "audio_url": "http://example.com/audio.mp3"
        }
    ]
    
    result = create_deck(cards)
    assert isinstance(result, io.BytesIO)
    content = result.getvalue()
    
    # Check if content is not empty
    assert len(content) > 0
    
    # Anki apkg files are zip files (SQLite inside). 
    # Starts with PK header for zip
    assert content.startswith(b'PK')
    
    print(f"Generated deck size: {len(content)} bytes")
    print("Anki deck generation test passed!")

if __name__ == "__main__":
    test_anki_generation()
