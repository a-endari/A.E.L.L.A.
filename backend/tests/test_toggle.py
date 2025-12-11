import sys
import os
sys.path.append(os.getcwd()) # Ensure backend is in path
from backend.main import app
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import asyncio

client = TestClient(app)

# Mock services to avoid real network calls
@patch('backend.main.scrape_persian_definitions', new_callable=AsyncMock)
@patch('backend.main.get_audio_url_async', new_callable=AsyncMock)
@patch('backend.main.translate_text_async', new_callable=AsyncMock)
@patch('backend.main.get_synonyms_async', new_callable=AsyncMock)
def test_toggle_persian_off(mock_syn, mock_trans, mock_audio, mock_persian):
    # Setup mocks
    mock_persian.return_value = ["خانه"]
    mock_audio.return_value = {"audio_url": None, "canonical_word": "Haus"}
    mock_trans.return_value = "House"
    mock_syn.return_value = []

    # Test with include_persian = False
    response = client.post("/api/lookup", json={"word": "Haus", "include_persian": False})
    
    assert response.status_code == 200
    data = response.json()
    
    # Assert Persian definition is EMPTY list
    assert data["definitions"] == []
    # Assert scrape_persian_definitions was NOT called
    mock_persian.assert_not_called()
    
    # Test with include_persian = True (Default)
    response_on = client.post("/api/lookup", json={"word": "Haus", "include_persian": True})
    assert response_on.status_code == 200
    data_on = response_on.json()
    assert data_on["definitions"] == ["خانه"]
    # Now it should have been called
    mock_persian.assert_called_once()
    
if __name__ == "__main__":
    print("Running manual test...")
    try:
        # Run the test function manually
        test_toggle_persian_off()
        print("Toggle Test Passed!")
    except Exception as e:
        print(f"Test Failed: {e}")
        import traceback
        traceback.print_exc()
