from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from app.services.translation import translate_text_async, scrape_persian_definitions
from app.services.synonyms import get_synonyms_async
from app.services.pronunciation import get_audio_url_async
from app.services.text_processing import remove_article
from app.services.anki import create_deck
from app.services.obsidian import create_obsidian_zip
from app.services.db import get_lists, create_list, delete_list, get_cards_for_list, add_card, delete_card
from fastapi.responses import Response

app = FastAPI(title="Universal Language App API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WordRequest(BaseModel):
    word: str
    include_persian: bool = True

@app.get("/")
def read_root():
    return {"message": "Universal Language App API is running"}

@app.post("/api/lookup")
async def lookup_word(request: WordRequest):
    raw_word = request.word.strip()
    if not raw_word:
        raise HTTPException(status_code=400, detail="Word cannot be empty")

    # Clean word for processing (removing articles etc)
    clean_word = remove_article(raw_word)

    # Fetch data in parallel
    # Replacing specialized grabber with generic translator as requested    # Run tasks concurrently
    # definition_future = definition_grabber_async(clean_word) # Old
    
    definition_future = None
    if request.include_persian:
        definition_future = scrape_persian_definitions(clean_word) # New
    
    audio_future = get_audio_url_async(clean_word)
    
    english_future = translate_text_async(clean_word, source='de', target='en')
    
    synonyms_future = get_synonyms_async(clean_word)

    definitions_list = await definition_future if definition_future else []
    audio_data = await audio_future
    english_definition = await english_future
    synonyms = await synonyms_future

    audio_url = audio_data.get("audio_url") if audio_data else None
    canonical_word = audio_data.get("canonical_word") if audio_data else None

    # Use canonical word (with correct article) as clean_word for display if available
    # Otherwise fallback to the locally cleaned word
    final_display_word = canonical_word if canonical_word else clean_word

    return {
        "original_word": raw_word,
        "clean_word": final_display_word, # Updates the main display to be "das Haus"
        "definitions": definitions_list, # List[str]
        "english_definition": english_definition,
        "synonyms": synonyms,
        "audio_url": audio_url
    }

class AnkiRequest(BaseModel):
    cards: list[dict]

@app.post("/api/anki/download")
async def download_anki_deck(request: AnkiRequest, deck_name: str = "Universal Language Deck"):
    # Note: deck_name can be passed as query param
    deck_stream = create_deck(request.cards, deck_name)
    filename = f"{deck_name.replace(' ', '_')}.apkg"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
    return Response(content=deck_stream.read(), media_type="application/octet-stream", headers=headers)

@app.post("/api/obsidian/download")
async def download_obsidian_zip(request: AnkiRequest, note_name: str = "My Vocabulary"):
    # Note: note_name can be passed as query param
    zip_stream = await create_obsidian_zip(request.cards) # Obsidian logic might need update too if we want to change internal filename
    filename = f"{note_name.replace(' ', '_')}.zip"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
    return Response(content=zip_stream.read(), media_type="application/zip", headers=headers)

class ListCreate(BaseModel):
    name: str

@app.get("/api/lists")
async def read_lists():
    return get_lists()

@app.post("/api/lists")
async def create_new_list(list_data: ListCreate):
    success = create_list(list_data.name)
    if not success:
        raise HTTPException(status_code=400, detail="List already exists")
    return {"status": "created", "name": list_data.name}

@app.delete("/api/lists/{list_id}")
async def remove_list(list_id: int):
    delete_list(list_id)
    return {"status": "deleted", "id": list_id}

@app.get("/api/lists/{list_id}/cards")
async def read_list_cards(list_id: int):
    return get_cards_for_list(list_id)

@app.post("/api/lists/{list_id}/cards")
async def save_card_to_list(list_id: int, card: dict):
    add_card(list_id, card)
    return {"status": "success", "word": card.get("clean_word")}

@app.delete("/api/lists/{list_id}/cards/{word}")
async def remove_card_from_list(list_id: int, word: str):
    delete_card(list_id, word)
    return {"status": "deleted", "word": word}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
