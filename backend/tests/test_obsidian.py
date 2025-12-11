import io
import zipfile
import asyncio
from app.services.obsidian import create_obsidian_zip
from unittest.mock import MagicMock, patch

async def test_obsidian_zip_structure():
    # Dummy data
    cards = [
        {
            "clean_word": "Haus",
            "english_definition": "House",
            "definition": "خانه",
            "synonyms": ["Heim", "Gebäude"],
            "audio_url": "http://example.com/audio.mp3"
        }
    ]

    # Mock aiohttp to avoid real network call
    mock_response = MagicMock()
    mock_response.status = 200
    # Mock bytes response
    future = asyncio.Future()
    future.set_result(b'fake_mp3_data')
    mock_response.read.return_value = future
    
    # Async mock for context manager
    mock_response.__aenter__.return_value = mock_response
    mock_response.__aexit__.return_value = None

    with patch('aiohttp.ClientSession.get', return_value=mock_response):
        zip_buffer = await create_obsidian_zip(cards)
        
    assert isinstance(zip_buffer, io.BytesIO)
    
    with zipfile.ZipFile(zip_buffer, 'r') as zf:
        file_list = zf.namelist()
        print(f"Zip contents: {file_list}")
        
        assert "README.md" in file_list
        assert "Words.md" in file_list
        assert "Media/Haus.mp3" in file_list
        
        # Check Words.md content
        words_md = zf.read("Words.md").decode('utf-8')
        assert "# My Vocabulary" in words_md
        assert "## Haus" in words_md
        assert "![[Haus.mp3]]" in words_md
        assert "> [!NOTE] Synonyms" in words_md
        assert "Heim, Gebäude" in words_md

    print("Obsidian Zip Test Passed!")

if __name__ == "__main__":
    # If running directly without pytest
    import asyncio
    loop = asyncio.new_event_loop()
    loop.run_until_complete(test_obsidian_zip_structure())
