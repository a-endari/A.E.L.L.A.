from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
import asyncio
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
from app.services.translation import translate_text_async, get_word_with_article_async


from app.services.synonyms import get_synonyms_async
import urllib.parse
from app.services.pronunciation import get_audio_url_async
from app.services.text_processing import remove_article
from app.services.anki import create_deck
from app.services.obsidian import create_obsidian_zip
from app.services.db import get_lists, create_list, delete_list, get_cards_for_list, add_card, delete_card, rename_list
from fastapi.responses import Response

app = FastAPI(title="Universal Language App API")

@app.get("/")
async def root():
    return {"message": "Universal Language App API is running!"}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.constants import SUPPORTED_LANGUAGES

# ... (Previous imports)

# Ensure static directory exists
import os
os.makedirs("static/audio", exist_ok=True)

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

def cleanup_unused_audio(current_audio_file: str = None):
    """
    Deletes audio files in static/audio that are NOT in the saved vocabulary
    AND are NOT the current audio file being played.
    """
    try:
        audio_dir = "static/audio"
        if not os.path.exists(audio_dir):
            return

        # 1. Get all saved words from all lists to determine "saved" filenames
        from app.services.pronunciation import sanitize_filename
        
        lists = get_lists()
        saved_files = set()
        
        for lst in lists:
            cards = get_cards_for_list(lst['id'])
            for card in cards:
                # Reconstruct filename from card data
                # We need to know the voice used. 
                # If old cards don't have 'voice', we might miss them, 
                # but we'll assume standard format or check partial match?
                # BETTER: Store 'audio_filename' in card data.
                # FALLBACK: If card doesn't have filename, we assume default German voice or try to match.
                
                # To be safe against deleting existing user data without voice info:
                # We might need to check if the file starts with the sanitized word.
                # BUT, multiple languages might have same word "chat".
                # Let's rely on what's stored. If 'audio_url' is stored, extract filename.
                
                audio_url = card.get('audio_url')
                if audio_url:
                    filename = audio_url.split('/')[-1]
                    saved_files.add(filename)

        # 2. Add current file to kept list
        if current_audio_file:
            saved_files.add(current_audio_file)

        # 3. Iterate and delete
        deleted_count = 0
        for filename in os.listdir(audio_dir):
            if filename.endswith(".mp3"):
                if filename not in saved_files:
                    os.remove(os.path.join(audio_dir, filename))
                    deleted_count += 1
        
        if deleted_count > 0:
            print(f"Cleanup: Deleted {deleted_count} temporary audio files.")

    except Exception as e:
        print(f"Error during audio cleanup: {e}")

@app.on_event("startup")
async def startup_event():
    from app.services.db import init_db
    init_db()
    # Initial cleanup (preserve nothing extra)
    cleanup_unused_audio()

class WordRequest(BaseModel):
    word: str
    source_lang: str = "de" 
    target_lang: str = "en"
    secondary_lang: Optional[str] = None # Optional secondary language code

# ... (Routes remain same)

