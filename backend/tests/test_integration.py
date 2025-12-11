from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_lookup_endpoint():
    response = client.post("/api/lookup", json={"word": "Haus"})
    assert response.status_code == 200
    data = response.json()
    
    print("Response Keys:", data.keys())
    print("English Definition:", data.get("english_definition"))
    
    assert "english_definition" in data
    assert data["english_definition"] is not None
    # Google translate 'Haus' should contain 'House' or similar
    assert "house" in data["english_definition"].lower()

if __name__ == "__main__":
    test_lookup_endpoint()
