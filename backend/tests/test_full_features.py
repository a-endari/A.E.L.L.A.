from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_features():
    response = client.post("/api/lookup", json={"word": "Haus"})
    assert response.status_code == 200
    data = response.json()
    
    print("Response Keys:", data.keys())
    
    # Verify Persian (Google Translate)
    print(f"Persian Definition: {data.get('definition')}")
    assert data["definition"] is not None
    # Google Translate usually returns "خانه" for Haus
    assert "خانه" in data["definition"] or "منزل" in data["definition"]

    # Verify Synonyms (OpenThesaurus)
    print(f"Synonyms: {data.get('synonyms')}")
    assert "synonyms" in data
    assert isinstance(data["synonyms"], list)
    assert len(data["synonyms"]) > 0
    # "Heim" or "Gebäude" are common synonyms
    assert any(s for s in data["synonyms"] if "Heim" in s or "Gebäude" in s)

if __name__ == "__main__":
    test_full_features()