@app.post("/api/lookup")
async def lookup_word(request: WordRequest):
    raw_word = request.word.strip()
    if not raw_word:
        raise HTTPException(status_code=400, detail="Word cannot be empty")

    source = request.source_lang
    target = request.target_lang
    secondary = request.secondary_lang
    
    # Validate languages
    if source not in SUPPORTED_LANGUAGES:
        # Fallback or error? Let's default to 'de' if invalid or just proceed
        # if user sends purely custom codes, translation might fail.
        pass 

    # Clean word
    if source == 'de':
        clean_word = remove_article(raw_word)
    else:
        clean_word = raw_word

    # Prepare Tasks
    tasks = []
    
    # Task 1: Primary Definition (Source -> Target)
    tasks.append(translate_text_async(clean_word, source=source, target=target))

    # Task 2: Audio (Source Language)
    voice = SUPPORTED_LANGUAGES.get(source, {}).get("voice", "de-DE-KatjaNeural")
    tasks.append(get_audio_url_async(clean_word, voice=voice))

    # Task 3: Secondary Language (Optional)
    if secondary and secondary != target:
         tasks.append(translate_text_async(clean_word, source=source, target=secondary))
    elif secondary == target:
         tasks.append(asyncio.sleep(0, result="")) # Duplicate of primary
    else:
         tasks.append(asyncio.sleep(0, result=None))

    # Task 4: Synonyms (Source Language) - mostly works for big langs
    tasks.append(get_synonyms_async(clean_word))

    # Task 5: Article Detection (Only for German source for now)
    if source == 'de':
        tasks.append(get_word_with_article_async(clean_word))
    else:
        tasks.append(asyncio.sleep(0, result=None))

    # Execute
    results = await asyncio.gather(*tasks)
    
    main_def = results[0]
    audio_data = results[1]
    extra_def = results[2] # Secondary definition
    synonyms = results[3]
    article_word = results[4]

    audio_url = audio_data.get("audio_url")
    audio_filename = audio_url.split('/')[-1] if audio_url else None
    
    # Trigger cleanup?
    # User said "deleted imidiately after second search".
    # We can trigger it here in background.
    # We pass the CURRENT file so it checks it as "valid/kept"
    if audio_filename:
        # Run in background to not block response
        asyncio.create_task(asyncio.to_thread(cleanup_unused_audio, audio_filename))

    final_display_word = article_word if article_word else clean_word
    
    # Construct response
    # We maintain structure but "english_definition" might now be "target_definition"
    # "definitions" was list[str] (persian). 
    
    definitions_list = [extra_def] if extra_def else []
    
    definitions_list = [d for d in definitions_list if d] # filter empty

    return {
        "original_word": raw_word,
        "clean_word": final_display_word,
        "definitions": definitions_list, 
        "english_definition": main_def, # Renamed conceptualy to 'primary_definition' but keeping key for frontend compat
        "synonyms": synonyms,
        "audio_url": audio_url,
        "source_lang": source,
        "target_lang": target,
        "secondary_lang": secondary
    }

class AnkiRequest(BaseModel):
    cards: List[Dict[str, Any]]
    deck_name: str = "My Vocabulary"
    source_lang: str = "de"
    target_lang: str = "en"
    secondary_lang: Optional[str] = None

@app.post("/api/anki/download")
async def download_anki_deck(request: AnkiRequest):
    deck_stream = create_deck(
        request.cards, 
        request.deck_name,
        source_lang=request.source_lang,
        target_lang=request.target_lang,
        secondary_lang=request.secondary_lang
    )
    filename = f"{request.deck_name.replace(' ', '_')}.apkg"
    encoded_filename = urllib.parse.quote(filename)
    headers = {'Content-Disposition': f"attachment; filename*=UTF-8''{encoded_filename}"}
    return Response(content=deck_stream.read(), media_type="application/octet-stream", headers=headers)


class ObsidianRequest(BaseModel):
    cards: List[Dict[str, Any]]
    note_name: str = "My Vocabulary"
    source_lang: str = "de"
    target_lang: str = "en"
    secondary_lang: Optional[str] = None

@app.post("/api/obsidian/download")
async def download_obsidian_zip(request: ObsidianRequest):
    zip_stream = await create_obsidian_zip(
        request.cards, 
        request.note_name,
        source_lang=request.source_lang,
        target_lang=request.target_lang,
        secondary_lang=request.secondary_lang
    )
    filename = f"{request.note_name.replace(' ', '_')}.zip"
    encoded_filename = urllib.parse.quote(filename)
    headers = {'Content-Disposition': f"attachment; filename*=UTF-8''{encoded_filename}"}
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

class ListRename(BaseModel):
    name: str

@app.put("/api/lists/{list_id}")
async def update_list(list_id: int, data: ListRename):
    success = rename_list(list_id, data.name)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot rename General list or name already exists")
    return {"status": "renamed", "id": list_id, "name": data.name}

@app.get("/api/lists/{list_id}/cards")
async def read_list_cards(list_id: int):
    return get_cards_for_list(list_id)

@app.post("/api/lists/{list_id}/cards")
async def save_card_to_list(list_id: int, card: dict):
    if add_card(list_id, card):
        return {"status": "success", "word": card.get("clean_word")}
    else:
        # 409 Conflict for duplicates
        raise HTTPException(status_code=409, detail="Card already exists in this list")

@app.delete("/api/lists/{list_id}/cards/{word}")
async def remove_card_from_list(list_id: int, word: str):
    delete_card(list_id, word)
    return {"status": "deleted", "word": word}

@app.put("/api/lists/{list_id}/cards/{word}")
async def update_card_in_list(list_id: int, word: str, card: dict):
    # Determine the word from URL or body? Ideally they match.
    # We use URL word to identify the record.
    from app.services.db import update_card
    if update_card(list_id, word, card):
        return {"status": "updated", "word": word}
    else:
        raise HTTPException(status_code=404, detail="Card not found")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
